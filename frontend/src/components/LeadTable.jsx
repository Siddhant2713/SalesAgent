import React from 'react';
import EmptyState from './EmptyState';

const STATUS_STYLES = {
    new:       { bg: 'var(--status-new)',       text: 'var(--status-new-text)' },
    contacted: { bg: 'var(--status-contacted)', text: 'var(--status-contacted-text)' },
    replied:   { bg: 'var(--status-replied)',   text: 'var(--status-replied-text)' },
};

export default function LeadTable({ leads, onLeadDeleted, onLeadStatusUpdated }) {
    if (!leads || leads.length === 0) {
        return <EmptyState message="No leads yet." />;
    }

    const thStyle = {
        fontSize: '11px',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        fontWeight: 500,
        padding: '10px 16px',
        textAlign: 'left'
    };

    const tdStyle = {
        padding: '12px 16px',
        fontSize: '13px',
        color: 'var(--text-secondary)',
        whiteSpace: 'nowrap'
    };

    return (
        <div className="sa-card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                            <th style={thStyle}>Name</th>
                            <th style={thStyle}>Role</th>
                            <th style={thStyle}>Company</th>
                            <th style={thStyle}>Email</th>
                            <th style={thStyle}>Status</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.map((lead, index) => {
                            const status = STATUS_STYLES[lead.status] || STATUS_STYLES.new;
                            return (
                                <tr
                                    key={lead.id}
                                    style={{
                                        background: 'var(--bg-surface)',
                                        borderBottom: index < leads.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                                        transition: 'background 0.1s'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; }}
                                >
                                    <td style={{ ...tdStyle, color: 'var(--text-primary)', fontWeight: 500 }}>{lead.name}</td>
                                    <td style={tdStyle}>{lead.role}</td>
                                    <td style={tdStyle}>{lead.company}</td>
                                    <td style={tdStyle}>{lead.email}</td>
                                    <td style={tdStyle}>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '3px 8px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontWeight: 500,
                                            background: status.bg,
                                            color: status.text
                                        }}>
                                            <span style={{
                                                width: '5px',
                                                height: '5px',
                                                borderRadius: '50%',
                                                background: status.text
                                            }} aria-hidden="true" />
                                            {lead.status}
                                        </span>
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                                        {onLeadStatusUpdated && lead.status === 'contacted' && (
                                            <button
                                                aria-label={`Mark ${lead.name} as replied`}
                                                onClick={() => onLeadStatusUpdated(lead.id, 'replied')}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'var(--blue-primary)',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    fontFamily: 'var(--font-sans)',
                                                    marginRight: '12px',
                                                    transition: 'color 0.15s'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--blue-hover)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--blue-primary)'; }}
                                            >
                                                Mark Replied
                                            </button>
                                        )}
                                        {onLeadDeleted && (
                                            <button
                                                aria-label={`Delete lead ${lead.name}`}
                                                onClick={() => onLeadDeleted(lead.id)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'var(--text-muted)',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    fontFamily: 'var(--font-sans)',
                                                    transition: 'color 0.15s'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.color = '#fc8181'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
