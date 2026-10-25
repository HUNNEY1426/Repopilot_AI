import React, { useState } from 'react';
import { GitPullRequest, Settings, Download, Cpu, RefreshCw, Menu, X } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isGeminiMissingKey =
    settings?.activeProvider === 'gemini' && !settings?.geminiApiKeyConfigured;

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(7, 9, 14, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
      }}
    >
      <div className="container">
        {/* Main Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '64px',
            padding: '10px 0',
            gap: '12px',
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 18px rgba(6, 182, 212, 0.4)',
                flexShrink: 0,
              }}
            >
              <GitPullRequest size={20} color="#fff" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                  Repo<span style={{ color: 'var(--cyan)' }}>Pilot</span>
                </span>
                <span
                  style={{
                    fontSize: '0.6rem',
                    fontWeight: '700',
                    padding: '2px 5px',
                    borderRadius: '4px',
                    background: 'rgba(6, 182, 212, 0.15)',
                    color: 'var(--cyan)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  AI REVIEWER
                </span>
              </div>
              <div
                className="desktop-only"
                style={{ fontSize: '0.725rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}
              >
                Autonomous Code Quality & Security Remediation
              </div>
            </div>
          </div>

          {/* Desktop Center / Repo Picker */}
          {repositories.length > 0 && (
            <div className="desktop-flex" style={{ alignItems: 'center', gap: '10px' }}>
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
                  maxWidth: '240px',
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

          {/* Desktop Right Actions */}
          <div className="desktop-flex" style={{ alignItems: 'center', gap: '10px' }}>
            {/* AI Provider Indicator */}
            <div
              onClick={onOpenSettings}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                background: isGeminiMissingKey
                  ? 'rgba(245, 158, 11, 0.12)'
                  : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${
                  isGeminiMissingKey ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)'
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
                color={isGeminiMissingKey ? '#f59e0b' : 'var(--cyan)'}
              />
              <span>
                AI:{' '}
                <strong style={{ color: isGeminiMissingKey ? '#fbbf24' : '#fff' }}>
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

          {/* Mobile Right Controls: Quick AI badge + Hamburger */}
          <div className="mobile-only" style={{ alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onOpenSettings}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 10px', fontSize: '0.75rem' }}
              title="AI Settings"
            >
              <Cpu size={14} color="var(--cyan)" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn btn-secondary btn-sm"
              style={{ padding: '8px 10px' }}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Collapsible Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            className="mobile-only"
            style={{
              flexDirection: 'column',
              gap: '12px',
              padding: '14px 0 18px 0',
              borderTop: '1px solid var(--border-subtle)',
              animation: 'modalScale 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Repo Picker on Mobile */}
            {repositories.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                  ACTIVE REPOSITORY:
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={activeRepo?.id || ''}
                    onChange={(e) => {
                      const found = repositories.find((r) => r.id === e.target.value);
                      if (found) {
                        onSelectRepo(found);
                        setMobileMenuOpen(false);
                      }
                    }}
                    style={{
                      flex: 1,
                      background: 'var(--bg-surface)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-subtle)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    {repositories.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.owner}/{r.name} ({r.language})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      onRefresh();
                      setMobileMenuOpen(false);
                    }}
                    disabled={isScanning}
                    className="btn btn-secondary btn-sm"
                    style={{ flexShrink: 0 }}
                  >
                    <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
                    {isScanning ? 'Scanning' : 'Re-scan'}
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Action Buttons Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginTop: '4px',
              }}
            >
              <button
                onClick={() => {
                  onOpenExport();
                  setMobileMenuOpen(false);
                }}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'center' }}
              >
                <Download size={14} />
                Export Report
              </button>

              <button
                onClick={() => {
                  onOpenSettings();
                  setMobileMenuOpen(false);
                }}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'center' }}
              >
                <Settings size={14} />
                Settings & Keys
              </button>
            </div>

            {/* AI Provider Status summary */}
            <div
              onClick={() => {
                onOpenSettings();
                setMobileMenuOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={14} color="var(--cyan)" />
                <span>
                  Active Engine:{' '}
                  <strong style={{ color: '#fff' }}>
                    {settings?.activeProvider === 'gemini'
                      ? 'Google Gemini'
                      : settings?.activeProvider === 'openai'
                      ? 'OpenAI'
                      : 'Smart Rules'}
                  </strong>
                </span>
              </div>
              <span style={{ color: 'var(--cyan)' }}>Configure →</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
