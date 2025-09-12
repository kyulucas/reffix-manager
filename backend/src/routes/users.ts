import { Router } from 'express';
import { 
  getAllUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser,
  updateUserLimits 
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Todas as rotas precisam de autenticação
router.use(authenticate);

// Apenas admins podem gerenciar usuários
router.get('/', authorize('ADMIN'), getAllUsers);
router.get('/:id', authorize('ADMIN'), getUserById);
router.post('/', authorize('ADMIN'), createUser);
router.put('/:id', authorize('ADMIN'), updateUser);
router.delete('/:id', authorize('ADMIN'), deleteUser);
router.put('/:id/limits', authorize('ADMIN'), updateUserLimits);

export default router;
