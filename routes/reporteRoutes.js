import express from 'express';
import { exportarReporte } from '../controllers/reporteController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// endpoint para exportar reportes en excel
router.post('/exportar', exportarReporte);

export default router;