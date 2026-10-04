import React from 'react';
import { Shield, Code, CheckSquare, Layers, BookOpen, Wrench, Package, ArrowUpRight } from 'lucide-react';
import type { DimensionScores } from '../../types/index.js';

interface ScoreBreakdownProps {
  scores: DimensionScores;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

interface ScoreItem {
  key: keyof DimensionScores;
  categoryFilter: string;
  label: string;
  score: number;
  icon: React.ReactNode;
  description: string;
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({
  scores,
  selectedCategory = 'all',
  onSelectCategory,
}) => {
  const items: ScoreItem[] = [
    {
      key: 'security',
      categoryFilter: 'security',
      label: 'Security',
      score: scores.security,
      icon: <Shield size={18} color="var(--critical)" />,
      description: 'Credential leakage, SQL injection, unsafe command execution, insecure CORS',
    },
    {
      key: 'codeQuality',
      categoryFilter: 'quality',
      label: 'Code Quality',
      score: scores.codeQuality,
      icon: <Code size={18} color="var(--cyan)" />,
      description: 'Function complexity, large files, nesting depth, error handling',
    },
    {
      key: 'testing',
      categoryFilter: 'testing',
      label: 'Testing',
      score: scores.testing,
      icon: <CheckSquare size={18} color="var(--low)" />,
      description: 'Test frameworks, test file ratio, untested critical paths',
    },
    {
      key: 'architecture',
      categoryFilter: 'architecture',
      label: 'Architecture',
      score: scores.architecture,
      icon: <Layers size={18} color="var(--violet)" />,
      description: 'Separation of concerns, route decoupling, modular layering',
    },
    {
      key: 'documentation',
      categoryFilter: 'documentation',
      label: 'Documentation',
      score: scores.documentation,
      icon: <BookOpen size={18} color="var(--medium)" />,
      description: 'README completeness, setup guides, API docs, environment reference',
    },
    {
      key: 'maintainability',
      categoryFilter: 'maintainability',
      label: 'Maintainability',
      score: scores.maintainability,
      icon: <Wrench size={18} color="#34d399" />,
      description: 'Long-term extensibility, modularity, readability',
    },
    {
      key: 'dependencies',
      categoryFilter: 'dependencies',
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

  const handleClick = (categoryFilter: string) => {
    if (onSelectCategory) {
      onSelectCategory(categoryFilter === selectedCategory ? 'all' : categoryFilter);
      const section = document.getElementById('issues-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Quality & Health Indicators</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Calibrated multi-dimensional assessment (0–100). Click any indicator to inspect issues.
          </p>
        </div>
        {selectedCategory !== 'all' && (
          <button
            onClick={() => onSelectCategory && onSelectCategory('all')}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
          >
            Clear Indicator Filter ({selectedCategory})
          </button>
        )}
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
          const isSelected = selectedCategory === item.categoryFilter;

          return (
            <div
              key={item.key}
              onClick={() => handleClick(item.categoryFilter)}
              style={{
                background: isSelected ? 'rgba(6, 182, 212, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${isSelected ? 'var(--cyan)' : 'var(--border-subtle)'}`,
                borderRadius: '12px',
                padding: '16px',
                transition: 'all 0.2s',
                cursor: 'pointer',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {item.icon}
                  <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{item.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                  <ArrowUpRight size={13} style={{ color: 'var(--text-muted)', opacity: isSelected ? 1 : 0.4 }} />
                </div>
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
