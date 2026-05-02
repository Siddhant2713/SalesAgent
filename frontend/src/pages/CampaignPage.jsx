import React, { useState, useEffect, useRef } from 'react';
import { getLeads, getQuota, generateMessages, sendCampaign, sendFollowups } from '../api/api';
import { useNavigate } from 'react-router-dom';
import CampaignSetup from '../components/CampaignSetup';
import CampaignPreview from '../components/CampaignPreview';
import CampaignSent from '../components/CampaignSent';

export default function CampaignPage() {
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [quota, setQuota] = useState(null);
    const [error, setError] = useState('');
    
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

    // Focus management — move focus to preview when generation completes
    const previewRef = useRef(null);
    useEffect(() => {
        if (step === 'preview' && previewRef.current) {
            previewRef.current.focus();
        }
    }, [step]);

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
                <CampaignSetup 
                    campaignName={campaignName} setCampaignName={setCampaignName}
                    selectedLeadIds={selectedLeadIds} leads={leads}
                    handleSelectAll={handleSelectAll} handleSelectLead={handleSelectLead}
                    quota={quota} handleGenerate={handleGenerate}
                />
            )}

            {step === 'generating' && (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-4"></div>
                    <p className="text-lg text-gray-600">Generating AI messages...</p>
                    <p className="text-sm text-gray-500 mt-2">This will take about 6 seconds per lead due to API rate limits.</p>
                </div>
            )}

            {step === 'preview' && generatedData && (
                <div ref={previewRef} tabIndex="-1" aria-label="Generated email previews">
                    <CampaignPreview 
                        generatedData={generatedData}
                        selectedTone={selectedTone} setSelectedTone={setSelectedTone}
                        handleSend={handleSend}
                    />
                </div>
            )}

            {step === 'sending' && (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-4"></div>
                    <p className="text-lg text-gray-600">Sending emails via SMTP...</p>
                </div>
            )}

            {step === 'sent' && sendResults && (
                <CampaignSent 
                    sendResults={sendResults}
                    handleFollowup={handleFollowup}
                />
            )}
        </div>
    );
}
