import { Router } from 'express';
import healthCheck from './health-check.js';
import authRouter from './auth.js';
import ordersRouter from './orders.js';
import walletsRouter from './wallets.js';

const router = Router();

export default () => {
    router.get('/health', healthCheck);
    router.use('/auth', authRouter);
    router.use('/orders', ordersRouter);
    router.use('/wallets', walletsRouter);
    router.use('/transactions', walletsRouter);

    return router;
};
