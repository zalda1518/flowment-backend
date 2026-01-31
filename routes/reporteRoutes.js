const express = require('express');
const { exportarReporte } = require('../controllers/reporteController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación

// Middleware de autenticación
router.use(authMiddleware);

// Exportar reporte

//endpoint para exportar reportes en excel
router.post('/exportar', exportarReporte);

module.exports = router;