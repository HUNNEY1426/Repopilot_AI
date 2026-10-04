import React, { useState, useEffect } from 'react';
import { X, Key, Cpu, Save, CheckCircle2 } from 'lucide-react';
import type { AppSettings } from '../types/index.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings | null;
  onSave: (data: any) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [activeProvider, setActiveProvider] = useState<string>('gemini');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
  const [githubToken, setGithubToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setActiveProvider(settings.activeProvider || 'gemini');
      setGeminiModel(settings.geminiModel || 'gemini-2.5-flash');
      setOpenaiModel(settings.openaiModel || 'gpt-4o-mini');
    }
  }, [settings]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await onSave({
        activeProvider,
        geminiApiKey: geminiApiKey.trim() || undefined,
        geminiModel,
        openaiApiKey: openaiApiKey.trim() || undefined,
        openaiModel,
        githubToken: githubToken.trim() || undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu size={20} color="var(--cyan)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>AI Reviewer & GitHub Settings</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Active AI Provider */}
          <div style={{ marginBottom: '20px' }}>
            <label className="input-label">Preferred Review Engine</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[
                { id: 'gemini', label: 'Google Gemini', desc: 'Recommended: gemini-2.5-flash' },
                { id: 'openai', label: 'OpenAI / Groq', desc: 'GPT-4o or compatible' },
                { id: 'fallback', label: 'Smart Rules', desc: 'Zero-config offline engine' },
              ].map((prov) => (
                <button
                  type="button"
                  key={prov.id}
                  onClick={() => setActiveProvider(prov.id)}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: `1px solid ${activeProvider === prov.id ? 'var(--cyan)' : 'var(--border-subtle)'}`,
                    background: activeProvider === prov.id ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255,255,255,0.03)',
                    color: activeProvider === prov.id ? '#fff' : 'var(--text-secondary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{prov.label}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {prov.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Gemini API Key */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="input-label" style={{ margin: 0 }}>
                Google Gemini API Key
              </label>
              {settings?.geminiApiKeyConfigured && (
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                  Configured ({settings.geminiApiKeyMasked})
                </span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <Key
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="password"
                placeholder={settings?.geminiApiKeyConfigured ? 'Leave blank to keep existing key' : 'Enter Gemini API key...'}
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                className="input-text"
                style={{ paddingLeft: '36px' }}
              />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Powers structured review and AI fix generation with official <code>@google/genai</code> SDK.
            </div>
          </div>

          {/* Gemini Model */}
          <div style={{ marginBottom: '18px' }}>
            <label className="input-label">Gemini Model</label>
            <select
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value)}
              className="input-text"
              style={{ cursor: 'pointer' }}
            >
              <option value="gemini-3.5-flash">gemini-3.5-flash (Fast, Recommended)</option>
              <option value="gemini-3.8-flash">gemini-3.8-flash (High reasoning)</option>
              <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Ultra low latency)</option>
              <option value="gemini-flash-latest">gemini-flash-latest (Auto latest)</option>
            </select>
          </div>

          {/* OpenAI Key */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="input-label" style={{ margin: 0 }}>
                OpenAI API Key (Optional)
              </label>
              {settings?.openaiApiKeyConfigured && (
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                  Configured ({settings.openaiApiKeyMasked})
                </span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <Key
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="password"
                placeholder={settings?.openaiApiKeyConfigured ? 'Leave blank to keep existing key' : 'Enter OpenAI API key...'}
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                className="input-text"
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          {/* GitHub Personal Access Token */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="input-label" style={{ margin: 0 }}>
                GitHub Personal Access Token (Optional)
              </label>
              {settings?.githubTokenConfigured && (
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                  Configured ({settings.githubTokenMasked})
                </span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', color: 'var(--text-muted)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </span>
              <input
                type="password"
                placeholder={settings?.githubTokenConfigured ? 'Leave blank to keep existing token' : 'ghp_... (for higher rate limits & real PRs)'}
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                className="input-text"
                style={{ paddingLeft: '36px' }}
              />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Without a token, public repos work smoothly up to GitHub unauthenticated limits.
            </div>
          </div>

          {saveSuccess && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--success)',
                fontSize: '0.85rem',
                marginBottom: '10px',
              }}
            >
              <CheckCircle2 size={16} />
              Settings saved successfully!
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="btn btn-primary btn-sm">
              <Save size={14} />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
