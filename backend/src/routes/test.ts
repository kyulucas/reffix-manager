import { Router } from 'express';
import { 
  sendTestMessage,
  checkWhatsAppNumber,
  getInstanceQRCode
} from '../controllers/testController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Todas as rotas precisam de autenticação
router.use(authenticate);

// Rotas para teste de mensagens
router.post('/send-message', sendTestMessage);
router.post('/check-number', checkWhatsAppNumber);
router.get('/qrcode/:instanceId', getInstanceQRCode);

export default router;
