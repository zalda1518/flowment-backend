const { pool } = require('../config/bd')

// Crear notificación (util para llamar desde otros controladores)
const createNotification = async ({ user_id, tarea_id = null, tipo = 'observacion', texto = '' }) => {
  const sql = `INSERT INTO notifications (user_id, tarea_id, tipo, texto) VALUES ($1,$2,$3,$4) RETURNING *`
  const { rows } = await pool.query(sql, [user_id, tarea_id, tipo, texto])
  return rows[0]
}

// Endpoint: obtener notificaciones no leídas del usuario autenticado
const getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.userId
    const sql = `SELECT id, user_id, tarea_id, tipo, texto, created_at FROM notifications WHERE user_id = $1 AND leido = FALSE ORDER BY created_at DESC`
    const { rows } = await pool.query(sql, [userId])
    return res.status(200).json(rows)
  } catch (err) {
    console.error('Error getUnreadNotifications:', err)
    return res.status(500).json({ message: 'Error obteniendo notificaciones' })
  }
}

// Endpoint: marcar notificación como leída
const markNotificationRead = async (req, res) => {
  try {
    const id = req.params.id
    // opcional: verificar que la notificación pertenece al usuario (seguridad)
    await pool.query(`UPDATE notifications SET leido = TRUE WHERE id = $1`, [id])
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Error markNotificationRead:', err)
    return res.status(500).json({ message: 'Error marcando notificación' })
  }
}

module.exports = {
  createNotification,
  getUnreadNotifications,
  markNotificationRead
}