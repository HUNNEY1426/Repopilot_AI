import React, { useState } from 'react';
import { X, Copy, Download, Check, FileText } from 'lucide-react';
import type { Analysis, Repository, Issue } from '../types/index.js';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  repository: Repository | null;
  analysis: Analysis | null;
  issues: Issue[];
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  repository,
  analysis,
  issues,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !repository || !analysis) return null;

  const generateMarkdownReport = (): string => {
    return `# 🛡️ RepoPilot AI — Code Quality & Security Audit Report

**Repository:** [${repository.owner}/${repository.name}](${repository.url})  
**Primary Stack:** ${repository.language}  
**Commit SHA:** \`${analysis.commit_sha}\`  
**Date:** ${new Date(analysis.created_at).toLocaleDateString()}  
**Overall Health Indicator:** **${Math.round(analysis.overall_score)}/100**

---

## 📊 Dimension Scores

| Dimension | Score (0-100) | Evaluation |
| :--- | :--- | :--- |
| **Overall Health** | **${Math.round(analysis.overall_score)}** | ${analysis.overall_score >= 80 ? '🟢 Stable' : analysis.overall_score >= 60 ? '🟡 Moderate Risk' : '🔴 Critical Attention'} |
| **Security** | ${Math.round(analysis.scores.security)} | ${analysis.scores.security >= 80 ? 'Secure' : 'Vulnerabilities Detected'} |
| **Code Quality** | ${Math.round(analysis.scores.codeQuality)} | ${analysis.scores.codeQuality >= 80 ? 'High' : 'Refactoring Recommended'} |
| **Testing** | ${Math.round(analysis.scores.testing)} | ${analysis.metrics.estimatedTestCoverage}% estimated coverage |
| **Architecture** | ${Math.round(analysis.scores.architecture)} | Layered Modularity |
| **Documentation** | ${Math.round(analysis.scores.documentation)} | Guides & References |
| **Maintainability** | ${Math.round(analysis.scores.maintainability)} | Technical Debt Level |
| **Dependencies** | ${Math.round(analysis.scores.dependencies)} | Supply Chain Health |

---

## 📝 Executive Summary

${analysis.summary}

---

## 🔍 Detected Findings & Actionable Recommendations (${issues.length})

${issues
  .map(
    (iss, idx) => `### ${idx + 1}. [${iss.severity.toUpperCase()}] ${iss.title}
- **Category:** \`${iss.category}\`
- **File:** \`${iss.file_path}\` (Line ${iss.line_number})
- **Description:** ${iss.description}
- **Recommendation:** ${iss.recommendation}

${iss.code_snippet ? `\`\`\`${repository.language.toLowerCase()}\n${iss.code_snippet}\n\`\`\`` : ''}
`
  )
  .join('\n\n')}

---
*Report generated automatically by RepoPilot AI Autonomous Repository Reviewer.*
`;
  };

  const markdownContent = generateMarkdownReport();

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `repopilot-report-${repository.name}-${analysis.commit_sha}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} color="var(--cyan)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>Export Repository Audit Report</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Copy or download this comprehensive markdown audit report for your team, pull request documentation, or security compliance.
          </p>

          <pre
            style={{
              background: '#070a10',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '0.75rem',
              color: '#cbd5e1',
              maxHeight: '340px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {markdownContent}
          </pre>
        </div>

        <div className="modal-footer">
          <button onClick={handleCopy} className="btn btn-secondary btn-sm">
            {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
            {copied ? 'Copied to Clipboard!' : 'Copy Markdown'}
          </button>
          <button onClick={handleDownload} className="btn btn-primary btn-sm">
            <Download size={14} />
            Download .md Report
          </button>
        </div>
      </div>
    </div>
  );
};
