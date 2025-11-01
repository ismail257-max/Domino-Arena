import api from '../utils/api';

/**
 * Fetches the user's current wallet balance.
 * @returns {Promise<Object>} A promise that resolves to the wallet balance data.
 */
export const getBalance = async () => {
  const response = await api.get('/api/wallet/balance');
  return response.data.data;
};

/**
 * Fetches a paginated list of the user's transactions.
 * @param {Object} params - Query parameters for pagination and filtering.
 * @param {number} params.page - The page number to fetch.
 * @param {number} params.limit - The number of transactions per page.
 * @returns {Promise<Object>} A promise that resolves to the transactions and pagination data.
 */
export const getTransactions = async (params = {}) => {
  const response = await api.get('/api/wallet/transactions', { params });
  return response.data;
};

/**
 * Adds funds to the user's wallet (for testnet purposes).
 * @param {number} amount - The amount to add.
 * @param {string} description - A description for the transaction.
 * @returns {Promise<Object>} A promise that resolves to the updated wallet data.
 */
export const addFunds = async (amount, description = 'Added testnet funds') => {
  const response = await api.post('/api/wallet/transaction', { amount, description });
  return response.data.data;
};
