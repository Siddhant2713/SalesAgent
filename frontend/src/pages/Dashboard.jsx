import React, { useState, useEffect } from 'react';
import { getAnalytics, getLeads, updateLeadStatus, sendFollowups, getCampaigns } from '../api/api';
import StatsCard from '../components/StatsCard';
import LeadTable from '../components/LeadTable';

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

    if (loading) return <div role="status" aria-live="polite" className="p-8 text-center text-gray-500">Loading dashboard...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                <button aria-label="Refresh Dashboard Data" onClick={loadData} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                    Refresh Data
                </button>
            </div>

            {error && <div role="alert" aria-live="assertive" className="bg-red-50 p-4 rounded-md text-red-800">{error}</div>}

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

            <div className="bg-white shadow sm:rounded-lg mb-8">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Campaigns</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID / Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leads</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Replies</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {campaigns.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">No campaigns found.</td></tr>
                            ) : campaigns.map(c => (
                                <tr key={c.id}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.id} - {c.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{c.lead_count}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{c.sent_count}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{c.reply_count}</td>
                                    <td className="px-6 py-4 text-sm text-right font-medium">
                                        <button aria-label={`Send followups for campaign ${c.name}`} onClick={() => handleSendFollowups(c.id)} className="text-indigo-600 hover:text-indigo-900">
                                            Send Followups
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Lead Status Tracker</h2>
                <p className="text-sm text-gray-500 mb-4">Manually mark contacted leads as "Replied" when they respond via email.</p>
                <LeadTable leads={leads} onLeadStatusUpdated={handleMarkReplied} />
            </div>
        </div>
    );
}
