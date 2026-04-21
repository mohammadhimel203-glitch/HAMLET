import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// GET /orders/stats
router.get('/stats', async (req, res) => {
  // Fetch all orders
  const orders = await pb.collection('orders').getFullList();

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (order.sellingPrice || 0), 0);
  const totalProfit = orders.reduce((sum, order) => sum + (order.profit || 0), 0);
  const pendingProfit = orders
    .filter((order) => order.profitStatus === 'pending')
    .reduce((sum, order) => sum + (order.profit || 0), 0);
  const deliveredOrders = orders.filter((order) => order.status === 'delivered').length;

  logger.info('Orders stats retrieved');

  res.json({
    totalOrders,
    totalRevenue,
    totalProfit,
    pendingProfit,
    deliveredOrders,
  });
});

// POST /orders/create
router.post('/create', async (req, res) => {
  const {
    brandOwnerId,
    productId,
    size,
    color,
    quantity,
    printArea,
    designFile,
    customerName,
    customerPhone,
    customerAddress,
    sellingPrice,
    paymentType,
  } = req.body;

  // Validate required fields
  if (
    !brandOwnerId ||
    !productId ||
    !size ||
    !color ||
    !quantity ||
    !printArea ||
    !customerName ||
    !customerPhone ||
    !customerAddress ||
    !sellingPrice ||
    !paymentType
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Fetch product details
  const product = await pb.collection('products').getOne(productId);
  const basePrice = product.basePrice || 0;

  logger.info(`Product fetched: ${productId}, basePrice: ${basePrice}`);

  // Fetch print area price from pricing_config
  const pricingConfig = await pb
    .collection('pricing_config')
    .getFirstListItem(`printAreaName="${printArea}"`);
  const printAreaPrice = pricingConfig.price || 0;

  logger.info(`Print area pricing fetched: ${printArea}, price: ${printAreaPrice}`);

  // Calculate costs
  const baseCost = (basePrice + printAreaPrice) * quantity;
  const profit = sellingPrice - baseCost;

  // Validate: sellingPrice >= baseCost
  if (sellingPrice < baseCost) {
    throw new Error(`Selling price (${sellingPrice}) must be greater than or equal to base cost (${baseCost})`);
  }

  logger.info(`Order calculation - baseCost: ${baseCost}, profit: ${profit}`);

  // Create order record
  const order = await pb.collection('orders').create({
    brandOwnerId,
    productId,
    size,
    color,
    quantity,
    printArea,
    designFile,
    customerName,
    customerPhone,
    customerAddress,
    sellingPrice,
    paymentType,
    baseCost,
    profit,
    status: 'pending',
    profitStatus: 'pending',
  });

  logger.info(`Order created: ${order.id}`);

  res.status(201).json({
    orderId: order.id,
    baseCost,
    profit,
    status: 'pending',
  });
});

// PATCH /orders/:orderId/status
router.patch('/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const { newStatus } = req.body;

  if (!orderId || !newStatus) {
    return res.status(400).json({ error: 'Order ID and new status are required' });
  }

  // Fetch current order
  const order = await pb.collection('orders').getOne(orderId);

  logger.info(`Fetched order: ${orderId}, current status: ${order.status}`);

  // Update order status
  const updatedOrder = await pb.collection('orders').update(orderId, {
    status: newStatus,
  });

  logger.info(`Order status updated: ${orderId} -> ${newStatus}`);

  let profitTransferred = false;

  // If status is Delivered and profitStatus is pending, transfer profit
  if (newStatus === 'Delivered' && order.profitStatus === 'pending') {
    // Update profitStatus to credited
    await pb.collection('orders').update(orderId, {
      profitStatus: 'credited',
    });

    logger.info(`Order profit status updated to credited: ${orderId}`);

    // Fetch wallet
    const wallet = await pb
      .collection('wallets')
      .getFirstListItem(`brandOwnerId="${order.brandOwnerId}"`);

    logger.info(`Wallet fetched for brand owner: ${order.brandOwnerId}`);

    // Update wallet profitBalance
    const newProfitBalance = (wallet.profitBalance || 0) + order.profit;
    await pb.collection('wallets').update(wallet.id, {
      profitBalance: newProfitBalance,
    });

    logger.info(`Wallet profit balance updated: ${wallet.id}, new balance: ${newProfitBalance}`);

    // Create transaction record
    await pb.collection('transactions').create({
      type: 'profit_added',
      amount: order.profit,
      status: 'approved',
      brandOwnerId: order.brandOwnerId,
      orderId: orderId,
    });

    logger.info(`Transaction created for profit: ${orderId}, amount: ${order.profit}`);

    profitTransferred = true;
  }

  res.json({
    orderId,
    newStatus,
    profitTransferred,
  });
});

// GET /admin/stats
router.get('/admin/stats', async (req, res) => {
  // Fetch all orders
  const orders = await pb.collection('orders').getFullList();

  // Fetch all transactions
  const transactions = await pb.collection('transactions').getFullList();

  // Fetch all brand owners
  const brandOwners = await pb.collection('brand_owners').getFullList();

  // Calculate stats
  const totalRevenue = orders.reduce((sum, order) => sum + (order.sellingPrice || 0), 0);

  const totalDeposits = transactions
    .filter((t) => t.type === 'recharge' && t.status === 'approved')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalProfitPaid = transactions
    .filter((t) => t.type === 'withdraw' && t.status === 'approved')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const pendingWithdrawals = transactions
    .filter((t) => t.type === 'withdraw' && t.status === 'pending')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalOrders = orders.length;

  const pendingApprovals = brandOwners.filter((bo) => !bo.approved).length;

  logger.info('Admin stats retrieved');

  res.json({
    totalRevenue,
    totalDeposits,
    totalProfitPaid,
    pendingWithdrawals,
    totalOrders,
    pendingApprovals,
  });
});

// GET /admin/orders
router.get('/admin/orders', async (req, res) => {
  const { status, search } = req.query;

  let filter = '';

  // Build filter based on query params
  if (status) {
    filter = `status="${status}"`;
  }

  if (search) {
    if (filter) {
      filter += ` && id~"${search}"`;
    } else {
      filter = `id~"${search}"`;
    }
  }

  logger.info(`Fetching orders with filter: ${filter || 'none'}`);

  // Fetch orders with optional filters and expand relations
  const orders = await pb.collection('orders').getList(1, 50, {
    filter: filter || undefined,
    expand: 'brandOwnerId,productId',
  });

  logger.info(`Orders fetched: ${orders.items.length} items`);

  res.json(orders.items);
});

// GET /admin/reports/revenue
router.get('/admin/reports/revenue', async (req, res) => {
  const { fromDate, toDate } = req.query;

  let filter = '';

  // Build date range filter
  if (fromDate && toDate) {
    filter = `created >= "${fromDate}" && created <= "${toDate}"`;
  } else if (fromDate) {
    filter = `created >= "${fromDate}"`;
  } else if (toDate) {
    filter = `created <= "${toDate}"`;
  }

  logger.info(`Fetching revenue report with filter: ${filter || 'none'}`);

  // Fetch orders with date filter
  const ordersData = await pb.collection('orders').getList(1, 500, {
    filter: filter || undefined,
  });

  const orders = ordersData.items;

  // Calculate totals
  const totalRevenue = orders.reduce((sum, order) => sum + (order.sellingPrice || 0), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Group by date for daily data
  const dailyMap = {};
  orders.forEach((order) => {
    const date = order.created.split(' ')[0]; // Extract date part
    if (!dailyMap[date]) {
      dailyMap[date] = 0;
    }
    dailyMap[date] += order.sellingPrice || 0;
  });

  const dailyData = Object.entries(dailyMap)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  logger.info('Revenue report generated');

  res.json({
    totalRevenue,
    averageOrderValue,
    totalOrders,
    dailyData,
  });
});

// GET /admin/reports/orders
router.get('/admin/reports/orders', async (req, res) => {
  // Fetch all orders
  const ordersData = await pb.collection('orders').getList(1, 500);
  const orders = ordersData.items;

  logger.info(`Fetched ${orders.length} orders for status report`);

  // Count by status
  const statusMap = {};
  const statuses = ['Pending', 'Approved', 'Printing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];

  statuses.forEach((status) => {
    statusMap[status] = 0;
  });

  orders.forEach((order) => {
    const status = order.status || 'Pending';
    if (Object.prototype.hasOwnProperty.call(statusMap, status)) {
      statusMap[status]++;
    }
  });

  const byStatus = Object.entries(statusMap).map(([status, count]) => ({
    status,
    count,
  }));

  const totalOrders = orders.length;

  logger.info('Orders status report generated');

  res.json({
    byStatus,
    totalOrders,
  });
});

export default router;
