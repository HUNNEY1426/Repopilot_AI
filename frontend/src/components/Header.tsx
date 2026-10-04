import React from 'react';
import { GitPullRequest, Settings, Download, Cpu, RefreshCw } from 'lucide-react';
import type { Repository, AppSettings } from '../types/index.js';

interface HeaderProps {
  repositories: Repository[];
  activeRepo: Repository | null;
  onSelectRepo: (repo: Repository) => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  settings: AppSettings | null;
  onRefresh: () => void;
  isScanning: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  repositories,
  activeRepo,
  onSelectRepo,
  onOpenSettings,
  onOpenExport,
  settings,
  onRefresh,
  isScanning,
}) => {
  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(7, 9, 14, 0.85)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '70px',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
            }}
          >
            <GitPullRequest size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
                Repo<span style={{ color: 'var(--cyan)' }}>Pilot</span>
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: '700',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(6, 182, 212, 0.15)',
                  color: 'var(--cyan)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  letterSpacing: '0.05em',
                }}
              >
                AI REVIEWER
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Autonomous Code Quality & Security Remediation
            </div>
          </div>
        </div>

        {/* Center / Repo Picker */}
        {repositories.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Repository:</span>
            <select
              value={activeRepo?.id || ''}
              onChange={(e) => {
                const found = repositories.find((r) => r.id === e.target.value);
                if (found) onSelectRepo(found);
              }}
              style={{
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-subtle)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {repositories.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.owner}/{r.name} ({r.language})
                </option>
              ))}
            </select>

            <button
              onClick={onRefresh}
              disabled={isScanning}
              className="btn btn-secondary btn-sm"
              title="Re-analyze repository"
            >
              <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
              {isScanning ? 'Analyzing...' : 'Re-scan'}
            </button>
          </div>
        )}

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* AI Provider Indicator */}
          <div
            onClick={onOpenSettings}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: settings?.activeProvider === 'gemini' && !settings?.geminiApiKeyConfigured
                ? 'rgba(245, 158, 11, 0.12)'
                : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${
                settings?.activeProvider === 'gemini' && !settings?.geminiApiKeyConfigured
                  ? 'rgba(245, 158, 11, 0.4)'
                  : 'var(--border-subtle)'
              }`,
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title="Click to configure AI Provider & API Keys"
          >
            <Cpu
              size={14}
              color={
                settings?.activeProvider === 'gemini' && !settings?.geminiApiKeyConfigured
                  ? '#f59e0b'
                  : 'var(--cyan)'
              }
            />
            <span>
              AI:{' '}
              <strong
                style={{
                  color:
                    settings?.activeProvider === 'gemini' && !settings?.geminiApiKeyConfigured
                      ? '#fbbf24'
                      : '#fff',
                }}
              >
                {settings?.activeProvider === 'gemini'
                  ? settings?.geminiApiKeyConfigured
                    ? 'Gemini 2.5'
                    : 'Gemini (Add Key)'
                  : settings?.activeProvider === 'openai'
                  ? settings?.openaiApiKeyConfigured
                    ? 'OpenAI'
                    : 'OpenAI (Add Key)'
                  : 'Smart Rules'}
              </strong>
            </span>
          </div>

          <button onClick={onOpenExport} className="btn btn-secondary btn-sm">
            <Download size={14} />
            Export Report
          </button>

          <button onClick={onOpenSettings} className="btn btn-secondary btn-sm" title="Settings">
            <Settings size={16} />
          </button>

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px 10px' }}
            title="GitHub"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
};
