import React, { useState } from 'react';
import { X, GitPullRequest, ExternalLink, CheckCircle2, Loader2, GitBranch } from 'lucide-react';
import type { Issue, PullRequest } from '../../types/index.js';

interface PullRequestModalProps {
  issue: Issue | null;
  onClose: () => void;
  onSubmitPR: (issueId: string, branchName: string) => Promise<PullRequest>;
}

export const PullRequestModal: React.FC<PullRequestModalProps> = ({
  issue,
  onClose,
  onSubmitPR,
}) => {
  const [branchName, setBranchName] = useState(
    issue ? `repopilot/${issue.category}-${issue.id.substring(0, 8)}` : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPR, setCreatedPR] = useState<PullRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!issue) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const pr = await onSubmitPR(issue.id, branchName.trim());
      setCreatedPR(pr);
    } catch (err: any) {
      setError(err.message || 'Failed to create Pull Request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '680px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GitPullRequest size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>Create Pull Request</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Publish validated remediation to GitHub
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {createdPR ? (
            /* Success State */
            <div
              style={{
                textAlign: 'center',
                padding: '30px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={32} color="var(--success)" />
              </div>

              <div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '6px' }}>
                  Pull Request Created Successfully!
                </h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Branch <code>{createdPR.branch_name}</code> was staged with your approved patch.
                </p>
              </div>

              {createdPR.pr_url && (
                <a
                  href={createdPR.pr_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                  style={{ gap: '8px', padding: '10px 20px', marginTop: '8px' }}
                >
                  <ExternalLink size={16} />
                  View Pull Request on GitHub #{createdPR.github_pr_number}
                </a>
              )}

              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                }}
              >
                Mode: {createdPR.status === 'simulated' ? 'Safe Demo Simulation' : 'Live GitHub Repository'}
              </span>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label className="input-label">Target Git Branch Name</label>
                <div style={{ position: 'relative' }}>
                  <GitBranch
                    size={16}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    required
                    className="input-text"
                    style={{ paddingLeft: '36px', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="input-label">Pull Request Title</label>
                <input
                  type="text"
                  readOnly
                  value={`fix(${issue.category}): ${issue.title}`}
                  className="input-text"
                  style={{ background: 'rgba(255, 255, 255, 0.03)', color: 'var(--text-secondary)' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="input-label">PR Description Preview</label>
                <div
                  style={{
                    background: '#080c14',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    maxHeight: '160px',
                    overflowY: 'auto',
                  }}
                >
                  <strong>## 🤖 AI Automated Code Review & Remediation (RepoPilot)</strong>
                  <br />
                  <br />
                  <strong>Problem:</strong> {issue.description}
                  <br />
                  <strong>File:</strong> <code>{issue.file_path}</code> (Line {issue.line_number})
                  <br />
                  <br />
                  <strong>Solution:</strong> {issue.suggestion?.explanation}
                  <br />
                  <br />
                  [x] Syntax check validated
                  <br />
                  [x] Context match verified
                  <br />
                  [x] Generated patch reviewed and approved by developer
                </div>
              </div>

              {error && (
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'var(--critical-bg)',
                    border: '1px solid var(--critical-border)',
                    color: 'var(--critical)',
                    fontSize: '0.85rem',
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !branchName.trim()}
                  className="btn btn-primary btn-sm"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Creating PR...
                    </>
                  ) : (
                    <>
                      <GitPullRequest size={14} />
                      Publish Pull Request
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
