import React from 'react';

export default function EmptyState({ message }) {
    return (
        <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            color: 'var(--text-muted)',
            fontSize: '14px'
        }}>
            {message}
        </div>
    );
}
