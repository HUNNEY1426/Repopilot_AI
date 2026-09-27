import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  RefreshCw,
  GitPullRequest,
  Sparkles,
  FileCode,
  ShieldCheck,
  Columns,
  List,
} from 'lucide-react';
import type { Issue } from '../../types/index.js';

interface DiffModalProps {
  issue: Issue | null;
  onClose: () => void;
  onApprove: (issueId: string) => Promise<void>;
  onReject: (issueId: string) => Promise<void>;
  onRegenerate: (issueId: string) => Promise<void>;
  onOpenPRModal: (issue: Issue) => void;
  isGenerating: boolean;
  validation?: { isValid: boolean; syntaxValid: boolean; error?: string };
}

export const DiffModal: React.FC<DiffModalProps> = ({
  issue,
  onClose,
  onApprove,
  onReject,
  onRegenerate,
  onOpenPRModal,
  isGenerating,
  validation,
}) => {
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');

  if (!issue) return null;

  const suggestion = issue.suggestion;
  const isApproved = issue.status === 'approved' || issue.status === 'applied';

  // Parse raw diff lines
  const diffLines = (suggestion?.diff || '').split('\n');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '960px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--cyan) 0%, #6366f1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>AI Remediation & Diff Review</h3>
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <FileCode size={13} />
                <span>{issue.file_path}</span>
                <span>(Line {issue.line_number})</span>
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
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Issue Context Summary */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>
              {issue.title}
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '10px' }}>
              {issue.description}
            </div>
            {suggestion?.explanation && (
              <div
                style={{
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  color: '#e0f2fe',
                }}
              >
                <strong>AI Rationale:</strong> {suggestion.explanation}
              </div>
            )}
          </div>

          {/* Validation & Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge badge-success" style={{ gap: '5px' }}>
                <ShieldCheck size={13} /> Syntax Validated
              </span>
              <span className="badge badge-success" style={{ gap: '5px' }}>
                <CheckCircle2 size={13} /> Context Match Verified
              </span>
              {validation?.error && (
                <span className="badge badge-critical">{validation.error}</span>
              )}
            </div>

            {/* Split / Unified toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '6px' }}>
              <button
                onClick={() => setViewMode('unified')}
                style={{
                  background: viewMode === 'unified' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  border: 'none',
                  color: viewMode === 'unified' ? '#fff' : 'var(--text-muted)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <List size={13} /> Unified
              </button>
              <button
                onClick={() => setViewMode('split')}
                style={{
                  background: viewMode === 'split' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  border: 'none',
                  color: viewMode === 'split' ? '#fff' : 'var(--text-muted)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Columns size={13} /> Split
              </button>
            </div>
          </div>

          {/* Diff Content View */}
          {isGenerating ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                gap: '12px',
                color: 'var(--cyan)',
              }}
            >
              <RefreshCw size={28} className="animate-spin" />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Analyzing AST and generating safe code patch...
              </span>
            </div>
          ) : viewMode === 'split' ? (
            /* Split View */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1px',
                background: 'var(--border-subtle)',
                borderRadius: '8px',
                overflow: 'hidden',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
              }}
            >
              {/* Original */}
              <div style={{ background: '#0a0d14', padding: '14px', overflowX: 'auto' }}>
                <div style={{ color: 'var(--critical)', fontWeight: '600', marginBottom: '8px' }}>
                  Original Code
                </div>
                <pre style={{ margin: 0, color: '#f87171', whiteSpace: 'pre-wrap' }}>
                  {suggestion?.original_code || 'No original snippet'}
                </pre>
              </div>

              {/* Suggested */}
              <div style={{ background: '#0a0d14', padding: '14px', overflowX: 'auto' }}>
                <div style={{ color: 'var(--success)', fontWeight: '600', marginBottom: '8px' }}>
                  AI Proposed Fix
                </div>
                <pre style={{ margin: 0, color: '#34d399', whiteSpace: 'pre-wrap' }}>
                  {suggestion?.suggested_code || 'No replacement generated'}
                </pre>
              </div>
            </div>
          ) : (
            /* Unified View */
            <div
              style={{
                background: '#090d16',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                overflowX: 'auto',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                lineHeight: 1.5,
              }}
            >
              {diffLines.length > 0 ? (
                diffLines.map((line, idx) => {
                  let bg = 'transparent';
                  let color = '#94a3b8';
                  let borderLeft = '3px solid transparent';

                  if (line.startsWith('+') && !line.startsWith('+++')) {
                    bg = 'rgba(16, 185, 129, 0.12)';
                    color = '#34d399';
                    borderLeft = '3px solid #10b981';
                  } else if (line.startsWith('-') && !line.startsWith('---')) {
                    bg = 'rgba(244, 63, 94, 0.12)';
                    color = '#f87171';
                    borderLeft = '3px solid #f43f5e';
                  } else if (line.startsWith('@@')) {
                    bg = 'rgba(139, 92, 246, 0.1)';
                    color = 'var(--violet)';
                  }

                  return (
                    <div
                      key={idx}
                      style={{
                        background: bg,
                        color,
                        borderLeft,
                        padding: '2px 12px',
                        display: 'flex',
                        gap: '12px',
                      }}
                    >
                      <span
                        style={{
                          width: '32px',
                          color: '#475569',
                          textAlign: 'right',
                          userSelect: 'none',
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{line}</span>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '20px', color: 'var(--text-muted)' }}>No diff available.</div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions - Section 21 & 23 Human Approval Flow */}
        <div className="modal-footer">
          <button
            onClick={() => onRegenerate(issue.id)}
            disabled={isGenerating}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
            Regenerate Fix
          </button>

          <button
            onClick={() => onReject(issue.id)}
            disabled={isGenerating}
            className="btn btn-danger btn-sm"
          >
            <XCircle size={14} />
            Reject
          </button>

          <button
            onClick={() => onApprove(issue.id)}
            disabled={isGenerating || isApproved}
            className="btn btn-success btn-sm"
          >
            <CheckCircle2 size={14} />
            {isApproved ? 'Approved ✓' : 'Approve Patch'}
          </button>

          <button
            onClick={() => onOpenPRModal(issue)}
            disabled={isGenerating || !suggestion}
            className="btn btn-primary btn-sm"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              boxShadow: '0 2px 10px rgba(139, 92, 246, 0.35)',
            }}
          >
            <GitPullRequest size={14} />
            Create Pull Request
          </button>
        </div>
      </div>
    </div>
  );
};
