import React from 'react';

export default function CampaignSetup({
    campaignName, setCampaignName,
    selectedLeadIds, leads,
    handleSelectAll, handleSelectLead,
    quota, handleGenerate
}) {
    return (
        <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6">
                <label htmlFor="campaign-name" className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                <input 
                    id="campaign-name"
                    type="text" 
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" 
                    value={campaignName} 
                    onChange={e => setCampaignName(e.target.value)}
                    placeholder="e.g. Batch 1 - Tech Founders"
                />
            </div>

            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Select Leads (New only)</label>
                    <span className="text-sm text-gray-500">{selectedLeadIds.size} selected</span>
                </div>
                
                <div className="border rounded-md max-h-64 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left">
                                    <label htmlFor="select-all" className="sr-only">Select all leads</label>
                                    <input id="select-all" type="checkbox" onChange={handleSelectAll} checked={leads.length > 0 && selectedLeadIds.size === leads.length} />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {leads.length === 0 ? (
                                <tr><td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">No new leads available.</td></tr>
                            ) : leads.map(lead => (
                                <tr key={lead.id}>
                                    <td className="px-6 py-4">
                                        <label htmlFor={`select-lead-${lead.id}`} className="sr-only">Select lead {lead.name}</label>
                                        <input id={`select-lead-${lead.id}`} type="checkbox" checked={selectedLeadIds.has(lead.id)} onChange={() => handleSelectLead(lead.id)} />
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{lead.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{lead.company}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="mt-2 text-xs text-gray-500">Maximum 50 leads per batch.</p>
            </div>

            <button 
                onClick={handleGenerate}
                disabled={!campaignName || selectedLeadIds.size === 0 || quota?.daily_remaining === 0 || selectedLeadIds.size > 50}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
                Generate Messages
            </button>
        </div>
    );
}
