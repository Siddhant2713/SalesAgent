import React from 'react';

const STAGE_STYLES = {
    early_startup: { bg: 'rgba(147,51,234,0.15)', color: '#a78bfa', label: 'Early Startup' },
    growth_stage:  { bg: 'rgba(26,92,245,0.12)',   color: '#4a9eff', label: 'Growth Stage' },
    enterprise:    { bg: 'rgba(52,211,153,0.12)',   color: '#34d399', label: 'Enterprise' },
};

export default function EnrichmentCard({ enrichment, company }) {
    if (!enrichment || !enrichment.best_hook) return null;

    const stage = STAGE_STYLES[enrichment.company_stage] || STAGE_STYLES.growth_stage;

    return (
        <div style={{
            background: 'var(--bg-elevated)',
            borderLeft: '2px solid var(--blue-primary)',
            borderRadius: '6px',
            padding: '14px 16px',
            marginBottom: '8px'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
            }}>
                <span style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    letterSpacing: '0.06em',
                    fontWeight: 500
                }}>
                    Company Research
                </span>
                <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 500,
                    background: stage.bg,
                    color: stage.color
                }}>
                    {stage.label}
                </span>
            </div>

            {/* Best Angle */}
            <div style={{ marginBottom: '10px' }}>
                <span style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    letterSpacing: '0.06em',
                    fontWeight: 500
                }}>
                    Best Angle
                </span>
                <p style={{
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                    marginTop: '4px',
                    margin: '4px 0 0 0'
                }}>
                    {enrichment.best_hook}
                </p>
            </div>

            {/* Pain Points */}
            {enrichment.likely_pain_points && enrichment.likely_pain_points.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                    <span style={{
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        letterSpacing: '0.06em',
                        fontWeight: 500
                    }}>
                        Pain Points
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                        {enrichment.likely_pain_points.map((point, i) => (
                            <span key={i} style={{
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '4px',
                                padding: '2px 8px',
                                fontSize: '11px',
                                color: 'var(--text-secondary)'
                            }}>
                                {point}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Suggested Tone */}
            {enrichment.tone_recommendation && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        letterSpacing: '0.06em',
                        fontWeight: 500
                    }}>
                        Suggested Tone
                    </span>
                    <span style={{
                        fontSize: '11px',
                        color: 'var(--blue-primary)',
                        textTransform: 'capitalize'
                    }}>
                        {enrichment.tone_recommendation}
                    </span>
                </div>
            )}
        </div>
    );
}
