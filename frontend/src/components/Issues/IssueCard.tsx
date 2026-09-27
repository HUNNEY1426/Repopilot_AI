import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  Info,
  Sparkles,
  FileCode,
  ArrowRight,
  CheckCircle2,
  GitPullRequest,
} from 'lucide-react';
import type { Issue } from '../../types/index.js';

interface IssueCardProps {
  issue: Issue;
  onOpenFix: (issue: Issue) => void;
  isFixing: boolean;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue, onOpenFix, isFixing }) => {
  const getSeverityBadge = () => {
    switch (issue.severity) {
      case 'critical':
        return (
          <span className="badge badge-critical">
            <ShieldAlert size={12} /> Critical
          </span>
        );
      case 'high':
        return (
          <span className="badge badge-high">
            <AlertTriangle size={12} /> High
          </span>
        );
      case 'medium':
        return (
          <span className="badge badge-medium">
            <AlertCircle size={12} /> Medium
          </span>
        );
      default:
        return (
          <span className="badge badge-low">
            <Info size={12} /> {issue.severity}
          </span>
        );
    }
  };

  const hasSuggestion = Boolean(issue.suggestion);
  const isApproved = issue.status === 'approved' || issue.status === 'applied';

  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px',
        marginBottom: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        borderLeft: `4px solid ${
          issue.severity === 'critical'
            ? 'var(--critical)'
            : issue.severity === 'high'
            ? 'var(--high)'
            : issue.severity === 'medium'
            ? 'var(--medium)'
            : 'var(--low)'
        }`,
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getSeverityBadge()}
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              color: 'var(--cyan)',
              background: 'rgba(6, 182, 212, 0.08)',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(6, 182, 212, 0.2)',
            }}
          >
            {issue.category}
          </span>
          {isApproved && (
            <span className="badge badge-success" style={{ gap: '4px' }}>
              <CheckCircle2 size={12} /> Approved
            </span>
          )}
          {issue.status === 'applied' && (
            <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.2)', color: 'var(--violet)' }}>
              <GitPullRequest size={12} /> PR Created
            </span>
          )}
        </div>

        {/* File location */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <FileCode size={14} />
          <span style={{ color: 'var(--text-secondary)' }}>{issue.file_path}</span>
          {issue.line_number > 0 && <span style={{ color: 'var(--cyan)' }}>:{issue.line_number}</span>}
        </div>
      </div>

      {/* Title & Description */}
      <div>
        <h4 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '6px' }}>{issue.title}</h4>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {issue.description}
        </p>
      </div>

      {/* Code Snippet preview if available */}
      {issue.code_snippet && (
        <div
          style={{
            background: '#070a10',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            color: '#e2e8f0',
            overflowX: 'auto',
            maxHeight: '120px',
          }}
        >
          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '4px' }}>
            Flagged Code Snippet:
          </div>
          <code>{issue.code_snippet}</code>
        </div>
      )}

      {/* Footer & Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '4px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '12px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flex: 1, minWidth: '240px' }}>
          <strong style={{ color: 'var(--text-secondary)' }}>Recommendation:</strong> {issue.recommendation}
        </div>

        <button
          onClick={() => onOpenFix(issue)}
          disabled={isFixing}
          className="btn btn-primary btn-sm"
          style={{
            background: hasSuggestion
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'linear-gradient(135deg, var(--cyan) 0%, #6366f1 100%)',
          }}
        >
          <Sparkles size={14} />
          {hasSuggestion ? 'Review Proposed Fix' : 'Fix with AI'}
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
