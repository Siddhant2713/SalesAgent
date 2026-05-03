import React, { useState, useEffect, useRef } from 'react';
import { getLeads, getQuota, generateMessages, sendCampaign, sendFollowups } from '../api/api';
import { useNavigate } from 'react-router-dom';
import CampaignSetup from '../components/CampaignSetup';
import CampaignPreview from '../components/CampaignPreview';
import CampaignSent from '../components/CampaignSent';
import PageHeader from '../components/PageHeader';

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

    // Calculate quota percentage for progress bar
    const quotaUsed = quota ? quota.daily_limit - quota.daily_remaining : 0;
    const quotaPercentage = quota ? (quotaUsed / quota.daily_limit) * 100 : 0;
    const isQuotaEmpty = quota?.daily_remaining === 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px', margin: '0 auto' }}>
            <PageHeader
                title="Campaigns"
                description="Generate and send personalized email campaigns to your leads."
            />

            {/* Quota bar */}
            {quota && (
                <div style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                        <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>API Quota</span>
                        <span style={{ color: isQuotaEmpty ? '#fc8181' : 'var(--text-secondary)' }}>
                            {quotaUsed} / {quota.daily_limit} used
                        </span>
                    </div>
                    <div style={{ height: '2px', background: 'var(--bg-elevated)', borderRadius: '1px', overflow: 'hidden' }}>
                        <div style={{ 
                            height: '100%', 
                            background: isQuotaEmpty ? '#e53e3e' : 'var(--blue-primary)', 
                            width: `${quotaPercentage}%`,
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                </div>
            )}

            {error && (
                <div role="alert" aria-live="assertive" style={{
                    borderLeft: '3px solid #e53e3e',
                    background: 'var(--bg-elevated)',
                    padding: '10px 14px',
                    color: '#fc8181',
                    fontSize: '13px',
                    borderRadius: '4px'
                }}>
                    {error}
                </div>
            )}

            {step === 'setup' && (
                <CampaignSetup 
                    campaignName={campaignName} setCampaignName={setCampaignName}
                    selectedLeadIds={selectedLeadIds} leads={leads}
                    handleSelectAll={handleSelectAll} handleSelectLead={handleSelectLead}
                    quota={quota} handleGenerate={handleGenerate}
                />
            )}

            {/* Generating State */}
            {step === 'generating' && (
                <div style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '48px 32px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '200px', marginBottom: '24px' }}>
                        <div className="sa-pulse" style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-elevated)', width: '60%' }} />
                        <div className="sa-pulse" style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-elevated)', width: '45%', animationDelay: '0.2s' }} />
                        <div className="sa-pulse" style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-elevated)', width: '75%', animationDelay: '0.4s' }} />
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>
                        Researching companies and generating emails...
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                        Approx. 12 seconds per lead
                    </p>
                </div>
            )}

            {step === 'preview' && generatedData && (
                <div ref={previewRef} tabIndex="-1" aria-label="Generated email previews" style={{ outline: 'none' }}>
                    <CampaignPreview 
                        generatedData={generatedData}
                        selectedTone={selectedTone} setSelectedTone={setSelectedTone}
                        handleSend={handleSend}
                    />
                </div>
            )}

            {/* Sending State */}
            {step === 'sending' && (
                <div style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '48px 32px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div className="sa-pulse" style={{ height: '6px', borderRadius: '3px', background: 'var(--blue-primary)', width: '60%', marginBottom: '24px' }} />
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                        Sending emails...
                    </p>
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
