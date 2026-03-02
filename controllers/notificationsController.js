const { pool } = require('../config/bd')
const { createNotification: createNotificationHelper, findUnreadNotificationsByUser, markNotificationReadById } = require('../helpers/queryHelper')

// Crear notificación (util para llamar desde otros controladores)
const createNotification = async ({ id_usuario, id_tarea = null, tipo = 'observacion', texto = '' }) => {
  const sql = `INSERT INTO notifications (id_usuario, id_tarea, tipo, texto) VALUES ($1,$2,$3,$4) RETURNING *`
  const { rows } = await pool.query(sql, [id_usuario, id_tarea, tipo, texto])
  return rows[0]
}

// Endpoint: obtener notificaciones no leídas del usuario autenticado
const getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado' })
    console.log('GET /notifications for userId=', userId)
    const rows = await findUnreadNotificationsByUser(userId)
    return res.status(200).json(rows)
  } catch (err) {
    console.error('Error getUnreadNotifications:', err)
    return res.status(500).json({ message: 'Error obteniendo notificaciones', error: err.message })
  }
}

// Endpoint: marcar notificación como leída
const markNotificationRead = async (req, res) => {
  try {
    const id = req.params.id
    const userId = req.userId
    if (!id) return res.status(400).json({ message: 'Id de notificación requerido' })
    await markNotificationReadById(id, userId)
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Error markNotificationRead:', err)
    return res.status(500).json({ message: 'Error marcando notificación', error: err.message })
  }
}

// Exportar también utilidad para uso interno (si la necesitas)
module.exports = {
  getUnreadNotifications,
  markNotificationRead,
  createNotification: createNotificationHelper
}