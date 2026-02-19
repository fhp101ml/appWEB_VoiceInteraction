import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { useInteractionStore } from '../stores/interactionStore';
import { useAudio } from '../hooks/useAudio';

const ChatInterface = () => {
    const { messages } = useInteractionStore();
    const { sendChatMessage } = useAudio();
    const [input, setInput] = useState('');
    const endRef = useRef(null);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        sendChatMessage(input);
        setInput('');
    };

    // Auto-scroll to bottom
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="d-flex flex-column h-100">
            {/* Messages Area */}
            <div className="flex-grow-1 overflow-auto p-4" style={{ scrollbarWidth: 'thin' }}>
                {messages.length === 0 ? (
                    <div className="text-center mt-5">
                        <div className="mb-3">
                            <div className="rounded-circle d-inline-flex align-items-center justify-center"
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    background: 'var(--gradient-primary)',
                                    opacity: 0.2
                                }}>
                                <span style={{ fontSize: '2rem' }}>💬</span>
                            </div>
                        </div>
                        <p className="text-muted fw-semibold">No messages yet</p>
                        <p className="small text-muted">Start a conversation with your AI assistant</p>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-3">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`d-flex ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                                style={{ animation: 'fadeInUp 0.3s ease-out' }}
                            >
                                <div
                                    className={`rounded-4 px-4 py-3 shadow-sm`}
                                    style={{
                                        maxWidth: '85%',
                                        background: msg.sender === 'user'
                                            ? 'var(--gradient-primary)'
                                            : 'var(--bg-secondary)',
                                        color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                                        borderBottomRightRadius: msg.sender === 'user' ? '4px' : '16px',
                                        borderBottomLeftRadius: msg.sender === 'user' ? '16px' : '4px'
                                    }}
                                >
                                    <p className="mb-0" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
                                        {msg.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <div ref={endRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 border-top d-flex gap-2 align-items-center bg-white">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="form-control rounded-pill border-0 px-4 py-2 shadow-sm"
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        fontSize: '0.95rem'
                    }}
                />
                <button
                    type="submit"
                    className="btn rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 border-0"
                    disabled={!input.trim()}
                    style={{
                        width: '44px',
                        height: '44px',
                        background: input.trim() ? 'var(--gradient-primary)' : 'var(--bg-secondary)',
                        transition: 'all 0.3s ease',
                        boxShadow: input.trim() ? 'var(--shadow-md)' : 'none'
                    }}
                >
                    <Send size={18} color={input.trim() ? 'white' : 'var(--text-muted)'} />
                </button>
            </form>
        </div>
    );
};

export default ChatInterface;
