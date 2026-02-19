import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = 'http://localhost:8001';

const apiClient = axios.create({
    baseURL: API_URL,
});

// Interceptor para añadir token
apiClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor para manejar errores 401 (Token invalido/expirado)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expirado o inválido -> Logout
            useAuthStore.getState().logout();
            // Opcional: Redirigir si no detecta el cambio de estado inmediatamente
            // window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (email, password) =>
        apiClient.post('/auth/login',
            new URLSearchParams({ username: email, password })
        ),
    register: (data) => apiClient.post('/auth/register', data),
};

// Users API
export const usersAPI = {
    getMe: () => apiClient.get('/users/me'),
    list: () => apiClient.get('/users/'),
    get: (id) => apiClient.get(`/users/${id}`),
    update: (id, data) => apiClient.put(`/users/${id}`, data),
    delete: (id) => apiClient.delete(`/users/${id}`),
};

// Products API
export const productsAPI = {
    create: (data) => apiClient.post('/products/', data),
    list: (params) => apiClient.get('/products/', { params }),
    get: (id) => apiClient.get(`/products/${id}`),
    update: (id, data) => apiClient.put(`/products/${id}`, data),
    delete: (id) => apiClient.delete(`/products/${id}`),
};

export default apiClient;
