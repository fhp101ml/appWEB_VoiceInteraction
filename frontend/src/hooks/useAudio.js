import { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useInteractionStore } from '../stores/interactionStore';

const SOCKET_URL = 'http://localhost:8001'; // Adjust if needed

export const useAudio = () => {
    const socketRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const {
        setConnected,
        addMessage,
        updateField,
        setRecording
    } = useInteractionStore();

    useEffect(() => {
        // Initialize Socket
        socketRef.current = io(SOCKET_URL);

        socketRef.current.on('connect', () => {
            console.log('Connected to backend');
            setConnected(true);
        });

        socketRef.current.on('disconnect', () => {
            console.log('Disconnected');
            setConnected(false);
        });

        // Handle Voice Response
        socketRef.current.on('voice_response', (data) => {
            const { text, audio, user_text, actions } = data;

            // Add user text to chat
            if (user_text) {
                addMessage({ sender: 'user', text: user_text });
            }
            // Add agent response to chat
            addMessage({ sender: 'agent', text: text });

            // Play Audio
            if (audio) {
                const audioSrc = `data:audio/mp3;base64,${audio}`;
                const audioPlayer = new Audio(audioSrc);
                audioPlayer.play();
            }

            // Execute Actions
            if (actions && actions.length > 0) {
                actions.forEach(action => {
                    if (action.action === 'update_form') {
                        updateField(action.field, action.value);
                    } else if (action.action === 'submit_form') {
                        alert('Form Submitted successfully!');
                    } else if (['producto_created', 'product_updated', 'product_deleted', 'material_created', 'material_updated', 'material_deleted'].includes(action.action)) {
                        // Dispatch global event for listeners (like ProductsManager)
                        window.dispatchEvent(new CustomEvent('products_updated'));
                    } else if (action.action === 'open_product_form' || action.action === 'open_material_form') {
                        window.dispatchEvent(new CustomEvent('open_product_form'));
                    } else if (action.action === 'close_product_form' || action.action === 'close_material_form') {
                        window.dispatchEvent(new CustomEvent('close_product_form'));
                    } else if (action.action === 'login') {
                        window.dispatchEvent(new CustomEvent('login_attempt', { detail: action }));
                    } else if (action.action === 'logout') {
                        window.dispatchEvent(new CustomEvent('logout_attempt'));
                    }
                });
            }
        });

        // Handle Text Chat Response
        socketRef.current.on('chat_response', (data) => {
            const { text, actions } = data;
            addMessage({ sender: 'agent', text: text });

            if (actions && actions.length > 0) {
                actions.forEach(action => {
                    if (action.action === 'update_form') {
                        updateField(action.field, action.value);
                    } else if (action.action === 'submit_form') {
                        alert('Form Submitted successfully!');
                    } else if (['producto_created', 'product_updated', 'product_deleted', 'material_created', 'material_updated', 'material_deleted'].includes(action.action)) {
                        window.dispatchEvent(new CustomEvent('products_updated'));
                    } else if (action.action === 'open_product_form' || action.action === 'open_material_form') {
                        window.dispatchEvent(new CustomEvent('open_product_form'));
                    } else if (action.action === 'close_product_form' || action.action === 'close_material_form') {
                        window.dispatchEvent(new CustomEvent('close_product_form'));
                    } else if (action.action === 'login') {
                        window.dispatchEvent(new CustomEvent('login_attempt', { detail: action }));
                    } else if (action.action === 'logout') {
                        window.dispatchEvent(new CustomEvent('logout_attempt'));
                    }
                });
            }
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                // Emit to backend
                if (socketRef.current) {
                    socketRef.current.emit('voice_input', { audio: audioBlob, context: {} });
                }
            };

            mediaRecorderRef.current.start();
            setRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
    };

    const sendChatMessage = (text) => {
        if (socketRef.current) {
            addMessage({ sender: 'user', text: text });
            socketRef.current.emit('chat_message', { message: text, context: {} });
        }
    };

    return { startRecording, stopRecording, sendChatMessage };
};
