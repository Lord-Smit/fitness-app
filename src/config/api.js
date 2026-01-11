import axios from 'axios';

const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_HOST) {
    const port = process.env.EXPO_PUBLIC_API_PORT;
    const host = process.env.EXPO_PUBLIC_API_HOST;
    return port ? `http://${host}:${port}/api` : `https://${host}/api`;
  }
  return 'https://fitness-app-backend-vls4.onrender.com/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Create axios instance with extended timeout for Render cold starts
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds to handle Render free tier cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add retry logic for failed requests
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Only retry on timeout or network errors, and only once
    if (
      (error.code === 'ECONNABORTED' || !error.response) &&
      !config._retry
    ) {
      config._retry = true;
      console.log('Retrying request after timeout...');
      return apiClient(config);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
