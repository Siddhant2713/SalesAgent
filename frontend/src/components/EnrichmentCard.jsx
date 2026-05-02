import React from 'react';

const STAGE_COLORS = {
    early_startup: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Early Startup' },
    growth_stage: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Growth Stage' },
    enterprise: { bg: 'bg-green-100', text: 'text-green-800', label: 'Enterprise' },
};

export default function EnrichmentCard({ enrichment, company }) {
    if (!enrichment || !enrichment.best_hook) return null;
    
    const stage = STAGE_COLORS[enrichment.company_stage] || STAGE_COLORS.growth_stage;
    
    return (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                    <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI Company Research
                </h4>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stage.bg} ${stage.text}`}>
                    {stage.label}
                </span>
            </div>
            
            <div className="space-y-2">
                <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Best Hook</span>
                    <p className="text-sm text-gray-800 mt-0.5 font-medium">{enrichment.best_hook}</p>
                </div>
                
                {enrichment.likely_pain_points && enrichment.likely_pain_points.length > 0 && (
                    <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pain Points</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {enrichment.likely_pain_points.map((point, i) => (
                                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white text-gray-700 border border-gray-200">
                                    {point}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                
                {enrichment.tone_recommendation && (
                    <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Suggested Tone:</span>
                        <span className="capitalize text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                            {enrichment.tone_recommendation}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
