import React from 'react';

export default function LeadTable({ leads, onLeadDeleted, onLeadStatusUpdated }) {
    if (!leads || leads.length === 0) {
        return <div className="text-gray-500 py-4">No leads found.</div>;
    }

    const statusColors = {
        new: 'bg-gray-100 text-gray-800',
        contacted: 'bg-blue-100 text-blue-800',
        replied: 'bg-green-100 text-green-800'
    };

    return (
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Name</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Company</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                            <span className="sr-only">Actions</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {leads.map((lead) => (
                        <tr key={lead.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{lead.name}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{lead.role}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{lead.company}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{lead.email}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${statusColors[lead.status]}`}>
                                    {lead.status}
                                </span>
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                                {onLeadStatusUpdated && lead.status === 'contacted' && (
                                    <button 
                                        onClick={() => onLeadStatusUpdated(lead.id, 'replied')}
                                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                                    >
                                        Mark Replied
                                    </button>
                                )}
                                {onLeadDeleted && (
                                    <button 
                                        onClick={() => onLeadDeleted(lead.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Delete
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
