import axios from 'axios';
import { mockOrders, mockDashboardConfig, generateMockId } from '../data/mockOrders';

// Use environment variable for API URL, fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 5000 // 5 second timeout
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

// Mock data storage in localStorage
const STORAGE_KEY = 'halleyx_mock_orders';
const CONFIG_KEY = 'halleyx_dashboard_config';

const getMockOrders = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : mockOrders;
};

const saveMockOrders = (orders) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
};

// API functions with mock fallback
export const login = async (credentials) => {
  try {
    return await api.post('/auth/login', credentials);
  } catch (error) {
    console.warn('Backend unavailable, using mock authentication');
    throw error; // Let LoginPage handle mock auth
  }
};

export const getOrders = async (dateFilter = 'All time') => {
  try {
    return await api.get(`/orders?dateFilter=${dateFilter}`);
  } catch (error) {
    console.warn('Backend unavailable, using mock orders');
    return { data: getMockOrders() };
  }
};

export const createOrder = async (data) => {
  try {
    return await api.post('/orders', data);
  } catch (error) {
    console.warn('Backend unavailable, creating mock order');
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
    return await api.put(`/orders/${id}`, data);
  } catch (error) {
    console.warn('Backend unavailable, updating mock order');
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
    return await api.delete(`/orders/${id}`);
  } catch (error) {
    console.warn('Backend unavailable, deleting mock order');
    const orders = getMockOrders();
    const filtered = orders.filter(o => o.id !== id);
    saveMockOrders(filtered);
    return { data: { status: 'success' } };
  }
};

export const getDashboardWidgets = async (dateFilter = 'All time') => {
  try {
    return await api.get(`/dashboard/widgets?dateFilter=${dateFilter}`);
  } catch (error) {
    console.warn('Backend unavailable, using mock dashboard config');
    const stored = localStorage.getItem(CONFIG_KEY);
    return { data: stored ? JSON.parse(stored) : mockDashboardConfig };
  }
};

export const saveDashboardConfig = async (data) => {
  try {
    return await api.post("/dashboard/save", data);
  } catch (error) {
    console.warn('Backend unavailable, saving mock dashboard config');
    localStorage.setItem(CONFIG_KEY, JSON.stringify(data));
    return { data: { status: 'success' } };
  }
};

export default api;
