import React from 'react';

export default function StatsCard({ title, value, subtitle }) {
    return (
        <div className="sa-card" style={{ padding: '20px' }}>
            <dt style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 500
            }}>
                {title}
            </dt>
            <dd style={{
                fontSize: '28px',
                color: 'var(--text-primary)',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                margin: '6px 0 4px'
            }}>
                {value}
            </dd>
            {subtitle && (
                <p style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    margin: 0
                }}>
                    {subtitle}
                </p>
            )}
        </div>
    );
}
