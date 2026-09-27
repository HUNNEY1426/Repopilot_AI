import React from 'react';
import { Shield, Code, CheckSquare, Layers, BookOpen, Wrench, Package } from 'lucide-react';
import type { DimensionScores } from '../../types/index.js';

interface ScoreBreakdownProps {
  scores: DimensionScores;
}

interface ScoreItem {
  key: keyof DimensionScores;
  label: string;
  score: number;
  icon: React.ReactNode;
  description: string;
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ scores }) => {
  const items: ScoreItem[] = [
    {
      key: 'security',
      label: 'Security',
      score: scores.security,
      icon: <Shield size={18} color="var(--critical)" />,
      description: 'Credential leakage, SQL injection, unsafe command execution, insecure CORS',
    },
    {
      key: 'codeQuality',
      label: 'Code Quality',
      score: scores.codeQuality,
      icon: <Code size={18} color="var(--cyan)" />,
      description: 'Function complexity, large files, nesting depth, error handling',
    },
    {
      key: 'testing',
      label: 'Testing',
      score: scores.testing,
      icon: <CheckSquare size={18} color="var(--low)" />,
      description: 'Test frameworks, test file ratio, untested critical paths',
    },
    {
      key: 'architecture',
      label: 'Architecture',
      score: scores.architecture,
      icon: <Layers size={18} color="var(--violet)" />,
      description: 'Separation of concerns, route decoupling, modular layering',
    },
    {
      key: 'documentation',
      label: 'Documentation',
      score: scores.documentation,
      icon: <BookOpen size={18} color="var(--medium)" />,
      description: 'README completeness, setup guides, API docs, environment reference',
    },
    {
      key: 'maintainability',
      label: 'Maintainability',
      score: scores.maintainability,
      icon: <Wrench size={18} color="#34d399" />,
      description: 'Long-term extensibility, modularity, readability',
    },
    {
      key: 'dependencies',
      label: 'Dependencies',
      score: scores.dependencies,
      icon: <Package size={18} color="#f472b6" />,
      description: 'Outdated libraries, loose version pins, deprecated packages',
    },
  ];

  const getColor = (val: number) => {
    if (val >= 80) return 'var(--success)';
    if (val >= 60) return 'var(--medium)';
    return 'var(--critical)';
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Quality & Health Indicators</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Calibrated multi-dimensional assessment (0–100 indicators)
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {items.map((item) => {
          const color = getColor(item.score);
          return (
            <div
              key={item.key}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '16px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {item.icon}
                  <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{item.label}</span>
                </div>
                <span
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: '800',
                    color,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {Math.round(item.score)}
                </span>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  height: '6px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.max(4, Math.min(100, item.score))}%`,
                    background: color,
                    borderRadius: '3px',
                    boxShadow: `0 0 8px ${color}`,
                    transition: 'width 0.8s ease',
                  }}
                />
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                {item.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
