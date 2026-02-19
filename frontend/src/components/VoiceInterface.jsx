import React from 'react';
import { Mic } from 'lucide-react';
import { useInteractionStore } from '../stores/interactionStore';
import { useAudio } from '../hooks/useAudio';

const VoiceInterface = () => {
    const { isRecording, isConnected } = useInteractionStore();
    const { startRecording, stopRecording } = useAudio();

    // Keyboard Shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowDown' && isConnected && !isRecording) {
                e.preventDefault();
                startRecording();
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                stopRecording();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isConnected, isRecording, startRecording, stopRecording]);

    return (
        <div className="d-flex flex-column align-items-center gap-3">
            {/* Status Badge */}
            <div className={`badge rounded-pill px-3 py-1 ${isConnected ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}
                style={{ fontSize: '0.7rem', fontWeight: '600', letterSpacing: '0.5px' }}>
                {isConnected ? '● READY' : '● OFFLINE'}
            </div>

            {/* Voice Button */}
            <div className="position-relative">
                <button
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onMouseLeave={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    disabled={!isConnected}
                    className={`btn rounded-circle d-flex align-items-center justify-content-center border-0 position-relative`}
                    style={{
                        width: '80px',
                        height: '80px',
                        background: isRecording ? 'var(--gradient-secondary)' : 'var(--gradient-primary)',
                        boxShadow: isRecording ? '0 0 30px rgba(236, 72, 153, 0.5)' : 'var(--shadow-glow)',
                        transform: isRecording ? 'scale(1.05)' : 'scale(1)',
                        transition: 'all 0.3s ease',
                        cursor: isConnected ? 'pointer' : 'not-allowed',
                        opacity: !isConnected ? 0.5 : 1
                    }}
                >
                    <Mic size={32} color="white" strokeWidth={2.5} />

                    {/* Recording Pulse Animation */}
                    {isRecording && (
                        <>
                            <span
                                className="position-absolute top-0 start-0 w-100 h-100 rounded-circle"
                                style={{
                                    border: '3px solid rgba(236, 72, 153, 0.5)',
                                    animation: 'pulse-glow 1.5s infinite'
                                }}
                            />
                            <span
                                className="position-absolute rounded-circle"
                                style={{
                                    width: '100px',
                                    height: '100px',
                                    border: '2px solid rgba(236, 72, 153, 0.3)',
                                    animation: 'pulse-glow 2s infinite'
                                }}
                            />
                        </>
                    )}
                </button>
            </div>

            {/* Instruction Text */}
            <p className="text-muted small fw-semibold mb-0 text-uppercase"
                style={{ letterSpacing: '1px', fontSize: '0.75rem' }}>
                {isRecording ? (
                    <span className="text-danger">● Listening...</span>
                ) : (
                    'Hold to Speak'
                )}
            </p>
            <p className="text-muted text-center" style={{ fontSize: '0.85rem', marginTop: '-5px' }}>
                (or press <kbd style={{ fontSize: '1.2em', padding: '0.1rem 0.5rem', verticalAlign: 'middle' }}>↓</kbd>)
            </p>

            {/* Voice Waves when Recording */}
            {isRecording && (
                <div className="d-flex align-items-center gap-1" style={{ height: '30px' }}>
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="rounded-pill"
                            style={{
                                width: '4px',
                                background: 'var(--gradient-secondary)',
                                animation: `wave-${i} 0.8s ease-in-out infinite`,
                                animationDelay: `${i * 0.1}s`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Inject wave animations */}
            <style>
                {`
                    @keyframes wave-0 { 0%, 100% { height: 8px; } 50% { height: 24px; } }
                    @keyframes wave-1 { 0%, 100% { height: 12px; } 50% { height: 30px; } }
                    @keyframes wave-2 { 0%, 100% { height: 16px; } 50% { height: 32px; } }
                    @keyframes wave-3 { 0%, 100% { height: 12px; } 50% { height: 28px; } }
                    @keyframes wave-4 { 0%, 100% { height: 8px; } 50% { height: 20px; } }
                `}
            </style>
        </div>
    );
};

export default VoiceInterface;
