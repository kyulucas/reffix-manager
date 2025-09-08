import { Router } from 'express';
import { login, register, getProfile, checkFirstAccess } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Rotas públicas
router.get('/first-access', checkFirstAccess);
router.post('/login', login);
router.post('/register', register);

// Rotas protegidas
router.get('/profile', authenticate, getProfile);

export default router;
