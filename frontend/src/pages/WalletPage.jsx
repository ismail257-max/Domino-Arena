import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as walletService from '../services/walletService';
import * as statsService from '../services/statsService';
import WalletCard from '../components/wallet/WalletCard';
import AddFundsModal from '../components/wallet/AddFundsModal';
import TransactionHistory from '../components/wallet/TransactionHistory';
import Toast from '../components/common/Toast';
import AnimatedButton from '../components/common/AnimatedButton';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FaWallet, FaLock, FaCheckCircle, FaArrowUp, FaArrowDown, FaBalanceScale, FaPlus } from 'react-icons/fa';

const WalletPage = () => {
  const [balanceData, setBalanceData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [balanceRes, statsRes] = await Promise.all([
        walletService.getBalance(),
        statsService.getMyStats(),
      ]);
      setBalanceData(balanceRes);
      setStatsData(statsRes);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to load wallet data.';
      setToast({ message: errorMessage, type: 'error' });
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddFundsSuccess = (message) => {
    setToast({ message, type: 'success' });
    fetchData(); // Refresh data after adding funds
  };

  const getNetProfit = () => {
    if (!statsData) return 0;
    return (statsData.totalEarnings || 0) - (statsData.totalLosses || 0);
  };

  const getProfitColor = () => {
    const net = getNetProfit();
    if (net > 0) return 'text-green-400';
    if (net < 0) return 'text-red-400';
    return 'text-white';
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-dark">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-dark">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      <AddFundsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAddFundsSuccess}
      />
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"
        >
          <h1 className="text-4xl font-bold text-white">My Wallet</h1>
          <AnimatedButton onClick={() => setIsModalOpen(true)} variant="primary" className="w-full sm:w-auto flex items-center justify-center">
            <FaPlus className="mr-2" /> Add Funds
          </AnimatedButton>
        </motion.div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <WalletCard
            title="Total Balance"
            amount={balanceData?.balance}
            icon={<FaWallet />}
            isLoading={false}
          />
          <WalletCard
            title="In-Game (Locked)"
            amount={balanceData?.lockedBalance}
            icon={<FaLock />}
            isLoading={false}
          />
          <WalletCard
            title="Available Balance"
            amount={balanceData?.availableBalance}
            icon={<FaCheckCircle />}
            isLoading={false}
            className="lg:col-span-1 md:col-span-2"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <WalletCard
            title="Total Earnings"
            amount={statsData?.totalEarnings}
            icon={<FaArrowUp className="text-green-400" />}
            isLoading={false}
          />
          <WalletCard
            title="Total Losses"
            amount={statsData?.totalLosses}
            icon={<FaArrowDown className="text-red-400" />}
            isLoading={false}
          />
          <WalletCard
            title="Net Profit"
            amount={getNetProfit()}
            icon={<FaBalanceScale className={getProfitColor()} />}
            isLoading={false}
          />
        </div>

        {/* Transaction History */}
        <TransactionHistory />
      </div>
    </div>
  );
};

export default WalletPage;
