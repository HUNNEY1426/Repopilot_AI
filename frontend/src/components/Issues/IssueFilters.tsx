import React from 'react';
import { Search, ShieldAlert, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface IssueFiltersProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedSeverity: string;
  onSelectSeverity: (sev: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  severityCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };
}

export const IssueFilters: React.FC<IssueFiltersProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedSeverity,
  onSelectSeverity,
  searchQuery,
  onSearchChange,
  severityCounts,
}) => {
  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Issues' },
    { id: 'security', label: 'Security' },
    { id: 'quality', label: 'Code Quality' },
    { id: 'testing', label: 'Testing' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'documentation', label: 'Documentation' },
    { id: 'dependencies', label: 'Dependencies' },
  ];

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Category Pills & Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                style={{
                  background: isActive ? 'var(--cyan)' : 'rgba(255, 255, 255, 0.04)',
                  color: isActive ? '#000' : 'var(--text-secondary)',
                  border: `1px solid ${isActive ? 'var(--cyan)' : 'var(--border-subtle)'}`,
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? '700' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', minWidth: '280px' }}>
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Filter issues by title, file, code..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input-text"
            style={{ paddingLeft: '36px', height: '36px', fontSize: '0.825rem' }}
          />
        </div>
      </div>

      {/* Severity Counters & Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Severity:
        </span>

        <button
          onClick={() => onSelectSeverity('all')}
          style={{
            background: selectedSeverity === 'all' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            color: '#fff',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '0.75rem',
            cursor: 'pointer',
            fontWeight: selectedSeverity === 'all' ? '700' : '500',
          }}
        >
          All ({severityCounts.total})
        </button>

        <button
          onClick={() => onSelectSeverity('critical')}
          className={`badge ${selectedSeverity === 'critical' ? 'badge-critical' : 'badge-neutral'}`}
          style={{ cursor: 'pointer', opacity: severityCounts.critical > 0 ? 1 : 0.4 }}
        >
          <ShieldAlert size={13} />
          Critical ({severityCounts.critical})
        </button>

        <button
          onClick={() => onSelectSeverity('high')}
          className={`badge ${selectedSeverity === 'high' ? 'badge-high' : 'badge-neutral'}`}
          style={{ cursor: 'pointer', opacity: severityCounts.high > 0 ? 1 : 0.4 }}
        >
          <AlertTriangle size={13} />
          High ({severityCounts.high})
        </button>

        <button
          onClick={() => onSelectSeverity('medium')}
          className={`badge ${selectedSeverity === 'medium' ? 'badge-medium' : 'badge-neutral'}`}
          style={{ cursor: 'pointer', opacity: severityCounts.medium > 0 ? 1 : 0.4 }}
        >
          <AlertCircle size={13} />
          Medium ({severityCounts.medium})
        </button>

        <button
          onClick={() => onSelectSeverity('low')}
          className={`badge ${selectedSeverity === 'low' ? 'badge-low' : 'badge-neutral'}`}
          style={{ cursor: 'pointer', opacity: severityCounts.low > 0 ? 1 : 0.4 }}
        >
          <Info size={13} />
          Low ({severityCounts.low})
        </button>
      </div>
    </div>
  );
};
