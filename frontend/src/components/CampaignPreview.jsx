import React from 'react';
import MessagePreview from './MessagePreview';
import EnrichmentCard from './EnrichmentCard';

export default function CampaignPreview({
    generatedData, selectedTone, setSelectedTone, handleSend
}) {
    return (
        <div>
            <div role="status" aria-live="polite" className="bg-green-50 text-green-800 p-4 rounded-md mb-6">
                Generated messages for {generatedData.generated_count} leads. {generatedData.skipped_count > 0 ? `(Skipped ${generatedData.skipped_count} existing)` : ''}
            </div>

            <div className="space-y-6 mb-8">
                {generatedData.messages.map(msgData => (
                    <div key={msgData.lead_id}>
                        <EnrichmentCard 
                            enrichment={msgData.enrichment} 
                            company={msgData.company} 
                        />
                        <MessagePreview 
                            leadName={msgData.lead_name} 
                            company={msgData.company} 
                            variants={msgData.variants} 
                        />
                    </div>
                ))}
            </div>

            <div className="bg-white shadow rounded-lg p-6 sticky bottom-4 border-t-4 border-indigo-500">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Send Campaign</h3>
                <div className="flex items-center space-x-6 mb-6">
                    <span className="text-sm font-medium text-gray-700">Select Tone to Send:</span>
                    {['friendly', 'direct', 'curiosity'].map(tone => (
                        <label key={tone} htmlFor={`tone-${tone}`} className="flex items-center space-x-2 cursor-pointer">
                            <input 
                                id={`tone-${tone}`}
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
    );
}
