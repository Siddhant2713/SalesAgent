import React from 'react';

export default function CampaignSetup({
    campaignName, setCampaignName,
    selectedLeadIds, leads,
    handleSelectAll, handleSelectLead,
    quota, handleGenerate
}) {
    const thStyle = {
        fontSize: '11px',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        fontWeight: 500,
        padding: '8px 12px',
        textAlign: 'left'
    };

    const tdStyle = {
        padding: '8px 12px',
        fontSize: '13px',
        color: 'var(--text-secondary)'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Campaign name */}
            <div className="sa-card" style={{ padding: '24px' }}>
                <label htmlFor="campaign-name" className="sa-label">Campaign Name</label>
                <input
                    id="campaign-name"
                    type="text"
                    className="sa-input"
                    value={campaignName}
                    onChange={e => setCampaignName(e.target.value)}
                    placeholder="e.g. Batch 1 - Tech Founders"
                />
            </div>

            {/* Select leads */}
            <div className="sa-card" style={{ padding: '24px' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                }}>
                    <span className="sa-label" style={{ marginBottom: 0 }}>Select Leads</span>
                    <span style={{
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-secondary)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        padding: '2px 7px'
                    }}>
                        {selectedLeadIds.size} selected
                    </span>
                </div>

                <div style={{
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    maxHeight: '260px',
                    overflowY: 'auto'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{
                                background: 'var(--bg-elevated)',
                                borderBottom: '1px solid var(--border-subtle)',
                                position: 'sticky',
                                top: 0
                            }}>
                                <th style={{ ...thStyle, width: '40px' }}>
                                    <label htmlFor="select-all" className="sr-only">Select all leads</label>
                                    <input
                                        id="select-all"
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={leads.length > 0 && selectedLeadIds.size === leads.length}
                                        style={{ accentColor: 'var(--blue-primary)' }}
                                    />
                                </th>
                                <th style={thStyle}>Name</th>
                                <th style={thStyle}>Company</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.length === 0 ? (
                                <tr>
                                    <td colSpan="3" style={{
                                        padding: '24px',
                                        textAlign: 'center',
                                        fontSize: '13px',
                                        color: 'var(--text-muted)'
                                    }}>
                                        No new leads available.
                                    </td>
                                </tr>
                            ) : leads.map((lead, index) => (
                                <tr key={lead.id} style={{
                                    borderBottom: index < leads.length - 1 ? '1px solid var(--border-subtle)' : 'none'
                                }}>
                                    <td style={tdStyle}>
                                        <label htmlFor={`select-lead-${lead.id}`} className="sr-only">Select lead {lead.name}</label>
                                        <input
                                            id={`select-lead-${lead.id}`}
                                            type="checkbox"
                                            checked={selectedLeadIds.has(lead.id)}
                                            onChange={() => handleSelectLead(lead.id)}
                                            style={{ accentColor: 'var(--blue-primary)' }}
                                        />
                                    </td>
                                    <td style={{ ...tdStyle, color: 'var(--text-primary)' }}>{lead.name}</td>
                                    <td style={tdStyle}>{lead.company}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Maximum 50 leads per batch.
                </p>
            </div>

            {/* Generate button */}
            <button
                onClick={handleGenerate}
                disabled={!campaignName || selectedLeadIds.size === 0 || quota?.daily_remaining === 0 || selectedLeadIds.size > 50}
                className="sa-btn-primary"
                style={{ width: '100%', padding: '11px 18px' }}
            >
                Generate Messages
            </button>
        </div>
    );
}
