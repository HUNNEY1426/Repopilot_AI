import React from 'react';
import { ArrowDown, AlertCircle, CheckCircle, Database, Server, Cpu, ShieldCheck } from 'lucide-react';
import type { Analysis } from '../../types/index.js';

interface ArchitectureDiagramProps {
  analysis: Analysis;
}

export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({ analysis }) => {
  const isVulnerableDemo = analysis.repository_id.includes('vulnerable');

  return (
    <div
      className="glass-panel"
      style={{
        padding: 'clamp(16px, 3vw, 24px)',
        marginBottom: '24px',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div>
          <h3 style={{ fontSize: 'clamp(1rem, 2.5vw, 1.15rem)', fontWeight: '700' }}>Architecture Topology</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Detected separation of concerns & module coupling
          </p>
        </div>
        <span
          className={`badge ${isVulnerableDemo ? 'badge-critical' : 'badge-success'}`}
          style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}
        >
          {isVulnerableDemo ? 'MONOLITHIC COUPLING' : 'LAYERED ARCHITECTURE'}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          padding: 'clamp(12px, 2.5vw, 20px)',
          background: 'rgba(0, 0, 0, 0.25)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          width: '100%',
        }}
      >
        {/* Layer 1: Client & Routes */}
        <div
          style={{
            width: '100%',
            maxWidth: '540px',
            background: 'rgba(6, 182, 212, 0.08)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <Server size={18} color="var(--cyan)" style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>Entrypoint & Routing</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-word' }}>
                {isVulnerableDemo ? 'server.js (Monolithic entry)' : 'src/index.ts (Delegates to routes)'}
              </div>
            </div>
          </div>
          {isVulnerableDemo ? (
            <span style={{ fontSize: '0.7rem', color: 'var(--critical)', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              <AlertCircle size={14} /> Direct DB Query Anti-Pattern
            </span>
          ) : (
            <span style={{ fontSize: '0.7rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              <CheckCircle size={14} /> Modular
            </span>
          )}
        </div>

        <ArrowDown size={18} color="var(--text-muted)" />

        {/* Layer 2: Middleware & Auth */}
        <div
          style={{
            width: '100%',
            maxWidth: '540px',
            background: 'rgba(139, 92, 246, 0.08)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <ShieldCheck size={18} color="var(--violet)" style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>Security & Middleware</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-word' }}>
                {isVulnerableDemo ? 'auth.js (Hardcoded secrets, unhandled errors)' : 'Zod & Auth Middleware'}
              </div>
            </div>
          </div>
          {isVulnerableDemo && (
            <span style={{ fontSize: '0.7rem', color: 'var(--high)', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              <AlertCircle size={14} /> Empty Catch Block
            </span>
          )}
        </div>

        <ArrowDown size={18} color="var(--text-muted)" />

        {/* Layer 3: Controllers / Business Services */}
        <div
          style={{
            width: '100%',
            maxWidth: '540px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <Cpu size={18} color="var(--medium)" style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>Controllers & Business Logic</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-word' }}>
                {isVulnerableDemo ? 'controllers/userController.js (Deep nesting, raw SQL)' : 'Service Handlers'}
              </div>
            </div>
          </div>
          {isVulnerableDemo && (
            <span style={{ fontSize: '0.7rem', color: 'var(--medium)', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              <AlertCircle size={14} /> Missing Service Layer
            </span>
          )}
        </div>

        <ArrowDown size={18} color="var(--text-muted)" />

        {/* Layer 4: Persistence & Database */}
        <div
          style={{
            width: '100%',
            maxWidth: '540px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <Database size={18} color="var(--success)" style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>Data Persistence & Repositories</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-word' }}>
                {isVulnerableDemo ? 'PostgreSQL Pool (Hardcoded URI connection)' : 'Database ORM / Adapter'}
              </div>
            </div>
          </div>
          {isVulnerableDemo ? (
            <span style={{ fontSize: '0.7rem', color: 'var(--critical)', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              <AlertCircle size={14} /> Secret in URI
            </span>
          ) : (
            <span style={{ fontSize: '0.7rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              <CheckCircle size={14} /> Configured via Env
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
