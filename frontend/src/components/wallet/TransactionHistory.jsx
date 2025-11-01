import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as walletService from '../../services/walletService';
import LoadingSpinner from '../common/LoadingSpinner';
import { FaArrowLeft, FaArrowRight, FaPlusCircle, FaTrophy, FaHandHoldingUsd, FaExclamationTriangle, FaCoins } from 'react-icons/fa';

const TransactionIcon = ({ type }) => {
    const icons = {
        deposit: <FaPlusCircle className="text-green-400" />,
        win: <FaTrophy className="text-yellow-400" />,
        loss: <FaExclamationTriangle className="text-red-400" />,
        commission: <FaCoins className="text-orange-400" />,
        fee: <FaHandHoldingUsd className="text-gray-400" />,
        withdrawal: <FaArrowLeft className="text-blue-400" />,
        refund: <FaPlusCircle className="text-blue-400" />,
    };
    return icons[type] || <FaHandHoldingUsd className="text-gray-400" />;
};

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page: pagination.page, limit: 10 };
      const response = await walletService.getTransactions(params);
      
      // Handle backend response structure
      setTransactions(response.data || []);
      setPagination({
        page: response.page || 1,
        pages: response.pages || 1,
        total: response.total || 0
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to load transaction history.';
      setError(errorMessage);
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.pages && !loading) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getAmountColor = (tx) => {
    if (tx.type === 'deposit' || tx.type === 'win' || tx.type === 'refund') {
      return 'text-green-400';
    }
    return 'text-red-400';
  };

  const getAmountPrefix = (tx) => {
    if (tx.type === 'deposit' || tx.type === 'win' || tx.type === 'refund') {
      return '+';
    }
    return '-';
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-400 p-8 bg-red-500/10 rounded-lg border border-red-500/20">
          {error}
        </div>
      );
    }

    if (transactions.length === 0) {
      return (
        <div className="text-center text-gray-400 p-12 bg-dark rounded-lg">
          <FaHandHoldingUsd className="text-5xl mx-auto mb-4 opacity-50" />
          <p className="text-lg font-semibold">No transactions yet</p>
          <p className="text-sm mt-2">Your transaction history will appear here</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <AnimatePresence>
          {transactions.map((tx, index) => (
            <motion.div
              key={tx._id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-dark p-4 rounded-lg flex items-center justify-between gap-4 hover:bg-dark/80 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="text-2xl flex-shrink-0">
                  <TransactionIcon type={tx.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold capitalize text-white truncate">
                    {tx.type}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(tx.createdAt)}
                  </p>
                  {tx.description && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {tx.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`font-bold text-lg ${getAmountColor(tx)}`}>
                  {getAmountPrefix(tx)}${Math.abs(tx.amount).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  Bal: ${(tx.balanceAfter || 0).toFixed(2)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-dark-accent p-6 rounded-lg shadow-lg"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Transaction History</h2>
        {pagination.total > 0 && (
          <span className="text-sm text-gray-400">
            {pagination.total} transaction{pagination.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {renderContent()}
      
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || loading}
            className="p-2 rounded-full bg-gray-700 hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <FaArrowLeft />
          </button>
          <span className="font-semibold text-white">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages || loading}
            className="p-2 rounded-full bg-gray-700 hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <FaArrowRight />
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default TransactionHistory;
