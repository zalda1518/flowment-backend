const { pool } = require('../config/bd');

// Helper para encontrar un usuario por email
const findUsuarioByEmail = async (email) => {
  const [rows] = await pool.query(
    'SELECT * FROM usuarios WHERE email = ?',
    [email]
  );
  return rows.length > 0 ? rows[0] : null;
};

// Helper para encontrar un usuario por ID
const findUsuarioById = async (id) => {
  const [rows] = await pool.query(
    'SELECT * FROM usuarios WHERE id_usuario = ?',
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
};

// Helper para crear un usuario
const createUsuario = async (data) => {
  const { name, email, password, rol, tipoDocumento, numeroDocumento, organizacion, area, estado } = data;
  const [result] = await pool.query(
    `INSERT INTO usuarios (name, email, password, rol, tipoDocumento, numeroDocumento, organizacion, area, estado, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [name, email, password, rol, tipoDocumento, numeroDocumento, organizacion, area, estado]
  );
  return result.insertId;
};

// Helper para obtener todos los usuarios con filtros
const findAllUsuarios = async (where = {}, exclude = []) => {
  let query = 'SELECT * FROM usuarios WHERE 1=1';
  const params = [];

  if (where.id_usuario) {
    query += ' AND id_usuario = ?';
    params.push(where.id_usuario);
  }
  if (where.rol) {
    query += ' AND rol = ?';
    params.push(where.rol);
  }
  if (where.organizacion) {
    query += ' AND organizacion = ?';
    params.push(where.organizacion);
  }

  query += ' ORDER BY id_usuario DESC';

  const [rows] = await pool.query(query, params);
  
  // Excluir campos si es necesario
  if (exclude.includes('password')) {
    return rows.map(row => {
      const { password, ...rest } = row;
      return rest;
    });
  }
  return rows;
};

// Helper para obtener colaboradores
const findColaboradores = async (organizacion) => {
  const [rows] = await pool.query(
    `SELECT id_usuario, name, email, rol, organizacion, area, tipoDocumento, numeroDocumento, estado
     FROM usuarios 
     WHERE rol = 'colaborador' AND organizacion = ? 
     ORDER BY name ASC`,
    [organizacion]
  );
  return rows;
};

// Helper para actualizar un usuario
const updateUsuario = async (id, data) => {
  const fields = [];
  const values = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.email !== undefined) {
    fields.push('email = ?');
    values.push(data.email);
  }
  if (data.tipoDocumento !== undefined) {
    fields.push('tipoDocumento = ?');
    values.push(data.tipoDocumento);
  }
  if (data.numeroDocumento !== undefined) {
    fields.push('numeroDocumento = ?');
    values.push(data.numeroDocumento);
  }
  if (data.rol !== undefined) {
    fields.push('rol = ?');
    values.push(data.rol);
  }
  if (data.organizacion !== undefined) {
    fields.push('organizacion = ?');
    values.push(data.organizacion);
  }
  if (data.estado !== undefined) {
    fields.push('estado = ?');
    values.push(data.estado);
  }
  if (data.area !== undefined) {
    fields.push('area = ?');
    values.push(data.area);
  }

  values.push(id);

  const query = `UPDATE usuarios SET ${fields.join(', ')} WHERE id_usuario = ?`;
  const [result] = await pool.query(query, values);
  return result.affectedRows > 0;
};

// Helper para eliminar un usuario
const deleteUsuario = async (id) => {
  const [result] = await pool.query(
    'DELETE FROM usuarios WHERE id_usuario = ?',
    [id]
  );
  return result.affectedRows > 0;
};

// Helper para crear una tarea
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
    estado,
   
  } = data;

  const [result] = await pool.query(
    `INSERT INTO tareas (titulo, descripcion, area, asignedTo, createdBy, fecha_asignacion, hora_asignacion, fecha_vencimiento, hora_vencimiento, estado, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,  NOW())`,
    [titulo, descripcion, area, asignedTo, createdBy, fechaAsignacion, horaAsignacion, fechaVencimiento, horaVencimiento, estado,]
  );
  return result.insertId;
};

// Helper para obtener tareas
const findTareas = async (where = {}) => {
let query = 'SELECT t.*, u1.name as colaborador_name, u1.email as colaborador_email, u1.numeroDocumento, u2.name as creador_name, u2.email as creador_email FROM tareas t LEFT JOIN usuarios u1 ON t.asignedTo = u1.id_usuario LEFT JOIN usuarios u2 ON t.createdBy = u2.id_usuario WHERE 1=1';
;
  const params = [];

  if (where.id_tarea) {
    query += ' AND t.id_tarea = ?';
    params.push(where.id_tarea);
  }
  if (where.createdBy) {
    query += ' AND t.createdBy = ?';
    params.push(where.createdBy);
  }
  if (where.asignedTo) {
    query += ' AND t.asignedTo = ?';
    params.push(where.asignedTo);
  }
  if (where.estado) {
    query += ' AND t.estado = ?';
    params.push(where.estado);
  }

  query += ' ORDER BY t.createdAt DESC';

  const [rows] = await pool.query(query, params);
  return rows;
};

// Helper para obtener una tarea por ID
const findTareaById = async (id) => {
  const [rows] = await pool.query(
    `SELECT t.*, u1.name as colaborador_name, u1.email as colaborador_email, u1.numeroDocumento, u2.name as creador_name, u2.email as creador_email 
     FROM tareas t 
     LEFT JOIN usuarios u1 ON t.asignedTo = u1.id_usuario 
     LEFT JOIN usuarios u2 ON t.createdBy = u2.id_usuario 
     WHERE t.id_tarea = ?`,
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
};

// Helper para actualizar una tarea
const updateTarea = async (id, data) => {
  const fields = [];
  const values = [];

  if (data.titulo !== undefined) {
    fields.push('titulo = ?');
    values.push(data.titulo);
  }
  if (data.descripcion !== undefined) {
    fields.push('descripcion = ?');
    values.push(data.descripcion);
  }
  if (data.estado !== undefined) {
    fields.push('estado = ?');
    values.push(data.estado);
  }
  if (data.observacion !== undefined) {
    fields.push('observacion = ?');
    values.push(data.observacion);
  }
  if (data.resumen_finalizacion !== undefined) {
    fields.push('resumen_finalizacion = ?');
    values.push(data.resumen_finalizacion);
  }
  if (data.solicitud_reapertura !== undefined) {
    fields.push('solicitud_reapertura = ?');
    values.push(data.solicitud_reapertura ? JSON.stringify(data.solicitud_reapertura) : null);
  }
 
  if (fields.length === 0) return false;

  values.push(id);

  const query = `UPDATE tareas SET ${fields.join(', ')} WHERE id_tarea = ?`;
  const [result] = await pool.query(query, values);
  return result.affectedRows > 0;
};

// Helper para obtener tareas recibidas por un usuario
const findTareasRecibidas = async (userId, estado = null) => {
  let query = `SELECT t.*, u.name as creador_name, u.email as creador_email 
               FROM tareas t 
               JOIN usuarios u ON t.createdBy = u.id_usuario 
               WHERE t.asignedTo = ?`;
  const params = [userId];

  if (estado) {
    query += ' AND t.estado = ?';
    params.push(estado);
  }

  query += ' ORDER BY t.createdAt DESC';

  const [rows] = await pool.query(query, params);
  return rows;
};

// Helper para obtener tareas asignadas por un usuario
const findTareasAsignadas = async (userId) => {
  const [rows] = await pool.query(
    `SELECT t.*, u.name as colaborador_name, u.email as colaborador_email, u.numeroDocumento 
     FROM tareas t 
     JOIN usuarios u ON t.asignedTo = u.id_usuario 
     WHERE t.createdBy = ? 
     ORDER BY t.estado ASC, t.fecha_vencimiento ASC`,
    [userId]
  );
  return rows;
};

// Helper para obtener estadísticas de tareas
const getTaskStats = async (userId) => {
  const [stats] = await pool.query(
    `SELECT 
       COUNT(CASE WHEN estado = 'asignada' THEN 1 END) as asignadas,
       COUNT(CASE WHEN estado = 'en-proceso' THEN 1 END) as en_proceso,
       COUNT(CASE WHEN estado = 'finalizada' THEN 1 END) as finalizadas,
       COUNT(CASE WHEN estado = 'atrasada' THEN 1 END) as atrasadas
     FROM tareas 
     WHERE asignedTo = ?`,
    [userId]
  );
  return stats[0] || {};
};

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
  findTareaById,
  updateTarea,
  findTareasRecibidas,
  findTareasAsignadas,
  getTaskStats
};
