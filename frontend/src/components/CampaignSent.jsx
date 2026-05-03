import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CampaignSent({ sendResults, handleFollowup }) {
    const navigate = useNavigate();

    return (
        <div role="status" aria-live="polite" className="sa-card" style={{ padding: '40px', textAlign: 'center' }}>
            <h2 style={{
                fontSize: '20px',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                margin: '0 0 12px 0'
            }}>
                Campaign sent.
            </h2>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 24px 0' }}>
                <span style={{ color: sendResults.sent > 0 ? 'var(--status-replied-text)' : 'var(--text-secondary)' }}>
                    {sendResults.sent} delivered
                </span>
                {' · '}
                <span style={{ color: sendResults.failed > 0 ? '#fc8181' : 'var(--text-secondary)' }}>
                    {sendResults.failed} failed
                </span>
            </p>

            {sendResults.failures.length > 0 && (
                <div role="alert" aria-live="assertive" style={{
                    background: 'var(--bg-input)',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '24px',
                    textAlign: 'left',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    maxHeight: '160px',
                    overflowY: 'auto'
                }}>
                    {sendResults.failures.map((f, i) => (
                        <div key={i} style={{ marginBottom: i < sendResults.failures.length - 1 ? '4px' : 0 }}>
                            {f.email}: {f.error}
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button onClick={() => navigate('/dashboard')} className="sa-btn-ghost">
                    Dashboard
                </button>
                <button onClick={handleFollowup} className="sa-btn-primary">
                    Send Follow-ups
                </button>
            </div>
        </div>
    );
}
