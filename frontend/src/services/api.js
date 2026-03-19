import axios from 'axios';
import { mockOrders, mockDashboardConfig, generateMockId } from '../data/mockOrders';

// Use environment variable for API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

console.log('🔗 API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000 // 10 second timeout
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

// Mock data storage in localStorage (fallback only)
const STORAGE_KEY = 'halleyx_mock_orders';
const CONFIG_KEY = 'halleyx_dashboard_config';

const getMockOrders = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : mockOrders;
};

const saveMockOrders = (orders) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
};

// API functions with mock fallback (only if backend fails)
export const login = async (credentials) => {
  return await api.post('/auth/login', credentials);
};

export const getOrders = async (dateFilter = 'All time') => {
  try {
    const response = await api.get(`/orders?dateFilter=${dateFilter}`);
    console.log('✅ Orders fetched from backend');
    return response;
  } catch (error) {
    console.warn('⚠️ Backend unavailable, using mock orders');
    return { data: getMockOrders() };
  }
};

export const createOrder = async (data) => {
  try {
    const response = await api.post('/orders', data);
    console.log('✅ Order created on backend');
    return response;
  } catch (error) {
    console.warn('⚠️ Backend unavailable, creating mock order');
    const orders = getMockOrders();
    const newOrder = {
      ...data,
      id: generateMockId(),
      orderDate: new Date().toISOString()
    };
    orders.push(newOrder);
    saveMockOrders(orders);
    return { data: newOrder };
  }
};

export const updateOrder = async (id, data) => {
  try {
    const response = await api.put(`/orders/${id}`, data);
    console.log('✅ Order updated on backend');
    return response;
  } catch (error) {
    console.warn('⚠️ Backend unavailable, updating mock order');
    const orders = getMockOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...data };
      saveMockOrders(orders);
    }
    return { data: { status: 'success' } };
  }
};

export const deleteOrder = async (id) => {
  try {
    const response = await api.delete(`/orders/${id}`);
    console.log('✅ Order deleted from backend');
    return response;
  } catch (error) {
    console.warn('⚠️ Backend unavailable, deleting mock order');
    const orders = getMockOrders();
    const filtered = orders.filter(o => o.id !== id);
    saveMockOrders(filtered);
    return { data: { status: 'success' } };
  }
};

export const getDashboardWidgets = async (dateFilter = 'All time') => {
  try {
    const response = await api.get(`/dashboard/widgets?dateFilter=${dateFilter}`);
    console.log('✅ Dashboard config fetched from backend');
    return response;
  } catch (error) {
    console.warn('⚠️ Backend unavailable, using mock dashboard config');
    const stored = localStorage.getItem(CONFIG_KEY);
    return { data: stored ? JSON.parse(stored) : mockDashboardConfig };
  }
};

export const saveDashboardConfig = async (data) => {
  try {
    const response = await api.post("/dashboard/save", data);
    console.log('✅ Dashboard config saved to backend');
    return response;
  } catch (error) {
    console.warn('⚠️ Backend unavailable, saving mock dashboard config');
    localStorage.setItem(CONFIG_KEY, JSON.stringify(data));
    return { data: { status: 'success' } };
  }
};

export default api;
