import React from 'react';
import { ArrowDown, AlertCircle, CheckCircle, Database, Server, Cpu, ShieldCheck } from 'lucide-react';
import type { Analysis } from '../../types/index.js';

interface ArchitectureDiagramProps {
  analysis: Analysis;
}

export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({ analysis }) => {
  const isVulnerableDemo = analysis.repository_id.includes('vulnerable');

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Architecture Topology</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Detected separation of concerns & module coupling
          </p>
        </div>
        <span
          className={`badge ${isVulnerableDemo ? 'badge-critical' : 'badge-success'}`}
          style={{ fontSize: '0.75rem' }}
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
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.25)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
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
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Server size={18} color="var(--cyan)" />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>Entrypoint & Routing</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isVulnerableDemo ? 'server.js (Monolithic entry)' : 'src/index.ts (Delegates to routes)'}
              </div>
            </div>
          </div>
          {isVulnerableDemo ? (
            <span style={{ fontSize: '0.7rem', color: 'var(--critical)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={14} /> Direct DB Query Anti-Pattern
            </span>
          ) : (
            <span style={{ fontSize: '0.7rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={18} color="var(--violet)" />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>Security & Middleware</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isVulnerableDemo ? 'auth.js (Hardcoded secrets, unhandled errors)' : 'Zod & Auth Middleware'}
              </div>
            </div>
          </div>
          {isVulnerableDemo && (
            <span style={{ fontSize: '0.7rem', color: 'var(--high)', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu size={18} color="var(--medium)" />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>Controllers & Business Logic</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isVulnerableDemo ? 'controllers/userController.js (Deep nesting, raw SQL)' : 'Service Handlers'}
              </div>
            </div>
          </div>
          {isVulnerableDemo && (
            <span style={{ fontSize: '0.7rem', color: 'var(--medium)', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={18} color="var(--success)" />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>Data Persistence & Repositories</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isVulnerableDemo ? 'PostgreSQL Pool (Hardcoded URI connection)' : 'Database ORM / Adapter'}
              </div>
            </div>
          </div>
          {isVulnerableDemo ? (
            <span style={{ fontSize: '0.7rem', color: 'var(--critical)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={14} /> Secret in URI
            </span>
          ) : (
            <span style={{ fontSize: '0.7rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={14} /> Configured via Env
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
