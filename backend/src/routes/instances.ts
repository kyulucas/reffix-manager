import { Router } from 'express';
import { 
  getAllInstances,
  getInstanceById,
  createInstance,
  updateInstance,
  deleteInstance,
  getInstanceStatus,
  restartInstance,
  connectInstance,
  disconnectInstance
} from '../controllers/instanceController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Todas as rotas precisam de autenticação
router.use(authenticate);

// Rotas para admins (podem ver todas as instâncias)
router.get('/', authorize('ADMIN'), getAllInstances);

// Rotas para clientes (apenas suas próprias instâncias)
router.get('/my', getAllInstances); // Filtrado por usuário no controller
router.get('/:id', getInstanceById);
router.post('/', createInstance);
router.put('/:id', updateInstance);
router.delete('/:id', deleteInstance);
router.get('/:id/status', getInstanceStatus);
router.post('/:id/restart', restartInstance);
router.post('/:id/connect', connectInstance);
router.post('/:id/disconnect', disconnectInstance);

export default router;
