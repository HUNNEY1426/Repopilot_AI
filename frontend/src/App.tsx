import { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header.js';
import { HeroConnect } from './components/HeroConnect.js';
import { HealthOverview } from './components/Dashboard/HealthOverview.js';
import { ScoreBreakdown } from './components/Dashboard/ScoreBreakdown.js';
import { ArchitectureDiagram } from './components/Dashboard/ArchitectureDiagram.js';
import { HistoryChart } from './components/Dashboard/HistoryChart.js';
import { IssueFilters } from './components/Issues/IssueFilters.js';
import { IssueCard } from './components/Issues/IssueCard.js';
import { DiffModal } from './components/DiffViewer/DiffModal.js';
import { PullRequestModal } from './components/DiffViewer/PullRequestModal.js';
import { SettingsModal } from './components/SettingsModal.js';
import { ReportExportModal } from './components/ReportExportModal.js';
import { api } from './services/api.js';
import type {
  Repository,
  Analysis,
  Issue,
  DemoRepoSummary,
  AppSettings,
  PullRequest,
} from './types/index.js';
import { ShieldCheck } from 'lucide-react';

export function App() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [activeRepo, setActiveRepo] = useState<Repository | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<Analysis | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<Analysis[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [demoRepos, setDemoRepos] = useState<DemoRepoSummary[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Loading & Modal states
  const [isConnecting, setIsConnecting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isFixing, setIsFixing] = useState(false);

  const [diffIssue, setDiffIssue] = useState<Issue | null>(null);
  const [diffValidation, setDiffValidation] = useState<{ isValid: boolean; syntaxValid: boolean; error?: string } | undefined>(undefined);
  const [prIssue, setPRIssue] = useState<Issue | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [demos, repos, appSettings] = await Promise.all([
        api.getDemoRepos(),
        api.listRepositories(),
        api.getSettings(),
      ]);
      setDemoRepos(demos);
      setRepositories(repos);
      setSettings(appSettings);

      if (repos.length > 0) {
        // Pick the first repo by default
        await selectRepo(repos[0]);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  const selectRepo = async (repo: Repository) => {
    setActiveRepo(repo);
    try {
      const history = await api.getRepoHistory(repo.id);
      setAnalysisHistory(history);

      if (history.length > 0) {
        const latest = history[0];
        setActiveAnalysis(latest);
        const repoIssues = await api.getAnalysisIssues(latest.id);
        setIssues(repoIssues);
      } else {
        // If repo has never been analyzed, automatically trigger initial scan
        await runAnalysis(repo.id);
      }
    } catch (err) {
      console.error('Error selecting repo:', err);
    }
  };

  const runAnalysis = async (repoId: string) => {
    setIsScanning(true);
    try {
      const result = await api.triggerAnalysis(repoId);
      setActiveAnalysis(result.analysis);

      // Refresh history and issues
      const [history, repoIssues] = await Promise.all([
        api.getRepoHistory(repoId),
        api.getAnalysisIssues(result.analysis.id),
      ]);
      setAnalysisHistory(history);
      setIssues(repoIssues);
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnectUrl = async (url: string) => {
    setIsConnecting(true);
    try {
      const res = await api.connectRepository({ url });
      setRepositories((prev) => {
        const exists = prev.some((r) => r.id === res.repository.id);
        return exists ? prev : [res.repository, ...prev];
      });
      await selectRepo(res.repository);
      if (!res.latestAnalysis) {
        await runAnalysis(res.repository.id);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSelectDemo = async (demoId: string) => {
    setIsConnecting(true);
    try {
      const res = await api.connectRepository({ demoId });
      setRepositories((prev) => {
        const exists = prev.some((r) => r.id === res.repository.id);
        return exists ? prev : [res.repository, ...prev];
      });
      await selectRepo(res.repository);
      if (!res.latestAnalysis) {
        await runAnalysis(res.repository.id);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleOpenFix = async (issue: Issue) => {
    setDiffIssue(issue);
    setDiffValidation(undefined);

    // If suggestion does not exist, trigger fix generation
    if (!issue.suggestion) {
      setIsFixing(true);
      try {
        const result = await api.generateFix(issue.id);
        const updatedIssue: Issue = {
          ...issue,
          suggestion: result.suggestion,
          status: 'fixing',
        };
        setDiffIssue(updatedIssue);
        setDiffValidation(result.validation);
        setIssues((prev) => prev.map((i) => (i.id === issue.id ? updatedIssue : i)));
      } catch (err) {
        console.error('Failed to generate fix:', err);
      } finally {
        setIsFixing(false);
      }
    }
  };

  const handleApproveFix = async (issueId: string) => {
    try {
      await api.approveFix(issueId);
      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, status: 'approved' } : i))
      );
      if (diffIssue && diffIssue.id === issueId) {
        setDiffIssue({ ...diffIssue, status: 'approved' });
      }
    } catch (err) {
      console.error('Failed to approve fix:', err);
    }
  };

  const handleRejectFix = async (issueId: string) => {
    try {
      await api.rejectFix(issueId);
      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, status: 'rejected' } : i))
      );
      setDiffIssue(null);
    } catch (err) {
      console.error('Failed to reject fix:', err);
    }
  };

  const handleRegenerateFix = async (issueId: string) => {
    setIsFixing(true);
    try {
      const result = await api.generateFix(issueId);
      setDiffIssue((prev) =>
        prev ? { ...prev, suggestion: result.suggestion, status: 'fixing' } : null
      );
      setDiffValidation(result.validation);
      setIssues((prev) =>
        prev.map((i) =>
          i.id === issueId ? { ...i, suggestion: result.suggestion, status: 'fixing' } : i
        )
      );
    } catch (err) {
      console.error('Failed to regenerate fix:', err);
    } finally {
      setIsFixing(false);
    }
  };

  const handleSubmitPR = async (issueId: string, branchName: string): Promise<PullRequest> => {
    if (!activeAnalysis) throw new Error('No active analysis');
    const res = await api.createPullRequest(activeAnalysis.id, { issueId, branchName });
    setIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, status: 'applied' } : i))
    );
    if (diffIssue && diffIssue.id === issueId) {
      setDiffIssue({ ...diffIssue, status: 'applied' });
    }
    return res.pullRequest;
  };

  const handleSaveSettings = async (data: any) => {
    await api.updateSettings(data);
    const updated = await api.getSettings();
    setSettings(updated);
  };

  // Filtered issues computation
  const filteredIssues = useMemo(() => {
    return issues.filter((iss) => {
      if (selectedCategory !== 'all' && iss.category !== selectedCategory) return false;
      if (selectedSeverity !== 'all' && iss.severity !== selectedSeverity) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = iss.title.toLowerCase().includes(q);
        const matchDesc = iss.description.toLowerCase().includes(q);
        const matchFile = iss.file_path.toLowerCase().includes(q);
        const matchCode = (iss.code_snippet || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchFile && !matchCode) return false;
      }
      return true;
    });
  }, [issues, selectedCategory, selectedSeverity, searchQuery]);

  // Severity counts
  const severityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: issues.length };
    for (const iss of issues) {
      if (iss.severity in counts) {
        counts[iss.severity as keyof typeof counts]++;
      }
    }
    return counts;
  }, [issues]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedSeverity, searchQuery]);

  const totalPages = Math.ceil(filteredIssues.length / PAGE_SIZE) || 1;
  const paginatedIssues = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredIssues.slice(start, start + PAGE_SIZE);
  }, [filteredIssues, currentPage]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        repositories={repositories}
        activeRepo={activeRepo}
        onSelectRepo={selectRepo}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        settings={settings}
        onRefresh={() => activeRepo && runAnalysis(activeRepo.id)}
        isScanning={isScanning}
      />

      <main className="container" style={{ flex: 1, padding: '32px 24px' }}>
        {/* Connect Repository Hero */}
        <HeroConnect
          onConnectUrl={handleConnectUrl}
          onSelectDemo={handleSelectDemo}
          demoRepos={demoRepos}
          isConnecting={isConnecting}
        />

        {/* Dashboard View */}
        {activeRepo && activeAnalysis && (
          <div>
            {/* Overall Health Card */}
            <HealthOverview analysis={activeAnalysis} repository={activeRepo} />

            {/* Quality Dimensions Breakdown */}
            <ScoreBreakdown
              scores={activeAnalysis.scores}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* Architecture Diagram */}
            <ArchitectureDiagram analysis={activeAnalysis} />

            {/* Historical Scans Trend */}
            <HistoryChart
              history={analysisHistory}
              currentAnalysisId={activeAnalysis.id}
              onSelectHistoricalScan={async (scanId) => {
                const scan = analysisHistory.find((s) => s.id === scanId);
                if (scan) {
                  setActiveAnalysis(scan);
                  const scanIssues = await api.getAnalysisIssues(scanId);
                  setIssues(scanIssues);
                }
              }}
            />

            {/* Issues Section */}
            <div id="issues-section" style={{ marginTop: '36px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '800' }}>
                    Detected Issues & Remediation Opportunities
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Review findings, generate AI patches, and create Pull Requests
                  </p>
                </div>
              </div>

              {/* Filters */}
              <IssueFilters
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                selectedSeverity={selectedSeverity}
                onSelectSeverity={setSelectedSeverity}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                severityCounts={severityCounts}
              />

              {/* Issue Cards */}
              {filteredIssues.length > 0 ? (
                <div>
                  {paginatedIssues.map((iss) => (
                    <IssueCard
                      key={iss.id}
                      issue={iss}
                      onOpenFix={handleOpenFix}
                      isFixing={isFixing && diffIssue?.id === iss.id}
                    />
                  ))}

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '12px',
                        marginTop: '16px',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Showing <strong>{(currentPage - 1) * PAGE_SIZE + 1}</strong> –{' '}
                        <strong>{Math.min(currentPage * PAGE_SIZE, filteredIssues.length)}</strong> of{' '}
                        <strong>{filteredIssues.length}</strong> findings
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 14px' }}
                        >
                          Previous
                        </button>

                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0 8px' }}>
                          Page <strong style={{ color: '#fff' }}>{currentPage}</strong> of{' '}
                          <strong style={{ color: '#fff' }}>{totalPages}</strong>
                        </span>

                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 14px' }}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="glass-panel"
                  style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                  }}
                >
                  <ShieldCheck size={40} color="var(--success)" style={{ margin: '0 auto 12px' }} />
                  <h4 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '6px' }}>
                    No issues match the selected filters
                  </h4>
                  <p style={{ fontSize: '0.85rem' }}>
                    Try clearing your search query or selecting &quot;All Issues&quot; above.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '24px 0',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          marginTop: '60px',
        }}
      >
        <div className="container">
          RepoPilot AI • Autonomous GitHub Repository Code Reviewer & Patch Generator
        </div>
      </footer>

      {/* Modals */}
      <DiffModal
        issue={diffIssue}
        onClose={() => setDiffIssue(null)}
        onApprove={handleApproveFix}
        onReject={handleRejectFix}
        onRegenerate={handleRegenerateFix}
        onOpenPRModal={(iss) => {
          setDiffIssue(null);
          setPRIssue(iss);
        }}
        isGenerating={isFixing}
        validation={diffValidation}
      />

      <PullRequestModal
        issue={prIssue}
        onClose={() => setPRIssue(null)}
        onSubmitPR={handleSubmitPR}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      <ReportExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        repository={activeRepo}
        analysis={activeAnalysis}
        issues={issues}
      />
    </div>
  );
}

export default App;
