import React, { useState } from 'react';
import { Search, Sparkles, AlertTriangle, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import type { DemoRepoSummary } from '../types/index.js';

interface HeroConnectProps {
  onConnectUrl: (url: string) => Promise<void>;
  onSelectDemo: (demoId: string) => Promise<void>;
  demoRepos: DemoRepoSummary[];
  isConnecting: boolean;
}

export const HeroConnect: React.FC<HeroConnectProps> = ({
  onConnectUrl,
  onSelectDemo,
  demoRepos,
  isConnecting,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setError(null);
    try {
      await onConnectUrl(urlInput.trim());
      setUrlInput('');
    } catch (err: any) {
      setError(err.message || 'Failed to connect repository');
    }
  };

  return (


    <div className="glass-panel hero-wrapper">
      {/* Background ambient neon glow */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center', width: '100%' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            color: 'var(--cyan)',
            fontSize: 'clamp(0.725rem, 2vw, 0.8rem)',
            fontWeight: '600',
            marginBottom: '16px',
            maxWidth: '100%',
          }}
        >
          <Sparkles size={14} style={{ flexShrink: 0 }} />
          <span>AI-Powered Full Repository Assessment & Fix Generation</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(1.4rem, 4.5vw, 2.5rem)',
            fontWeight: '800',
            letterSpacing: '-0.03em',
            lineHeight: 1.2,
            marginBottom: '12px',
            background: 'linear-gradient(135deg, #ffffff 30%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          Inspect, Review & Remediate Any GitHub Repository
        </h1>

        <p
          style={{
            fontSize: 'clamp(0.85rem, 1.8vw, 0.975rem)',
            color: 'var(--text-secondary)',
            marginBottom: '24px',
            lineHeight: 1.6,
            wordBreak: 'break-word',
          }}
        >
          RepoPilot scans repository architecture, detects critical security vulnerabilities, evaluates code quality,
          uncovers missing tests, and generates validated Pull Requests directly for you.
        </p>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} style={{ position: 'relative', marginBottom: '24px', width: '100%' }}>
          <div className="hero-search-form">
            <div className="hero-search-input-wrap">
              <Search size={18} color="var(--text-muted)" style={{ marginRight: '10px', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Paste GitHub URL (e.g. owner/repo)..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={isConnecting}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.925rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isConnecting || !urlInput.trim()}
              className="btn btn-primary hero-search-submit-btn"
            >
              {isConnecting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Review Repository
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
          {error && (
            <div
              style={{
                marginTop: '10px',
                fontSize: '0.85rem',
                color: 'var(--critical)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <AlertTriangle size={14} />
              {error}
            </div>
          )}
        </form>

        {/* 1-Click Demo Repositories */}
        {demoRepos.length > 0 && (
          <div style={{ width: '100%' }}>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '12px',
              }}
            >
              Instant 1-Click Test Scenarios (Section 57 Fixtures)
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                flexWrap: 'wrap',
                width: '100%',
              }}
            >
              {demoRepos.map((demo) => {
                const isVuln = demo.id.includes('vulnerable');
                return (
                  <button
                    key={demo.id}
                    onClick={() => onSelectDemo(demo.id)}
                    disabled={isConnecting}
                    className="demo-button-chip"
                    style={{
                      background: isVuln ? 'rgba(244, 63, 94, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                      borderColor: isVuln ? 'rgba(244, 63, 94, 0.25)' : 'rgba(16, 185, 129, 0.25)',
                      flex: '1 1 200px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = isVuln ? 'var(--critical)' : 'var(--success)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = isVuln ? 'rgba(244, 63, 94, 0.25)' : 'rgba(16, 185, 129, 0.25)';
                    }}
                  >
                    {isVuln ? (
                      <AlertTriangle size={15} color="var(--critical)" style={{ flexShrink: 0 }} />
                    ) : (
                      <ShieldCheck size={15} color="var(--success)" style={{ flexShrink: 0 }} />
                    )}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <strong>{demo.name}</strong> ({demo.language})
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', flexShrink: 0 }}>
                      {demo.filesCount} files
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
