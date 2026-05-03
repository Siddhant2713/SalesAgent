import React from 'react';
import MessagePreview from './MessagePreview';
import EnrichmentCard from './EnrichmentCard';

export default function CampaignPreview({
    generatedData, selectedTone, setSelectedTone, handleSend
}) {
    const tones = ['friendly', 'direct', 'curiosity'];

    return (
        <div>
            {/* Success bar */}
            <div role="status" aria-live="polite" style={{
                borderLeft: '3px solid var(--status-replied-text)',
                background: 'var(--bg-elevated)',
                padding: '10px 14px',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                marginBottom: '24px'
            }}>
                Generated messages for {generatedData.generated_count} leads.
                {generatedData.skipped_count > 0 ? ` (Skipped ${generatedData.skipped_count} existing)` : ''}
            </div>

            {/* Lead cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
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

            {/* Send panel — sticky bottom */}
            <div style={{
                background: 'var(--bg-surface)',
                borderTop: '1px solid var(--border-subtle)',
                padding: '16px 24px',
                position: 'sticky',
                bottom: 0,
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                {/* Tone selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Send as</span>
                    {tones.map(tone => (
                        <label key={tone} style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '5px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                            background: selectedTone === tone ? 'var(--blue-subtle)' : 'var(--bg-elevated)',
                            border: `1px solid ${selectedTone === tone ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
                            color: selectedTone === tone ? 'var(--blue-primary)' : 'var(--text-secondary)',
                            transition: 'all 0.15s'
                        }}>
                            <input
                                type="radio"
                                name="tone"
                                id={`tone-${tone}`}
                                value={tone}
                                checked={selectedTone === tone}
                                onChange={() => setSelectedTone(tone)}
                                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                            />
                            {tone}
                        </label>
                    ))}
                </div>

                {/* Send button */}
                <button onClick={handleSend} className="sa-btn-primary">
                    Send Campaign
                </button>
            </div>
        </div>
    );
}
