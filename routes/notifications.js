const express = require('express')
const router = express.Router()
const { getUnreadNotifications, markNotificationRead } = require('../controllers/notificationsController')
const { authMiddleware } = require('../middleware/auth')


// Rutas de notificaciones

// Obtener notificaciones no leídas
router.get('/notifications', authMiddleware, getUnreadNotifications)

// Marcar notificación como leída
router.put('/notifications/:id/read', authMiddleware, markNotificationRead)

module.exports = router