import React, { useState } from 'react';
import { updateUserSettings, addLeadManual } from '../api/api';

export default function Onboarding({ onComplete }) {
    const [step, setStep] = useState(1);
    
    // Step 1 State
    const [geminiKey, setGeminiKey] = useState('');
    
    // Step 2 State
    const [emailSetup, setEmailSetup] = useState({
        smtp_from_name: '',
        smtp_username: '',
        smtp_password: ''
    });

    // Step 3 State
    const [leadForm, setLeadForm] = useState({
        name: '', role: '', company: '', email: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleNext = async (e) => {
        e?.preventDefault();
        setError('');

        if (step === 1) {
            if (!geminiKey.startsWith('AIza')) {
                setError('Key must start with AIza');
                return;
            }
            setStep(2);
        } else if (step === 2) {
            setLoading(true);
            try {
                // Save both step 1 and step 2
                await updateUserSettings({
                    gemini_api_key: geminiKey,
                    smtp_from_name: emailSetup.smtp_from_name,
                    smtp_username: emailSetup.smtp_username,
                    smtp_password: emailSetup.smtp_password,
                    smtp_host: 'smtp.gmail.com',
                    smtp_port: 587
                });
                setStep(3);
            } catch (err) {
                setError(`Failed to save settings: ${err.message}`);
            } finally {
                setLoading(false);
            }
        } else if (step === 3) {
            setLoading(true);
            try {
                if (leadForm.name && leadForm.email) {
                    await addLeadManual(leadForm);
                }
                onComplete(); // Done!
            } catch (err) {
                setError(`Failed to add lead: ${err.message}`);
                setLoading(false);
            }
        }
    };

    const handleSkipStep3 = () => {
        onComplete();
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-base)' }}>
            
            {/* Left Panel - Form Area (60%) */}
            <div style={{ flex: '6', display: 'flex', flexDirection: 'column', padding: '48px 10%' }}>
                
                {/* Stepper */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '64px', maxWidth: '300px' }}>
                    {[1, 2, 3].map((num, i) => (
                        <React.Fragment key={num}>
                            <div style={{
                                width: '28px', height: '28px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '12px', fontWeight: 600,
                                background: step >= num ? 'var(--blue-primary)' : 'transparent',
                                color: step >= num ? '#fff' : 'var(--text-muted)',
                                border: step >= num ? 'none' : '2px solid var(--border-subtle)',
                                position: 'relative'
                            }}>
                                {step > num ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                ) : num}
                                {step === num && (
                                    <div className="sa-pulse" style={{
                                        position: 'absolute', inset: '-4px', border: '1px solid var(--blue-primary)', borderRadius: '50%'
                                    }}/>
                                )}
                            </div>
                            {i < 2 && (
                                <div style={{
                                    flex: 1, height: '2px', margin: '0 8px',
                                    background: step > num ? 'var(--blue-subtle)' : 'var(--border-subtle)'
                                }}/>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {error && (
                    <div role="alert" aria-live="assertive" style={{
                        borderLeft: '3px solid #e53e3e', color: '#fc8181', fontSize: '13px',
                        padding: '10px 12px', marginBottom: '24px', borderRadius: '4px'
                    }}>
                        {error}
                    </div>
                )}

                {/* Step 1 Content */}
                {step === 1 && (
                    <form className="sa-fade-in" onSubmit={handleNext}>
                        <h2 style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>Connect your AI</h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 32px 0' }}>
                            SalesAgent uses Gemini to research companies and write personalized emails.
                        </p>
                        
                        <div style={{ marginBottom: '8px' }}>
                            <label className="sa-label">Gemini API Key</label>
                            <input 
                                type="password" 
                                required 
                                className="sa-input" 
                                placeholder="AIzaSy..." 
                                value={geminiKey} 
                                onChange={e => setGeminiKey(e.target.value)} 
                            />
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 24px 0' }}>
                            Your key is encrypted before storage. We cannot read it.
                        </p>

                        <button type="submit" className="sa-btn-primary" disabled={!geminiKey}>
                            Continue
                        </button>
                    </form>
                )}

                {/* Step 2 Content */}
                {step === 2 && (
                    <form className="sa-fade-in" onSubmit={handleNext}>
                        <h2 style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>Connect your Gmail</h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 32px 0' }}>
                            Emails are sent from your account. SalesAgent only uses your App Password, never your real password.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '8px' }}>
                            <div>
                                <label className="sa-label">From Name</label>
                                <input type="text" required className="sa-input" placeholder="e.g. Priya Sharma" value={emailSetup.smtp_from_name} onChange={e => setEmailSetup({...emailSetup, smtp_from_name: e.target.value})} />
                            </div>
                            <div>
                                <label className="sa-label">Gmail Address</label>
                                <input type="email" required className="sa-input" placeholder="you@gmail.com" value={emailSetup.smtp_username} onChange={e => setEmailSetup({...emailSetup, smtp_username: e.target.value})} />
                            </div>
                            <div>
                                <label className="sa-label">App Password</label>
                                <input type="password" required className="sa-input" placeholder="xxxx xxxx xxxx xxxx" value={emailSetup.smtp_password} onChange={e => setEmailSetup({...emailSetup, smtp_password: e.target.value})} />
                            </div>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 24px 0' }}>
                            An App Password is a 16-character code, different from your login password.
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <button type="submit" className="sa-btn-primary" disabled={loading || !emailSetup.smtp_from_name || !emailSetup.smtp_username || !emailSetup.smtp_password}>
                                {loading ? 'Saving...' : 'Continue'}
                            </button>
                            <button type="button" onClick={() => setStep(3)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                                Skip for now
                            </button>
                        </div>
                    </form>
                )}

                {/* Step 3 Content */}
                {step === 3 && (
                    <form className="sa-fade-in" onSubmit={handleNext}>
                        <h2 style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>You're ready</h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 32px 0' }}>
                            Add your first lead to run a campaign, or skip to the dashboard.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                            <div>
                                <label className="sa-label">Name</label>
                                <input type="text" className="sa-input" placeholder="e.g. John Doe" value={leadForm.name} onChange={e => setLeadForm({...leadForm, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="sa-label">Role</label>
                                <input type="text" className="sa-input" placeholder="e.g. CEO" value={leadForm.role} onChange={e => setLeadForm({...leadForm, role: e.target.value})} />
                            </div>
                            <div>
                                <label className="sa-label">Company</label>
                                <input type="text" className="sa-input" placeholder="e.g. Acme Corp" value={leadForm.company} onChange={e => setLeadForm({...leadForm, company: e.target.value})} />
                            </div>
                            <div>
                                <label className="sa-label">Email</label>
                                <input type="email" className="sa-input" placeholder="john@acme.com" value={leadForm.email} onChange={e => setLeadForm({...leadForm, email: e.target.value})} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <button type="submit" className="sa-btn-primary" disabled={loading || !leadForm.name || !leadForm.email}>
                                {loading ? 'Saving...' : 'Add Lead and Go to Dashboard'}
                            </button>
                            <button type="button" onClick={handleSkipStep3} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)', textDecoration: 'none' }}>
                                Go to Dashboard
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Right Panel - Context (40%) */}
            <div style={{ flex: '4', background: 'var(--bg-surface)', borderLeft: '1px solid var(--border-subtle)', padding: '48px', display: 'flex', flexDirection: 'column' }}>
                
                {step === 1 && (
                    <div className="sa-fade-in">
                        <h3 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>Where to find your key</h3>
                        <ol style={{ paddingLeft: '0', listStylePosition: 'inside', fontSize: '13px', color: 'var(--text-primary)', margin: '0 0 24px 0', lineHeight: 1.8 }}>
                            <li>Go to aistudio.google.com</li>
                            <li>Sign in with Google</li>
                            <li>Click Create API Key</li>
                            <li>Copy and paste it here</li>
                        </ol>
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: 'var(--blue-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            Open Google AI Studio <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        </a>
                        <p style={{ marginTop: '32px', fontSize: '11px', color: 'var(--text-muted)' }}>Free tier: 15 requests/min · 1,500/day</p>
                    </div>
                )}

                {step === 2 && (
                    <div className="sa-fade-in">
                        <h3 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>How to get an App Password</h3>
                        <ol style={{ paddingLeft: '0', listStylePosition: 'inside', fontSize: '13px', color: 'var(--text-primary)', margin: '0 0 24px 0', lineHeight: 1.8 }}>
                            <li>Go to myaccount.google.com/security</li>
                            <li>Enable 2-Step Verification if not already on</li>
                            <li>Search for App Passwords</li>
                            <li>Create one named SalesAgent</li>
                            <li>Copy the 16-character code here</li>
                        </ol>
                        <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: 'var(--blue-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            Open Google Account Security <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        </a>
                        <p style={{ marginTop: '32px', fontSize: '11px', color: '#fc8181' }}>Do not use your actual Gmail password here.</p>
                    </div>
                )}

                {step === 3 && (
                    <div className="sa-fade-in">
                        <h3 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>What happens next</h3>
                        <ol style={{ paddingLeft: '0', listStylePosition: 'inside', fontSize: '13px', color: 'var(--text-primary)', margin: '0 0 24px 0', lineHeight: 1.8 }}>
                            <li>Go to Campaigns and name your campaign</li>
                            <li>Select leads and click Generate</li>
                            <li>Gemini researches each company</li>
                            <li>Preview 3 email variants per lead</li>
                            <li>Send with one click</li>
                        </ol>
                        <p style={{ marginTop: '32px', fontSize: '11px', color: 'var(--text-muted)' }}>Each lead takes ~12 seconds (1 enrichment + 1 generation call)</p>
                    </div>
                )}

            </div>
        </div>
    );
}
