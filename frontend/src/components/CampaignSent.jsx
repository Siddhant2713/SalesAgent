import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CampaignSent({ sendResults, handleFollowup }) {
    const navigate = useNavigate();

    return (
        <div role="status" aria-live="polite" className="bg-white shadow rounded-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign Sent!</h2>
            <p className="text-gray-600 mb-6">✅ {sendResults.sent} emails sent successfully. ❌ {sendResults.failed} failed.</p>
            
            {sendResults.failures.length > 0 && (
                <div role="alert" aria-live="assertive" className="bg-red-50 text-left p-4 rounded-md mb-6 overflow-auto max-h-40">
                    <h4 className="text-red-800 font-medium mb-2">Failures:</h4>
                    <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                        {sendResults.failures.map((f, i) => <li key={i}>{f.email}: {f.error}</li>)}
                    </ul>
                </div>
            )}

            <div className="flex space-x-4 justify-center">
                <button onClick={() => navigate('/dashboard')} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Go to Dashboard
                </button>
                <button onClick={handleFollowup} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                    Send Follow-ups Now
                </button>
            </div>
        </div>
    );
}
