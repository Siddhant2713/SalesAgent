import React, { useState, useEffect } from 'react';
import { uploadCSV, addLeadManual, getLeads, deleteLead } from '../api/api';
import LeadTable from '../components/LeadTable';

export default function UploadPage() {
    const [leads, setLeads] = useState([]);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    
    const [manualForm, setManualForm] = useState({ name: '', role: '', company: '', email: '' });
    const [submitting, setSubmitting] = useState(false);

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
            setFile(null); // Reset file input implicitly
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
            
            {error && <div className="bg-red-50 p-4 rounded-md text-red-800">{error}</div>}
            {message && <div className="bg-green-50 p-4 rounded-md text-green-800">{message}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    {uploading && <p className="mt-2 text-sm text-gray-500 text-center">Uploading...</p>}
                </div>

                {/* Manual Entry */}
                <div className="bg-white p-6 shadow rounded-lg">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Manual Entry</h2>
                    <form onSubmit={handleManualSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input type="text" required value={manualForm.name} onChange={e => setManualForm({...manualForm, name: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Role</label>
                                <input type="text" required value={manualForm.role} onChange={e => setManualForm({...manualForm, role: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Company</label>
                                <input type="text" required value={manualForm.company} onChange={e => setManualForm({...manualForm, company: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input type="email" required value={manualForm.email} onChange={e => setManualForm({...manualForm, email: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
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
