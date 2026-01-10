const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_HOST) {
    const port = process.env.EXPO_PUBLIC_API_PORT;
    const host = process.env.EXPO_PUBLIC_API_HOST;
    return port ? `http://${host}:${port}/api` : `https://${host}/api`;
  }
  return 'https://fitness-app-backend-vls4.onrender.com/api';
};

export const API_BASE_URL = getApiBaseUrl();
