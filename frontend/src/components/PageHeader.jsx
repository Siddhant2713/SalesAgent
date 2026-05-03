import React from 'react';

export default function PageHeader({ title, description, action }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '32px'
        }}>
            <div>
                <h1 style={{
                    fontSize: '22px',
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    color: 'var(--text-primary)',
                    margin: 0
                }}>
                    {title}
                </h1>
                {description && (
                    <p style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        marginTop: '4px',
                        margin: '4px 0 0 0'
                    }}>
                        {description}
                    </p>
                )}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}
