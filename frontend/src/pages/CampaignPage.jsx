import React, { useState, useEffect } from 'react';
import { getLeads, getQuota, generateMessages, sendCampaign, sendFollowups } from '../api/api';
import MessagePreview from '../components/MessagePreview';
import { useNavigate } from 'react-router-dom';

export default function CampaignPage() {
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [quota, setQuota] = useState(null);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    
    // State machine: setup -> generating -> preview -> sending -> sent
    const [step, setStep] = useState('setup');
    
    // Setup state
    const [campaignName, setCampaignName] = useState('');
    const [selectedLeadIds, setSelectedLeadIds] = useState(new Set());
    
    // Preview state
    const [generatedData, setGeneratedData] = useState(null);
    const [selectedTone, setSelectedTone] = useState('friendly');
    
    // Results
    const [sendResults, setSendResults] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [leadsData, quotaData] = await Promise.all([
                getLeads({ status: 'new' }),
                getQuota()
            ]);
            setLeads(leadsData.leads || []);
            setQuota(quotaData);
        } catch (err) {
            setError(`Failed to load data: ${err.message}`);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedLeadIds(new Set(leads.map(l => l.id)));
        } else {
            setSelectedLeadIds(new Set());
        }
    };

    const handleSelectLead = (id) => {
        const newSet = new Set(selectedLeadIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedLeadIds(newSet);
    };

    const handleGenerate = async () => {
        if (!campaignName.trim() || selectedLeadIds.size === 0) return;
        
        if (selectedLeadIds.size > (quota?.daily_remaining || 0)) {
            setError(`You've selected ${selectedLeadIds.size} leads but only ${quota?.daily_remaining} API calls remain today.`);
            return;
        }

        setError('');
        setStep('generating');
        
        try {
            const payload = {
                campaign_name: campaignName,
                lead_ids: Array.from(selectedLeadIds)
            };
            const result = await generateMessages(payload);
            setGeneratedData(result);
            setStep('preview');
        } catch (err) {
            setError(`Generation failed: ${err.message}`);
            setStep('setup');
        }
    };

    const handleSend = async () => {
        if (!generatedData?.campaign_id) return;
        
        setError('');
        setStep('sending');
        
        try {
            const result = await sendCampaign(generatedData.campaign_id, selectedTone);
            setSendResults(result);
            setStep('sent');
        } catch (err) {
            setError(`Failed to send: ${err.message}`);
            setStep('preview');
        }
    };

    const handleFollowup = async () => {
        if (!generatedData?.campaign_id) return;
        try {
            await sendFollowups(generatedData.campaign_id);
            navigate('/dashboard');
        } catch (err) {
            setError(`Failed to send followups: ${err.message}`);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900">Campaign Manager</h1>

            {quota && (
                <div className={`p-4 rounded-md ${quota.daily_remaining === 0 ? 'bg-red-100 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
                    <strong>API Quota:</strong> {quota.daily_remaining} / {quota.daily_limit} calls remaining today.
                </div>
            )}

            {error && <div className="bg-red-50 p-4 rounded-md text-red-800">{error}</div>}

            {step === 'setup' && (
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                        <input 
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
                                            <input type="checkbox" onChange={handleSelectAll} checked={leads.length > 0 && selectedLeadIds.size === leads.length} />
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
                                                <input type="checkbox" checked={selectedLeadIds.has(lead.id)} onChange={() => handleSelectLead(lead.id)} />
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
            )}

            {step === 'generating' && (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-4"></div>
                    <p className="text-lg text-gray-600">Generating AI messages...</p>
                    <p className="text-sm text-gray-500 mt-2">This will take about 6 seconds per lead due to API rate limits.</p>
                </div>
            )}

            {step === 'preview' && generatedData && (
                <div>
                    <div className="bg-green-50 text-green-800 p-4 rounded-md mb-6">
                        Generated messages for {generatedData.generated_count} leads. {generatedData.skipped_count > 0 ? `(Skipped ${generatedData.skipped_count} existing)` : ''}
                    </div>

                    <div className="space-y-6 mb-8">
                        {generatedData.messages.map(msgData => (
                            <MessagePreview 
                                key={msgData.lead_id} 
                                leadName={msgData.lead_name} 
                                company={msgData.company} 
                                variants={msgData.variants} 
                            />
                        ))}
                    </div>

                    <div className="bg-white shadow rounded-lg p-6 sticky bottom-4 border-t-4 border-indigo-500">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Send Campaign</h3>
                        <div className="flex items-center space-x-6 mb-6">
                            <span className="text-sm font-medium text-gray-700">Select Tone to Send:</span>
                            {['friendly', 'direct', 'curiosity'].map(tone => (
                                <label key={tone} className="flex items-center space-x-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="tone" 
                                        value={tone} 
                                        checked={selectedTone === tone} 
                                        onChange={() => setSelectedTone(tone)}
                                        className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                    />
                                    <span className="capitalize text-sm text-gray-900">{tone}</span>
                                </label>
                            ))}
                        </div>
                        <button 
                            onClick={handleSend}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            Send {selectedTone} Campaign
                        </button>
                    </div>
                </div>
            )}

            {step === 'sending' && (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-4"></div>
                    <p className="text-lg text-gray-600">Sending emails via SMTP...</p>
                </div>
            )}

            {step === 'sent' && sendResults && (
                <div className="bg-white shadow rounded-lg p-8 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign Sent!</h2>
                    <p className="text-gray-600 mb-6">✅ {sendResults.sent} emails sent successfully. ❌ {sendResults.failed} failed.</p>
                    
                    {sendResults.failures.length > 0 && (
                        <div className="bg-red-50 text-left p-4 rounded-md mb-6 overflow-auto max-h-40">
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
            )}
        </div>
    );
}
