import api from '../utils/api';

const TOKEN_KEY = 'domino_token';

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const register = async (username, email, password) => {
  const response = await api.post('/api/auth/register', { username, email, password });
  if (response.data.token) {
    setToken(response.data.token);
  }
  return response.data;
};

export const login = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password });
  if (response.data.token) {
    setToken(response.data.token);
  }
  return response.data;
};

export const logout = async () => {
  // Even if the API call fails, we should clear the token locally
  try {
    await api.post('/api/auth/logout');
  } catch (error) {
    console.error("Logout API call failed, but logging out locally.", error);
  } finally {
    removeToken();
  }
};

export const getCurrentUser = async () => {
  const token = getToken();
  if (!token) return null;
  
  try {
    const response = await api.get('/api/auth/me');
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch current user.", error);
    removeToken(); // Token might be invalid
    return null;
  }
};
