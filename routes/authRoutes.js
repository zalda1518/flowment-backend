const express = require('express');
const {
  register,
  login,
  getColaboradores,
  getAllUsuarios,
  getUsuarioById,
  updateUsuario,
  deleteUsuario,
  exportarUsuarios,
  exportarColaboradores,
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Rutas públicas

//endpoint para registrar un nuevo usuario
router.post('/register', register);

//endpoint para iniciar sesión
router.post('/login', login);

// Rutas protegidas

//endpoint para obtener colaboradores por organización
router.get('/colaboradores', authMiddleware, getColaboradores);

// Endpoints para gestión de usuarios

//endpoint para obtener todos los usuarios
router.get('/usuarios', authMiddleware, getAllUsuarios);

//endpoint para obtener un usuario por ID
router.get('/usuarios/:id', authMiddleware, getUsuarioById);

//endpoint para actualizar un usuario
router.put('/usuarios/:id', authMiddleware, updateUsuario);

//endpoint para eliminar un usuario
router.delete('/usuarios/:id', authMiddleware, deleteUsuario);

//endpoint para exportar usuarios a Excel
router.post('/usuarios/exportar', authMiddleware, exportarUsuarios);

//endpoint para exportar colaboradores a Excel
router.post('/exportar-colaboradores', authMiddleware, exportarColaboradores);

module.exports = router;
