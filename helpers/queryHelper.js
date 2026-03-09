const { pool } = require('../config/bd')

/* ================================
   USUARIOS
================================ */

// Buscar usuario por email
const findUsuarioByEmail = async (email) => {
  const [rows] = await pool.query(
    'SELECT * FROM usuarios WHERE email = ?',
    [email]
  )
  return rows.length > 0 ? rows[0] : null
}

// Buscar usuario por ID
const findUsuarioById = async (id) => {
  const [rows] = await pool.query(
    'SELECT * FROM usuarios WHERE id_usuario = ?',
    [id]
  )
  return rows.length > 0 ? rows[0] : null
}

// Crear usuario
const createUsuario = async (data) => {
  const { name, email, password, rol, tipoDocumento, numeroDocumento, organizacion, area, estado } = data

  const [result] = await pool.query(
    `INSERT INTO usuarios 
     (name, email, password, rol, tipoDocumento, numeroDocumento, organizacion, area, estado, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [name, email, password, rol, tipoDocumento, numeroDocumento, organizacion, area, estado]
  )

  return result.insertId
}

// Obtener todos los usuarios con filtros
const findAllUsuarios = async (where = {}, exclude = []) => {
  let query = 'SELECT * FROM usuarios WHERE 1=1'
  const params = []

  if (where.id_usuario) {
    query += ' AND id_usuario = ?'
    params.push(where.id_usuario)
  }

  if (where.rol) {
    query += ' AND rol = ?'
    params.push(where.rol)
  }

  if (where.organizacion) {
    query += ' AND organizacion = ?'
    params.push(where.organizacion)
  }

  query += ' ORDER BY id_usuario DESC'

  const [rows] = await pool.query(query, params)

  if (exclude.includes('password')) {
    return rows.map(({ password, ...rest }) => rest)
  }

  return rows
}

// Obtener colaboradores
const findColaboradores = async (organizacion) => {
  const [rows] = await pool.query(
    `SELECT id_usuario, name, email, rol, organizacion, area, tipoDocumento, numeroDocumento, estado
     FROM usuarios 
     WHERE rol = 'colaborador' AND organizacion = ?
     ORDER BY name ASC`,
    [organizacion]
  )

  return rows
}

// Actualizar usuario
const updateUsuario = async (id, data) => {
  const fields = []
  const values = []

  for (const key in data) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`)
      values.push(data[key])
    }
  }

  if (fields.length === 0) return false

  values.push(id)

  const [result] = await pool.query(
    `UPDATE usuarios SET ${fields.join(', ')} WHERE id_usuario = ?`,
    values
  )

  return result.affectedRows > 0
}

// Eliminar usuario
const deleteUsuario = async (id) => {
  const [result] = await pool.query(
    'DELETE FROM usuarios WHERE id_usuario = ?',
    [id]
  )
  return result.affectedRows > 0
}

/* ================================
   TAREAS
================================ */

// Crear tarea
const createTarea = async (data) => {
  const {
    titulo,
    descripcion,
    area,
    asignedTo,
    createdBy,
    fechaAsignacion,
    horaAsignacion,
    fechaVencimiento,
    horaVencimiento,
    estado
  } = data

  const [result] = await pool.query(
    `INSERT INTO tareas 
     (titulo, descripcion, area, asignedTo, createdBy, fecha_asignacion, hora_asignacion, fecha_vencimiento, hora_vencimiento, estado, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [titulo, descripcion, area, asignedTo, createdBy, fechaAsignacion, horaAsignacion, fechaVencimiento, horaVencimiento, estado]
  )

  return result.insertId
}

// Obtener tareas
const findTareas = async (where = {}) => {
  let query = `
    SELECT t.*, 
           u1.name as colaborador_name, 
           u1.email as colaborador_email, 
           u1.numeroDocumento,
           u2.name as creador_name, 
           u2.email as creador_email 
    FROM tareas t
    LEFT JOIN usuarios u1 ON t.asignedTo = u1.id_usuario
    LEFT JOIN usuarios u2 ON t.createdBy = u2.id_usuario
    WHERE 1=1
  `

  const params = []

  if (where.id_tarea) {
    query += ' AND t.id_tarea = ?'
    params.push(where.id_tarea)
  }

  if (where.createdBy) {
    query += ' AND t.createdBy = ?'
    params.push(where.createdBy)
  }

  if (where.asignedTo) {
    query += ' AND t.asignedTo = ?'
    params.push(where.asignedTo)
  }

  if (where.estado) {
    query += ' AND t.estado = ?'
    params.push(where.estado)
  }

  query += ' ORDER BY t.createdAt DESC'

  const [rows] = await pool.query(query, params)
  return rows
}

// Obtener tareas recibidas por colaborador
const findTareasRecibidas = async (asignedTo) => {
  const [rows] = await pool.query(
    `SELECT t.*, 
            u1.name as colaborador_name, 
            u1.email as colaborador_email, 
            u1.numeroDocumento,
            u2.name as creador_name, 
            u2.email as creador_email
     FROM tareas t
     LEFT JOIN usuarios u1 ON t.asignedTo = u1.id_usuario
     LEFT JOIN usuarios u2 ON t.createdBy = u2.id_usuario
     WHERE t.asignedTo = ?
     ORDER BY t.createdAt DESC`,
    [asignedTo]
  )

  return rows
}

// Obtener tarea por ID
const findTareaById = async (id) => {
  const [rows] = await pool.query(
    `SELECT t.*, 
            u1.name as colaborador_name, 
            u1.email as colaborador_email,
            u2.name as creador_name, 
            u2.email as creador_email 
     FROM tareas t
     LEFT JOIN usuarios u1 ON t.asignedTo = u1.id_usuario
     LEFT JOIN usuarios u2 ON t.createdBy = u2.id_usuario
     WHERE t.id_tarea = ?`,
    [id]
  )

  return rows.length > 0 ? rows[0] : null
}

// Actualizar tarea
const updateTarea = async (id, data) => {
  const fields = []
  const values = []
  const toNullable = (value) => (value === '' ? null : value)

  if (data.titulo !== undefined) {
    fields.push('titulo = ?')
    values.push(data.titulo)
  }

  if (data.descripcion !== undefined) {
    fields.push('descripcion = ?')
    values.push(data.descripcion)
  }

  if (data.area !== undefined) {
    fields.push('area = ?')
    values.push(data.area)
  }

  const fechaVencimiento =
    data.fecha_vencimiento !== undefined
      ? data.fecha_vencimiento
      : data.fechaVencimiento

  if (fechaVencimiento !== undefined) {
    fields.push('fecha_vencimiento = ?')
    values.push(toNullable(fechaVencimiento))
  }

  const horaVencimiento =
    data.hora_vencimiento !== undefined
      ? data.hora_vencimiento
      : data.horaVencimiento

  if (horaVencimiento !== undefined) {
    fields.push('hora_vencimiento = ?')
    values.push(toNullable(horaVencimiento))
  }

  if (data.observacion !== undefined) {
    fields.push('observacion = ?')
    values.push(data.observacion)
  }

  if (data.estado !== undefined) {
    fields.push('estado = ?')
    values.push(data.estado)
  }

  const resumenFinalizacion =
    data.resumen_finalizacion !== undefined
      ? data.resumen_finalizacion
      : data.resumenFinalizacion

  if (resumenFinalizacion !== undefined) {
    fields.push('resumen_finalizacion = ?')
    values.push(resumenFinalizacion)
  }

  if (data.solicitud_reapertura !== undefined) {
    fields.push('solicitud_reapertura = ?')
    values.push(
      data.solicitud_reapertura
        ? JSON.stringify(data.solicitud_reapertura)
        : null
    )
  }

  if (fields.length === 0) return false

  values.push(id)

  const [result] = await pool.query(
    `UPDATE tareas SET ${fields.join(', ')} WHERE id_tarea = ?`,
    values
  )

  return result.affectedRows > 0
}

/* ================================
   NOTIFICACIONES (MYSQL CORRECTO)
================================ */

// Crear notificación
const createNotification = async ({
  id_usuario,
  id_tarea = null,
  tipo = 'observacion',
  texto = ''
}) => {

  const [result] = await pool.query(
    `INSERT INTO notifications 
     (id_usuario, id_tarea, tipo, texto, leido, created_at)
     VALUES (?, ?, ?, ?, FALSE, NOW())`,
    [id_usuario, id_tarea, tipo, texto]
  )

  return result.insertId
}

// Obtener notificaciones no leídas
const findUnreadNotificationsByUser = async (id_usuario) => {
  const [rows] = await pool.query(
    `SELECT id, id_usuario, id_tarea, tipo, texto, leido, created_at
     FROM notifications
     WHERE id_usuario = ? AND leido = FALSE
     ORDER BY created_at DESC`,
    [id_usuario]
  )

  return rows
}

// Marcar notificación como leída
const markNotificationReadById = async (id, id_usuario = null) => {
  if (id_usuario) {
    await pool.query(
      `UPDATE notifications
       SET leido = TRUE
       WHERE id = ? AND id_usuario = ?`,
      [id, id_usuario]
    )
  } else {
    await pool.query(
      `UPDATE notifications
       SET leido = TRUE
       WHERE id = ?`,
      [id]
    )
  }

  return { ok: true }
}

module.exports = {
  findUsuarioByEmail,
  findUsuarioById,
  createUsuario,
  findAllUsuarios,
  findColaboradores,
  updateUsuario,
  deleteUsuario,
  createTarea,
  findTareas,
  findTareasRecibidas,
  findTareaById,
  updateTarea,
  createNotification,
  findUnreadNotificationsByUser,
  markNotificationReadById
}