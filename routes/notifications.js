const express = require('express')
const router = express.Router()
const { getUnreadNotifications, markNotificationRead } = require('../controllers/notificationsController')
const authMiddleware = require('../middleware/authMiddleware') // asegúrate que setea req.userId

router.get('/notifications', authMiddleware, getUnreadNotifications)
router.put('/notifications/:id/read', authMiddleware, markNotificationRead)

module.exports = router