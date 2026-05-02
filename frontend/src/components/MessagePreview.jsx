import React, { useState } from 'react';

export default function MessagePreview({ leadName, company, variants }) {
    const [activeTab, setActiveTab] = useState('friendly');
    
    if (!variants) return null;

    const variant = variants[activeTab];

    return (
        <div className="bg-white shadow sm:rounded-lg mb-6 overflow-hidden border border-gray-200">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-between items-center border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {leadName} <span className="text-gray-500 text-sm font-normal">@ {company}</span>
                </h3>
            </div>
            
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex" role="tablist" aria-label="Email tone variants">
                    {['friendly', 'direct', 'curiosity'].map((tone) => (
                        <button
                            key={tone}
                            role="tab"
                            id={`tab-${leadName}-${tone}`}
                            aria-selected={activeTab === tone}
                            aria-controls={`panel-${leadName}-${tone}`}
                            onClick={() => setActiveTab(tone)}
                            className={`${
                                activeTab === tone
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } w-1/3 py-3 px-1 text-center border-b-2 font-medium text-sm capitalize transition-colors`}
                        >
                            {tone}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div
                role="tabpanel"
                id={`panel-${leadName}-${activeTab}`}
                aria-labelledby={`tab-${leadName}-${activeTab}`}
                className="p-4 sm:p-6 bg-white"
            >
                {variant ? (
                    <>
                        <div className="mb-4">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</span>
                            <p className="mt-1 font-bold text-gray-900">{variant.subject}</p>
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Body</span>
                            <div className="mt-1 text-gray-700 whitespace-pre-wrap font-sans text-sm border p-3 rounded bg-gray-50">
                                {variant.body}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-gray-500 italic">No variant generated for this tone.</div>
                )}
            </div>
        </div>
    );
}
