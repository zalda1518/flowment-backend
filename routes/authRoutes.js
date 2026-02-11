import express from 'express';
import {
  register,
  login,
  getProfile,
  getColaboradores,
  getAllUsuarios,
  getUsuarioById,
  updateUsuario,
  deleteUsuario,
  exportarUsuarios,
  exportarColaboradores,
} from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.post('/register', register);
router.post('/login', login);

// Rutas protegidas
router.get('/perfil', authMiddleware, getProfile);
router.get('/colaboradores', authMiddleware, getColaboradores);

// Endpoints para gestión de usuarios
router.get('/usuarios', authMiddleware, getAllUsuarios);
router.get('/usuarios/:id', authMiddleware, getUsuarioById);
router.put('/usuarios/:id', authMiddleware, updateUsuario);
router.delete('/usuarios/:id', authMiddleware, deleteUsuario);
router.post('/usuarios/exportar', authMiddleware, exportarUsuarios);
router.post('/exportar-colaboradores', authMiddleware, exportarColaboradores);

export default router;
