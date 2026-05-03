import React, { useState, useEffect } from 'react';
import { getAnalytics, getLeads, updateLeadStatus, sendFollowups, getCampaigns } from '../api/api';
import StatsCard from '../components/StatsCard';
import LeadTable from '../components/LeadTable';
import PageHeader from '../components/PageHeader';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [leads, setLeads] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsData, leadsData, campaignsData] = await Promise.all([
                getAnalytics(),
                getLeads(), // Getting all leads for the table
                getCampaigns()
            ]);
            setStats(statsData);
            setLeads(leadsData.leads || []);
            setCampaigns(campaignsData || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleMarkReplied = async (id, status) => {
        try {
            await updateLeadStatus(id, status);
            await loadData();
        } catch (err) {
            alert(`Failed to update status: ${err.message}`);
        }
    };

    const handleSendFollowups = async (campaignId) => {
        if (!window.confirm("Send follow-ups to all unreplied leads in this campaign?")) return;
        try {
            const res = await sendFollowups(campaignId);
            alert(`Sent ${res.followups_sent} follow-ups. Failed: ${res.failed}`);
            await loadData();
        } catch (err) {
            alert(`Failed: ${err.message}`);
        }
    };

    if (loading) return (
        <div role="status" aria-live="polite" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading dashboard...
        </div>
    );

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
        color: 'var(--text-secondary)'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <PageHeader
                title="Dashboard"
                action={
                    <button aria-label="Refresh Dashboard Data" onClick={loadData} className="sa-btn-ghost">
                        Refresh Data
                    </button>
                }
            />

            {error && (
                <div role="alert" aria-live="assertive" style={{
                    borderLeft: '3px solid #e53e3e',
                    background: 'var(--bg-elevated)',
                    padding: '10px 14px',
                    borderRadius: '4px',
                    color: '#fc8181',
                    fontSize: '13px'
                }}>
                    {error}
                </div>
            )}

            {stats && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '24px'
                }}>
                    <StatsCard title="Total Leads" value={stats.total_leads} />
                    <StatsCard title="Emails Sent" value={stats.emails_sent} />
                    <StatsCard title="Replies" value={stats.replies} subtitle={`Rate: ${stats.reply_rate}%`} />
                    <StatsCard
                        title="Best Tone"
                        value={stats.best_tone ? stats.best_tone.charAt(0).toUpperCase() + stats.best_tone.slice(1) : '-'}
                        subtitle={stats.best_tone ? `Rate: ${stats.tone_stats[stats.best_tone]?.reply_rate}%` : ''}
                    />
                </div>
            )}

            {/* Campaigns Table */}
            <div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '16px'
                }}>
                    <h3 style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        margin: 0
                    }}>
                        Campaigns
                    </h3>
                </div>
                <div className="sa-card" style={{ overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                                    <th style={thStyle}>ID / Name</th>
                                    <th style={thStyle}>Leads</th>
                                    <th style={thStyle}>Sent</th>
                                    <th style={thStyle}>Replies</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                                            No campaigns found.
                                        </td>
                                    </tr>
                                ) : campaigns.map((c, index) => (
                                    <tr key={c.id} style={{
                                        background: 'var(--bg-surface)',
                                        borderBottom: index < campaigns.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                                        transition: 'background 0.1s'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; }}>
                                        <td style={{ ...tdStyle, color: 'var(--text-primary)', fontWeight: 500 }}>{c.id} - {c.name}</td>
                                        <td style={tdStyle}>{c.lead_count}</td>
                                        <td style={tdStyle}>{c.sent_count}</td>
                                        <td style={tdStyle}>{c.reply_count}</td>
                                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                                            <button
                                                aria-label={`Send followups for campaign ${c.name}`}
                                                onClick={() => handleSendFollowups(c.id)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'var(--blue-primary)',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    fontFamily: 'var(--font-sans)',
                                                    transition: 'color 0.15s'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--blue-hover)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--blue-primary)'; }}
                                            >
                                                Send Followups
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Lead Tracker */}
            <div>
                <div style={{ marginBottom: '16px' }}>
                    <h3 style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        margin: '0 0 4px 0'
                    }}>
                        Lead Tracker
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                        Mark leads as replied when they respond.
                    </p>
                </div>
                <LeadTable leads={leads} onLeadStatusUpdated={handleMarkReplied} />
            </div>
        </div>
    );
}
