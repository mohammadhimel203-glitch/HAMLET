import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// POST /auth/brand-owner-signup
router.post('/brand-owner-signup', async (req, res) => {
  const { email, password, fullName, brandName, mobile, address } = req.body;

  // Validate required fields
  if (!email || !password || !fullName || !brandName || !mobile || !address) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Create user record
  const user = await pb.collection('users').create({
    email,
    password,
    passwordConfirm: password,
    fullName,
    role: 'brand_owner',
    approved: false,
  });

  logger.info(`User created: ${user.id}`);

  // Create brand_owners record
  await pb.collection('brand_owners').create({
    userId: user.id,
    brandName,
    mobile,
    address,
  });

  logger.info(`Brand owner record created for user: ${user.id}`);

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    message: 'Signup successful. Awaiting admin approval.',
  });
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Authenticate user
  const authData = await pb.collection('users').authWithPassword(email, password);
  const user = authData.record;

  logger.info(`User logged in: ${user.id}`);

  // Check if brand_owner is approved
  if (user.role === 'brand_owner' && !user.approved) {
    throw new Error('Account not approved by admin');
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      approved: user.approved,
    },
    token: pb.authStore.token,
  });
});

// POST /auth/admin-login
router.post('/admin-login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Authenticate user
  const authData = await pb.collection('users').authWithPassword(email, password);
  const user = authData.record;

  logger.info(`Admin login attempt: ${user.id}`);

  // Check if user is super_admin
  if (user.role !== 'super_admin') {
    throw new Error('Admin access only');
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    token: pb.authStore.token,
  });
});

// GET /admin/brand-owners
router.get('/admin/brand-owners', async (req, res) => {
  // Fetch all brand owners with pagination
  const brandOwnersData = await pb.collection('brand_owners').getList(1, 500, {
    expand: 'userId',
  });

  logger.info(`Fetched ${brandOwnersData.items.length} brand owners`);

  // Fetch all orders to calculate stats
  const allOrders = await pb.collection('orders').getFullList();

  // Calculate stats for each brand owner
  const brandOwnersWithStats = brandOwnersData.items.map((brandOwner) => {
    const brandOwnerOrders = allOrders.filter((order) => order.brandOwnerId === brandOwner.id);

    const totalOrders = brandOwnerOrders.length;
    const totalProfit = brandOwnerOrders
      .filter((order) => order.status === 'delivered')
      .reduce((sum, order) => sum + (order.profit || 0), 0);

    return {
      ...brandOwner,
      totalOrders,
      totalProfit,
    };
  });

  logger.info('Brand owners with stats calculated');

  res.json(brandOwnersWithStats);
});

// GET /admin/reports/brand-owners
router.get('/admin/reports/brand-owners', async (req, res) => {
  // Fetch all brand owners
  const brandOwnersData = await pb.collection('brand_owners').getList(1, 500);

  logger.info(`Fetched ${brandOwnersData.items.length} brand owners for report`);

  // Fetch all orders
  const allOrders = await pb.collection('orders').getFullList();

  // Calculate stats for each brand owner
  const brandOwnersWithStats = brandOwnersData.items.map((brandOwner) => {
    const brandOwnerOrders = allOrders.filter((order) => order.brandOwnerId === brandOwner.id);

    const totalOrders = brandOwnerOrders.length;
    const totalRevenue = brandOwnerOrders.reduce((sum, order) => sum + (order.sellingPrice || 0), 0);
    const totalProfit = brandOwnerOrders
      .filter((order) => order.status === 'delivered')
      .reduce((sum, order) => sum + (order.profit || 0), 0);

    return {
      ...brandOwner,
      totalOrders,
      totalRevenue,
      totalProfit,
    };
  });

  // Sort by totalOrders descending
  brandOwnersWithStats.sort((a, b) => b.totalOrders - a.totalOrders);

  logger.info('Brand owners report generated');

  res.json(brandOwnersWithStats);
});

export default router;
