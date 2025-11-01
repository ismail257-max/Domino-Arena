import api from '../utils/api';

/**
 * Fetches detailed statistics for the currently authenticated user.
 * @returns {Promise<Object>} A promise that resolves to the user's stats data.
 */
export const getMyStats = async () => {
  const response = await api.get('/api/stats/me');
  return response.data.data;
};
