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
    <div
      className="glass-panel"
      style={{
        padding: '36px',
        marginBottom: '32px',
        background: 'linear-gradient(180deg, rgba(14, 19, 31, 0.8) 0%, rgba(9, 12, 20, 0.9) 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
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

      <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
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
            fontSize: '0.8rem',
            fontWeight: '600',
            marginBottom: '16px',
          }}
        >
          <Sparkles size={14} />
          AI-Powered Full Repository Assessment & Fix Generation
        </div>

        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            marginBottom: '14px',
            background: 'linear-gradient(135deg, #ffffff 30%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Inspect, Review & Remediate Any GitHub Repository
        </h1>

        <p
          style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            marginBottom: '28px',
            lineHeight: 1.6,
          }}
        >
          RepoPilot scans repository architecture, detects critical security vulnerabilities, evaluates code quality,
          uncovers missing tests, and generates validated Pull Requests directly for you.
        </p>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} style={{ position: 'relative', marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#080c14',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '14px',
              padding: '6px 8px 6px 16px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(6, 182, 212, 0.15)',
              transition: 'border-color 0.2s',
            }}
          >
            <Search size={20} color="var(--text-muted)" style={{ marginRight: '12px', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Paste GitHub URL (e.g., https://github.com/expressjs/express or owner/repo)..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={isConnecting}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <button
              type="submit"
              disabled={isConnecting || !urlInput.trim()}
              className="btn btn-primary"
              style={{ borderRadius: '10px', padding: '10px 22px' }}
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
          <div>
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
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              {demoRepos.map((demo) => {
                const isVuln = demo.id.includes('vulnerable');
                return (
                  <button
                    key={demo.id}
                    onClick={() => onSelectDemo(demo.id)}
                    disabled={isConnecting}
                    style={{
                      background: isVuln ? 'rgba(244, 63, 94, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                      border: `1px solid ${isVuln ? 'rgba(244, 63, 94, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                      borderRadius: '10px',
                      padding: '8px 14px',
                      color: 'var(--text-main)',
                      fontSize: '0.825rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
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
                      <AlertTriangle size={15} color="var(--critical)" />
                    ) : (
                      <ShieldCheck size={15} color="var(--success)" />
                    )}
                    <span>
                      <strong>{demo.name}</strong> ({demo.language})
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
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
