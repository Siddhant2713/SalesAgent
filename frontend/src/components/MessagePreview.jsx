import React, { useState } from 'react';

export default function MessagePreview({ leadName, company, variants }) {
    const [activeTab, setActiveTab] = useState('friendly');

    if (!variants) return null;

    const variant = variants[activeTab];
    const tones = ['friendly', 'direct', 'curiosity'];

    return (
        <div className="sa-card" style={{ overflow: 'hidden', marginBottom: 0 }}>
            {/* Header */}
            <div style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border-subtle)'
            }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {leadName}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {' '}at {company}
                </span>
            </div>

            {/* Tab bar */}
            <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <nav style={{ display: 'flex', marginBottom: '-1px' }} role="tablist" aria-label="Email tone variants">
                    {tones.map((tone) => (
                        <button
                            key={tone}
                            role="tab"
                            id={`tab-${leadName}-${tone}`}
                            aria-selected={activeTab === tone}
                            aria-controls={`panel-${leadName}-${tone}`}
                            onClick={() => setActiveTab(tone)}
                            style={{
                                flex: 1,
                                padding: '10px 18px',
                                fontSize: '13px',
                                fontWeight: 500,
                                textTransform: 'capitalize',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === tone ? '2px solid var(--blue-primary)' : '2px solid transparent',
                                color: activeTab === tone ? 'var(--text-primary)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-sans)',
                                transition: 'color 0.15s, border-color 0.15s'
                            }}
                            onMouseEnter={(e) => {
                                if (activeTab !== tone) e.currentTarget.style.color = 'var(--text-primary)';
                            }}
                            onMouseLeave={(e) => {
                                if (activeTab !== tone) e.currentTarget.style.color = 'var(--text-secondary)';
                            }}
                        >
                            {tone}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab panel */}
            <div
                role="tabpanel"
                id={`panel-${leadName}-${activeTab}`}
                aria-labelledby={`tab-${leadName}-${activeTab}`}
                style={{ padding: '18px' }}
            >
                {variant ? (
                    <>
                        <div>
                            <span className="sa-label">Subject</span>
                            <p style={{
                                fontSize: '14px',
                                color: 'var(--text-primary)',
                                fontWeight: 500,
                                padding: '8px 0',
                                margin: 0
                            }}>
                                {variant.subject}
                            </p>
                        </div>
                        <hr className="sa-divider" />
                        <div>
                            <span className="sa-label">Body</span>
                            <p style={{
                                fontSize: '13px',
                                color: 'var(--text-secondary)',
                                whiteSpace: 'pre-wrap',
                                lineHeight: 1.6,
                                padding: '8px 0',
                                margin: 0
                            }}>
                                {variant.body}
                            </p>
                        </div>
                    </>
                ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                        No variant generated for this tone.
                    </div>
                )}
            </div>
        </div>
    );
}
