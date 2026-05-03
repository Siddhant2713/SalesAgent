import React, { useState, useEffect } from 'react';
import { uploadCSV, addLeadManual, getLeads, deleteLead, importFromSheets } from '../api/api';
import LeadTable from '../components/LeadTable';
import PageHeader from '../components/PageHeader';

export default function UploadPage() {
    const [leads, setLeads] = useState([]);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    
    const [manualForm, setManualForm] = useState({ name: '', role: '', company: '', email: '' });
    const [submitting, setSubmitting] = useState(false);

    // Google Sheets state
    const [sheetUrl, setSheetUrl] = useState('');
    const [importingSheet, setImportingSheet] = useState(false);

    // Tab state
    const [activeTab, setActiveTab] = useState('csv');

    const loadLeads = async () => {
        try {
            const data = await getLeads();
            setLeads(data.leads || []);
        } catch (err) {
            handleError(err.message);
        }
    };

    useEffect(() => {
        loadLeads();
    }, []);

    const handleSuccess = (msg) => {
        setMessage(msg);
        setError('');
        setTimeout(() => setMessage(''), 5000);
    };

    const handleError = (msg) => {
        setError(msg);
        setMessage('');
        setTimeout(() => setError(''), 5000);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            handleUpload(e.target.files[0]);
        }
    };

    const handleUpload = async (selectedFile) => {
        setUploading(true);
        try {
            const res = await uploadCSV(selectedFile);
            handleSuccess(`Successfully added ${res.inserted} leads. Skipped ${res.skipped_duplicates} duplicates and ${res.skipped_invalid} invalid rows.`);
            await loadLeads();
        } catch (err) {
            handleError(`Upload failed: ${err.message}`);
        } finally {
            setUploading(false);
            setFile(null);
            // Reset the file input so the same file can be selected again
            const fileInput = document.getElementById('file-upload');
            if (fileInput) fileInput.value = '';
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await addLeadManual(manualForm);
            handleSuccess(`Successfully added lead ${manualForm.name}`);
            setManualForm({ name: '', role: '', company: '', email: '' });
            await loadLeads();
        } catch (err) {
            handleError(`Failed to add lead: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSheetImport = async (e) => {
        e.preventDefault();
        if (!sheetUrl.trim()) return;
        setImportingSheet(true);
        try {
            const res = await importFromSheets(sheetUrl);
            handleSuccess(
                `Google Sheets Import: Added ${res.inserted} leads from ${res.total_found} found. ` +
                `Skipped ${res.skipped_duplicates} duplicates, ${res.skipped_invalid} invalid.`
            );
            setSheetUrl('');
            await loadLeads();
        } catch (err) {
            handleError(`Google Sheets import failed: ${err.message}`);
        } finally {
            setImportingSheet(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this lead?")) return;
        try {
            await deleteLead(id);
            await loadLeads();
        } catch (err) {
            handleError(`Failed to delete: ${err.message}`);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <PageHeader
                title="Leads"
                description="Import your prospects from a spreadsheet, CSV, or add them manually."
            />

            {/* Notifications */}
            {message && (
                <div role="status" aria-live="polite" style={{
                    borderLeft: '3px solid var(--status-replied-text)',
                    background: 'var(--bg-elevated)',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    borderRadius: '4px'
                }}>
                    {message}
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

            {/* Import Methods */}
            <div>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
                    {[
                        { id: 'csv', label: 'CSV File' },
                        { id: 'sheets', label: 'Google Sheets' },
                        { id: 'manual', label: 'Manual Entry' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: '0 0 10px 0',
                                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                                borderBottom: activeTab === tab.id ? '2px solid var(--blue-primary)' : '2px solid transparent',
                                marginBottom: '-1px',
                                fontSize: '13px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'color 0.15s'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Panels */}
                <div className="sa-card sa-fade-in" style={{ padding: '24px' }}>
                    
                    {/* CSV Tab */}
                    {activeTab === 'csv' && (
                        <div>
                            <div
                                style={{
                                    height: '200px',
                                    background: 'var(--bg-input)',
                                    border: '2px dashed var(--border-subtle)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'border-color 0.15s, background 0.15s',
                                    cursor: 'pointer',
                                    position: 'relative'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--border-active)';
                                    e.currentTarget.style.background = 'var(--bg-elevated)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                                    e.currentTarget.style.background = 'var(--bg-input)';
                                }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    Drop CSV here or click to browse
                                </span>
                                <input
                                    id="file-upload"
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    disabled={uploading}
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        opacity: 0,
                                        cursor: 'pointer',
                                        width: '100%'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    Max 1MB · Columns required: name, role, company, email
                                </p>
                                {uploading && <span role="status" aria-live="polite" style={{ fontSize: '12px', color: 'var(--blue-primary)' }}>Uploading...</span>}
                            </div>
                        </div>
                    )}

                    {/* Sheets Tab */}
                    {activeTab === 'sheets' && (
                        <div>
                            <h3 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                                Import from Google Sheets
                            </h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                Paste the URL of any public Google Sheet with name, role, company, email columns.
                            </p>
                            <form onSubmit={handleSheetImport}>
                                <div style={{ marginBottom: '16px' }}>
                                    <label htmlFor="sheet-url" className="sa-label">Sheet URL</label>
                                    <input
                                        id="sheet-url"
                                        type="url"
                                        className="sa-input"
                                        value={sheetUrl}
                                        onChange={e => setSheetUrl(e.target.value)}
                                        placeholder="https://docs.google.com/spreadsheets/d/..."
                                        required
                                    />
                                </div>
                                <button type="submit" disabled={importingSheet || !sheetUrl.trim()} className="sa-btn-primary">
                                    {importingSheet ? 'Importing...' : 'Import Leads'}
                                </button>
                            </form>
                            
                            <details style={{ marginTop: '24px' }}>
                                <summary style={{ fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                                    How to make your sheet public
                                </summary>
                                <ol style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '8px 0 0 0', paddingLeft: '20px', lineHeight: 1.6 }}>
                                    <li>Open your Google Sheet</li>
                                    <li>Click the "Share" button in the top right</li>
                                    <li>Under "General access", change "Restricted" to "Anyone with the link"</li>
                                    <li>Copy the link and paste it above</li>
                                </ol>
                            </details>
                        </div>
                    )}

                    {/* Manual Tab */}
                    {activeTab === 'manual' && (
                        <form onSubmit={handleManualSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label htmlFor="manual-name" className="sa-label">Name</label>
                                    <input id="manual-name" type="text" required value={manualForm.name} onChange={e => setManualForm({...manualForm, name: e.target.value})} className="sa-input" />
                                </div>
                                <div>
                                    <label htmlFor="manual-role" className="sa-label">Role</label>
                                    <input id="manual-role" type="text" required value={manualForm.role} onChange={e => setManualForm({...manualForm, role: e.target.value})} className="sa-input" />
                                </div>
                                <div>
                                    <label htmlFor="manual-company" className="sa-label">Company</label>
                                    <input id="manual-company" type="text" required value={manualForm.company} onChange={e => setManualForm({...manualForm, company: e.target.value})} className="sa-input" />
                                </div>
                                <div>
                                    <label htmlFor="manual-email" className="sa-label">Email</label>
                                    <input id="manual-email" type="email" required value={manualForm.email} onChange={e => setManualForm({...manualForm, email: e.target.value})} className="sa-input" />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="submit" disabled={submitting} className="sa-btn-primary">
                                    {submitting ? 'Adding...' : 'Add Lead'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Leads Table Section */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
                        All Leads
                    </h2>
                    <span style={{
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-secondary)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        padding: '2px 7px'
                    }}>
                        {leads.length}
                    </span>
                </div>
                <LeadTable leads={leads} onLeadDeleted={handleDelete} />
            </div>
        </div>
    );
}
