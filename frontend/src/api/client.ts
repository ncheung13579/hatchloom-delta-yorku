// Shared Axios instance for all API calls. Injects the auth token on every
// request and handles 401 responses by clearing session and redirecting to login.
import axios from 'axios';
import type { AxiosError } from 'axios';
import type { ApiError } from '../types';

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach bearer token from localStorage to every outgoing request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('hatchloom_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear stored credentials and force redirect to login
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hatchloom_token');
      localStorage.removeItem('hatchloom_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
