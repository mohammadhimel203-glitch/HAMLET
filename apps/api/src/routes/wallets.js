import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// GET /wallets/:brandOwnerId
router.get('/:brandOwnerId', async (req, res) => {
  const { brandOwnerId } = req.params;

  if (!brandOwnerId) {
    return res.status(400).json({ error: 'Brand owner ID is required' });
  }

  // Fetch wallet record
  const wallet = await pb
    .collection('wallets')
    .getFirstListItem(`brandOwnerId="${brandOwnerId}"`);

  logger.info(`Wallet fetched for brand owner: ${brandOwnerId}`);

  res.json({
    orderBalance: wallet.orderBalance || 0,
    profitBalance: wallet.profitBalance || 0,
    updated: wallet.updated,
  });
});

// PATCH /transactions/:transactionId/approve
router.patch('/transactions/:transactionId/approve', async (req, res) => {
  const { transactionId } = req.params;

  if (!transactionId) {
    return res.status(400).json({ error: 'Transaction ID is required' });
  }

  // Fetch transaction
  const transaction = await pb.collection('transactions').getOne(transactionId);

  logger.info(`Transaction fetched: ${transactionId}, type: ${transaction.type}`);

  // Update transaction status to approved
  await pb.collection('transactions').update(transactionId, {
    status: 'approved',
  });

  logger.info(`Transaction status updated to approved: ${transactionId}`);

  let walletUpdated = false;

  if (transaction.type === 'recharge') {
    // Fetch wallet
    const wallet = await pb
      .collection('wallets')
      .getFirstListItem(`brandOwnerId="${transaction.brandOwnerId}"`);

    logger.info(`Wallet fetched for recharge: ${wallet.id}`);

    // Update orderBalance
    const newOrderBalance = (wallet.orderBalance || 0) + transaction.amount;
    await pb.collection('wallets').update(wallet.id, {
      orderBalance: newOrderBalance,
    });

    logger.info(`Wallet order balance updated: ${wallet.id}, new balance: ${newOrderBalance}`);

    walletUpdated = true;
  } else if (transaction.type === 'withdraw') {
    // Fetch wallet
    const wallet = await pb
      .collection('wallets')
      .getFirstListItem(`brandOwnerId="${transaction.brandOwnerId}"`);

    logger.info(`Wallet fetched for withdraw: ${wallet.id}`);

    // Update profitBalance
    const newProfitBalance = (wallet.profitBalance || 0) - transaction.amount;
    await pb.collection('wallets').update(wallet.id, {
      profitBalance: newProfitBalance,
    });

    logger.info(`Wallet profit balance updated: ${wallet.id}, new balance: ${newProfitBalance}`);

    walletUpdated = true;
  }

  res.json({
    transactionId,
    status: 'approved',
    walletUpdated,
  });
});

// PATCH /transactions/:transactionId/reject
router.patch('/transactions/:transactionId/reject', async (req, res) => {
  const { transactionId } = req.params;
  const { reason } = req.body;

  if (!transactionId) {
    return res.status(400).json({ error: 'Transaction ID is required' });
  }

  // Update transaction status to rejected
  await pb.collection('transactions').update(transactionId, {
    status: 'rejected',
    reason: reason || '',
  });

  logger.info(`Transaction rejected: ${transactionId}, reason: ${reason || 'none'}`);

  res.json({
    transactionId,
    status: 'rejected',
  });
});

// GET /admin/reports/deposits
router.get('/admin/reports/deposits', async (req, res) => {
  // Fetch all recharge transactions
  const transactionsData = await pb.collection('transactions').getList(1, 500, {
    filter: 'type="recharge"',
  });

  const transactions = transactionsData.items;

  logger.info(`Fetched ${transactions.length} deposit transactions`);

  // Calculate totals
  const totalDeposits = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const approvedDeposits = transactions
    .filter((t) => t.status === 'approved')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const pendingDeposits = transactions
    .filter((t) => t.status === 'pending')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const rejectedDeposits = transactions
    .filter((t) => t.status === 'rejected')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Group by status
  const statusMap = {};
  transactions.forEach((t) => {
    const status = t.status || 'pending';
    if (!statusMap[status]) {
      statusMap[status] = { amount: 0, count: 0 };
    }
    statusMap[status].amount += t.amount || 0;
    statusMap[status].count++;
  });

  const byStatus = Object.entries(statusMap).map(([status, data]) => ({
    status,
    amount: data.amount,
    count: data.count,
  }));

  logger.info('Deposits report generated');

  res.json({
    totalDeposits,
    approvedDeposits,
    pendingDeposits,
    rejectedDeposits,
    byStatus,
  });
});

// GET /admin/reports/withdrawals
router.get('/admin/reports/withdrawals', async (req, res) => {
  // Fetch all withdraw transactions
  const transactionsData = await pb.collection('transactions').getList(1, 500, {
    filter: 'type="withdraw"',
  });

  const transactions = transactionsData.items;

  logger.info(`Fetched ${transactions.length} withdrawal transactions`);

  // Calculate totals
  const totalWithdrawals = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const approvedWithdrawals = transactions
    .filter((t) => t.status === 'approved')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const pendingWithdrawals = transactions
    .filter((t) => t.status === 'pending')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const rejectedWithdrawals = transactions
    .filter((t) => t.status === 'rejected')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Group by status
  const statusMap = {};
  transactions.forEach((t) => {
    const status = t.status || 'pending';
    if (!statusMap[status]) {
      statusMap[status] = { amount: 0, count: 0 };
    }
    statusMap[status].amount += t.amount || 0;
    statusMap[status].count++;
  });

  const byStatus = Object.entries(statusMap).map(([status, data]) => ({
    status,
    amount: data.amount,
    count: data.count,
  }));

  logger.info('Withdrawals report generated');

  res.json({
    totalWithdrawals,
    approvedWithdrawals,
    pendingWithdrawals,
    rejectedWithdrawals,
    byStatus,
  });
});

export default router;
