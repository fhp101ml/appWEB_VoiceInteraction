import { create } from 'zustand';

export const useInteractionStore = create((set) => ({
    // Form State
    formData: {},
    setFormData: (data) => set((state) => ({
        formData: { ...state.formData, ...data }
    })),
    updateField: (field, value) => set((state) => ({
        formData: { ...state.formData, [field]: value }
    })),

    // Chat State
    messages: [],
    addMessage: (msg) => set((state) => ({
        messages: [...state.messages, msg]
    })),

    // Connection State
    isConnected: false,
    setConnected: (status) => set({ isConnected: status }),

    // Voice State
    isRecording: false,
    setRecording: (status) => set({ isRecording: status }),
}));
