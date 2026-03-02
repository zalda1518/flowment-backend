const {
  createNotification,
  findUnreadNotificationsByUser,
  markNotificationReadById
} = require('../helpers/queryHelper')

/* =====================================
   OBTENER NOTIFICACIONES NO LEÍDAS
===================================== */
const getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' })
    }

    console.log('GET /notifications for userId =', userId)

    const rows = await findUnreadNotificationsByUser(userId)

    return res.status(200).json(rows)

  } catch (err) {
    console.error('Error getUnreadNotifications:', err)
    return res.status(500).json({
      message: 'Error obteniendo notificaciones',
      error: err.message
    })
  }
}

/* =====================================
   MARCAR NOTIFICACIÓN COMO LEÍDA
===================================== */
const markNotificationRead = async (req, res) => {
  try {
    const id = req.params.id
    const userId = req.userId

    if (!id) {
      return res.status(400).json({
        message: 'Id de notificación requerido'
      })
    }

    await markNotificationReadById(id, userId)

    return res.status(200).json({ ok: true })

  } catch (err) {
    console.error('Error markNotificationRead:', err)
    return res.status(500).json({
      message: 'Error marcando notificación',
      error: err.message
    })
  }
}

module.exports = {
  getUnreadNotifications,
  markNotificationRead,
  createNotification
}