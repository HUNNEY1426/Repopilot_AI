import React from 'react';
import { History, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Analysis } from '../../types/index.js';

interface HistoryChartProps {
  history: Analysis[];
  currentAnalysisId: string;
  onSelectHistoricalScan: (analysisId: string) => void;
}

export const HistoryChart: React.FC<HistoryChartProps> = ({
  history,
  currentAnalysisId,
  onSelectHistoricalScan,
}) => {
  if (history.length <= 1) return null;

  return (
    <div
      className="glass-panel"
      style={{
        padding: 'clamp(16px, 3vw, 24px)',
        marginBottom: '24px',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={18} color="var(--violet)" />
          <h3 style={{ fontSize: 'clamp(1rem, 2.5vw, 1.15rem)', fontWeight: '700' }}>Repository Health History</h3>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {history.length} scans recorded
        </span>
      </div>

      <div
        className="touch-horizontal-scroll"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '8px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {history.map((scan, index) => {
          const isSelected = scan.id === currentAnalysisId;
          const prevScan = index < history.length - 1 ? history[index + 1] : null;
          const scoreDelta = prevScan ? Math.round(scan.overall_score - prevScan.overall_score) : 0;
          const scanNumber = history.length - index;

          return (
            <button
              key={scan.id}
              onClick={() => onSelectHistoricalScan(scan.id)}
              style={{
                background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isSelected ? 'var(--cyan)' : 'var(--border-subtle)'}`,
                borderRadius: '10px',
                padding: '12px 16px',
                minWidth: '150px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                  Scan #{scanNumber}
                </span>
                {scoreDelta > 0 ? (
                  <span style={{ fontSize: '0.7rem', color: 'var(--success)', display: 'flex', alignItems: 'center' }}>
                    <TrendingUp size={12} /> +{scoreDelta}
                  </span>
                ) : scoreDelta < 0 ? (
                  <span style={{ fontSize: '0.7rem', color: 'var(--critical)', display: 'flex', alignItems: 'center' }}>
                    <TrendingDown size={12} /> {scoreDelta}
                  </span>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                    <Minus size={12} /> 0
                  </span>
                )}
              </div>

              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-mono)' }}>
                {Math.round(scan.overall_score)}
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '400' }}>/100</span>
              </div>

              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {new Date(scan.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {scan.commit_sha}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
