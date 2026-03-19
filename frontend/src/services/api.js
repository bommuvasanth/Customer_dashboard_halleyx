import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api'
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const login = (credentials) => api.post('/auth/login', credentials);
export const getOrders = (dateFilter = 'All time') => api.get(`/orders?dateFilter=${dateFilter}`);
export const createOrder = (data) => api.post('/orders', data);
export const updateOrder = (id, data) => api.put(`/orders/${id}`, data);
export const deleteOrder = (id) => api.delete(`/orders/${id}`);
export const getDashboardWidgets = (dateFilter = 'All time') => api.get(`/dashboard/widgets?dateFilter=${dateFilter}`);
export const saveDashboardConfig = (data) => api.post("/dashboard/save", data);

export default api;
