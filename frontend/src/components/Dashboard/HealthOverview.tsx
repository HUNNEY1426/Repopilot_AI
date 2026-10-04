import React from 'react';
import { GitBranch, GitCommit, FileCode, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { Analysis, Repository } from '../../types/index.js';

interface HealthOverviewProps {
  analysis: Analysis;
  repository: Repository;
}

export const HealthOverview: React.FC<HealthOverviewProps> = ({ analysis, repository }) => {
  const score = Math.round(analysis.overall_score || 0);

  // Calibrate health grade
  let gradeText = 'EXCELLENT';
  let gradeColor = 'var(--success)';
  let gradeBg = 'rgba(16, 185, 129, 0.12)';
  let gradeBorder = 'rgba(16, 185, 129, 0.3)';

  if (score < 50) {
    gradeText = 'CRITICAL ATTENTION NEEDED';
    gradeColor = 'var(--critical)';
    gradeBg = 'rgba(244, 63, 94, 0.12)';
    gradeBorder = 'rgba(244, 63, 94, 0.3)';
  } else if (score < 75) {
    gradeText = 'MODERATE RISKS IDENTIFIED';
    gradeColor = 'var(--medium)';
    gradeBg = 'rgba(245, 158, 11, 0.12)';
    gradeBorder = 'rgba(245, 158, 11, 0.3)';
  } else if (score < 85) {
    gradeText = 'GOOD STABILITY';
    gradeColor = 'var(--cyan)';
    gradeBg = 'rgba(6, 182, 212, 0.12)';
    gradeBorder = 'rgba(6, 182, 212, 0.3)';
  }

  // SVG Gauge calculations
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div
      className="glass-panel"
      style={{
        padding: '28px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '36px',
        flexWrap: 'wrap',
      }}
    >
      {/* Radial Gauge */}
      <div style={{ position: 'relative', width: '150px', height: '150px', flexShrink: 0 }}>
        <svg width="150" height="150" viewBox="0 0 150 150">
          {/* Background circle */}
          <circle
            cx="75"
            cy="75"
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <circle
            cx="75"
            cy="75"
            r={radius}
            fill="transparent"
            stroke={gradeColor}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 75 75)"
            style={{
              transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)',
              filter: `drop-shadow(0 0 8px ${gradeColor})`,
            }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            / 100 HEALTH
          </span>
        </div>
      </div>

      {/* Summary and Metadata */}
      <div style={{ flex: 1, minWidth: '300px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>{repository.name}</h2>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '700',
              background: gradeBg,
              color: gradeColor,
              border: `1px solid ${gradeBorder}`,
              letterSpacing: '0.04em',
            }}
          >
            {gradeText}
          </span>
        </div>

        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            marginBottom: '16px',
            lineHeight: 1.6,
            whiteSpace: 'pre-line',
          }}
        >
          {isExpanded || analysis.summary.length <= 260
            ? analysis.summary
            : `${analysis.summary.substring(0, 260)}... `}
          {analysis.summary.length > 260 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--cyan)',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: 'pointer',
                padding: '0 4px',
                textDecoration: 'underline',
              }}
            >
              {isExpanded ? 'Show less' : 'Read full AI assessment'}
            </button>
          )}
        </p>

        {/* Metadata Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
            }}
          >
            <GitBranch size={15} color="var(--cyan)" />
            <span>Branch:</span>
            <strong style={{ color: '#fff' }}>{repository.default_branch}</strong>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
            }}
          >
            <GitCommit size={15} color="var(--violet)" />
            <span>Commit:</span>
            <code style={{ color: 'var(--cyan)', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: '4px' }}>
              {analysis.commit_sha}
            </code>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
            }}
          >
            <FileCode size={15} color="var(--medium)" />
            <span>Files:</span>
            <strong style={{ color: '#fff' }}>{analysis.metrics.totalFilesScanned}</strong>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
            }}
          >
            <ShieldAlert size={15} color={analysis.metrics.vulnerabilitiesDetected > 0 ? 'var(--critical)' : 'var(--success)'} />
            <span>Vulnerabilities:</span>
            <strong style={{ color: analysis.metrics.vulnerabilitiesDetected > 0 ? 'var(--critical)' : 'var(--success)' }}>
              {analysis.metrics.vulnerabilitiesDetected}
            </strong>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
            }}
          >
            <CheckCircle2 size={15} color="var(--low)" />
            <span>Estimated Test Coverage:</span>
            <strong style={{ color: '#fff' }}>{analysis.metrics.estimatedTestCoverage}%</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
