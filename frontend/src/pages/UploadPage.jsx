import React, { useState, useEffect } from 'react';
import { uploadCSV, addLeadManual, getLeads, deleteLead, importFromSheets } from '../api/api';
import LeadTable from '../components/LeadTable';

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

    const loadLeads = async () => {
        try {
            const data = await getLeads();
            setLeads(data.leads || []);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        loadLeads();
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            handleUpload(e.target.files[0]);
        }
    };

    const handleUpload = async (selectedFile) => {
        setError('');
        setMessage('');
        setUploading(true);
        try {
            const res = await uploadCSV(selectedFile);
            setMessage(`Successfully added ${res.inserted} leads. Skipped ${res.skipped_duplicates} duplicates and ${res.skipped_invalid} invalid rows.`);
            await loadLeads();
        } catch (err) {
            setError(`Upload failed: ${err.message}`);
        } finally {
            setUploading(false);
            setFile(null);
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setSubmitting(true);
        try {
            await addLeadManual(manualForm);
            setMessage(`Successfully added lead ${manualForm.name}`);
            setManualForm({ name: '', role: '', company: '', email: '' });
            await loadLeads();
        } catch (err) {
            setError(`Failed to add lead: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSheetImport = async (e) => {
        e.preventDefault();
        if (!sheetUrl.trim()) return;
        setError('');
        setMessage('');
        setImportingSheet(true);
        try {
            const res = await importFromSheets(sheetUrl);
            setMessage(
                `Google Sheets Import: Added ${res.inserted} leads from ${res.total_found} found. ` +
                `Skipped ${res.skipped_duplicates} duplicates, ${res.skipped_invalid} invalid.`
            );
            setSheetUrl('');
            await loadLeads();
        } catch (err) {
            setError(`Google Sheets import failed: ${err.message}`);
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
            setError(`Failed to delete: ${err.message}`);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Upload Leads</h1>
            
            {error && <div role="alert" aria-live="assertive" className="bg-red-50 p-4 rounded-md text-red-800">{error}</div>}
            {message && <div role="status" aria-live="polite" className="bg-green-50 p-4 rounded-md text-green-800">{message}</div>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* CSV Upload */}
                <div className="bg-white p-6 shadow rounded-lg">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Upload CSV</h2>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="flex text-sm text-gray-600 justify-center">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                    <span>Upload a file</span>
                                    <input id="file-upload" name="file-upload" type="file" accept=".csv" className="sr-only" onChange={handleFileChange} disabled={uploading} />
                                </label>
                            </div>
                            <p className="text-xs text-gray-500">CSV up to 1MB. Required headers: name, role, company, email.</p>
                        </div>
                    </div>
                    {uploading && <p role="status" aria-live="polite" className="mt-2 text-sm text-gray-500 text-center">Uploading...</p>}
                </div>

                {/* Google Sheets Import */}
                <div className="bg-white p-6 shadow rounded-lg">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                        <span className="inline-flex items-center gap-2">
                            <svg className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 11V9h-6V3H7v6H1v2h6v6h2v-6h6v6h2v-6h5v-2z" opacity="0"/>
                                <path d="M14.5 2H6.5C5.4 2 4.5 2.9 4.5 4V20C4.5 21.1 5.4 22 6.5 22H18.5C19.6 22 20.5 21.1 20.5 20V8L14.5 2ZM18.5 20H6.5V4H13.5V9H18.5V20Z"/>
                                <rect x="8.5" y="12" width="8" height="1.5" rx="0.5" fill="#34A853"/>
                                <rect x="8.5" y="15" width="8" height="1.5" rx="0.5" fill="#34A853"/>
                            </svg>
                            Google Sheets
                        </span>
                    </h2>
                    <form onSubmit={handleSheetImport} className="space-y-4">
                        <div>
                            <label htmlFor="sheet-url" className="block text-sm font-medium text-gray-700">Sheet URL</label>
                            <input
                                id="sheet-url"
                                type="url"
                                value={sheetUrl}
                                onChange={e => setSheetUrl(e.target.value)}
                                placeholder="https://docs.google.com/spreadsheets/d/..."
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">Sheet must be publicly shared ("Anyone with the link").</p>
                        </div>
                        <button
                            type="submit"
                            disabled={importingSheet || !sheetUrl.trim()}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                            {importingSheet ? 'Importing...' : 'Import from Google Sheets'}
                        </button>
                    </form>
                </div>

                {/* Manual Entry */}
                <div className="bg-white p-6 shadow rounded-lg">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Manual Entry</h2>
                    <form onSubmit={handleManualSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="manual-name" className="block text-sm font-medium text-gray-700">Name</label>
                                <input id="manual-name" type="text" required value={manualForm.name} onChange={e => setManualForm({...manualForm, name: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                            </div>
                            <div>
                                <label htmlFor="manual-role" className="block text-sm font-medium text-gray-700">Role</label>
                                <input id="manual-role" type="text" required value={manualForm.role} onChange={e => setManualForm({...manualForm, role: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                            </div>
                            <div>
                                <label htmlFor="manual-company" className="block text-sm font-medium text-gray-700">Company</label>
                                <input id="manual-company" type="text" required value={manualForm.company} onChange={e => setManualForm({...manualForm, company: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                            </div>
                            <div>
                                <label htmlFor="manual-email" className="block text-sm font-medium text-gray-700">Email</label>
                                <input id="manual-email" type="email" required value={manualForm.email} onChange={e => setManualForm({...manualForm, email: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                            </div>
                        </div>
                        <button type="submit" disabled={submitting} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                            {submitting ? 'Adding...' : 'Add Lead'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Leads Table */}
            <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Current Leads</h2>
                <LeadTable leads={leads} onLeadDeleted={handleDelete} />
            </div>
        </div>
    );
}
