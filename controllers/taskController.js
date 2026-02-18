const {
  findUsuarioById,
  createTarea,
  findTareas,
  findTareaById,
  updateTarea,
  findTareasRecibidas,
} = require('../helpers/queryHelper');
const { pool } = require('../config/bd');

// Crear tarea
const createTask = async (req, res) => {
  try {
    const usuario = await findUsuarioById(req.userId);
    
    if (!usuario || usuario.rol !== 'TeamLeader') {
      return res.status(403).json({ message: 'Solo TeamLeader puede crear tareas' });
    }

    const { titulo, descripcion, area, colaboradorId, fechaVencimiento, horaVencimiento, fechaAsignacion, horaAsignacion } = req.body;

    if (!titulo || !area || !colaboradorId) {
      return res.status(400).json({ message: 'Título, área y colaborador son requeridos' });
    }

    const tareaId = await createTarea({
      titulo,
      descripcion,
      area,
      asignedTo: colaboradorId,
      createdBy: req.userId,
      fechaVencimiento: fechaVencimiento,
      horaVencimiento: horaVencimiento,
      fechaAsignacion: fechaAsignacion,
      horaAsignacion: horaAsignacion,
      estado: 'asignada',
    });

    const tarea = await findTareaById(tareaId);

    res.status(201).json({
      message: 'Tarea creada exitosamente',
      tarea: {
        id_tarea: tarea.id_tarea,
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        area: tarea.area,
        estado: tarea.estado,
        fechaAsignacion: tarea.fechAsignacion,
        horaAsignacion: tarea.horaAsignacion,
        fechaVencimiento: tarea.fechaVencimiento,
        horaVencimiento: tarea.horaVencimiento,
        colaborador: {
          id_usuario: tarea.asignedTo,
          name: tarea.colaborador_name,
          email: tarea.colaborador_email,
          numeroDocumento: tarea.numeroDocumento,
        },
        creador: {
          id_usuario: tarea.createdBy,
          name: tarea.creador_name,
          email: tarea.creador_email,
        }
      },
    });
  } catch (error) {
    console.error('Error en createTask:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener todas las tareas
const getAllTasks = async (req, res) => {
  try {
    const { estado, colaboradorId } = req.query;
    const userId = req.userId;

    const where = { createdBy: userId };
    if (estado) where.estado = estado;
    if (colaboradorId) where.asignedTo = colaboradorId;

    const tareas = await findTareas(where);

    const tareasProcessadas = tareas.map(t => ({
      id_tarea: t.id_tarea,
      titulo: t.titulo,
      descripcion: t.descripcion,
      area: t.area,
      estado: t.estado,
      fechaAsignacion: t.fechaAsignacion,
      horaAsignacion: t.horaAsignacion,
      fechaVencimiento: t.fechaVencimiento,
      horaVencimiento: t.horaVencimiento,
      resumenFinalizacion: t.resumenFinalizacion,
      observacion: t.observacion,
      createdAt: t.createdAt,
      solicitudReapertura: parseJSON(t.solicitudReapertura),
      colaborador: {
        id_usuario: t.asignedTo,
        name: t.colaborador_name,
        email: t.colaborador_email,
        numeroDocumento: t.numeroDocumento,
      },
      creador: {
        id_usuario: t.createdBy,
        name: t.creador_name,
        email: t.creador_email,
      }
    }));

    res.json(tareasProcessadas);
  } catch (error) {
    console.error('Error en getAllTasks:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener tarea por ID
const getTaskById = async (req, res) => {
  try {
    const tarea = await findTareaById(req.params.id);

    if (!tarea) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    const tareaFormateada = {
      id_tarea: tarea.id_tarea,
      titulo: tarea.titulo,
      descripcion: tarea.descripcion,
      area: tarea.area,
      estado: tarea.estado,
      fechaAsignacion: tarea.fechaAsignacion,
      horaAsignacion: tarea.horaAsignacion,
      fechaVencimiento: tarea.fechaVencimiento,
      horaVencimiento: tarea.horaVencimiento,
      resumenFinalizacion: tarea.resumenFinalizacion,
      observacion: tarea.observacion,
      createdAt: tarea.createdAt,
      solicitudReapertura: parseJSON(tarea.solicitudReapertura),
      colaborador: {
        id_usuario: tarea.asignedTo,
        name: tarea.colaborador_name,
        email: tarea.colaborador_email,
        numeroDocumento: tarea.numeroDocumento,
      },
      creador: {
        id_usuario: tarea.createdBy,
        name: tarea.creador_name,
        email: tarea.creador_email,
      }
    };

    res.json(tareaFormateada);
  } catch (error) {
    console.error('Error en getTaskById:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Actualizar tarea
const updateTask = async (req, res) => {
  try {
    const usuario = await findUsuarioById(req.userId);
    const tarea = await findTareaById(req.params.id);

    if (!tarea) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    if (usuario && usuario.rol === 'TeamLeader') {
      const dataToUpdate = {};
      if (req.body.titulo) dataToUpdate.titulo = req.body.titulo;
      if (req.body.descripcion !== undefined) dataToUpdate.descripcion = req.body.descripcion;
      if (req.body.estado) dataToUpdate.estado = req.body.estado;
    

      await updateTarea(req.params.id, dataToUpdate);
    } else {
      const { estado, resumenFinalizacion } = req.body;
      const permitidos = ['en-proceso', 'finalizada'];

      if (tarea.asignedTo !== req.userId) {
        return res.status(403).json({ message: 'No autorizado para esta tarea' });
      }
      
      if (tarea.estado === 'finalizada') {
        return res.status(403).json({ message: 'No se puede cambiar una tarea finalizada' });
      }
      
      if (!permitidos.includes(estado)) {
        return res.status(403).json({ message: 'Cambio de estado no permitido' });
      }

      const dataToUpdate = { estado };
      if (estado === 'finalizada' && resumenFinalizacion) {
        dataToUpdate.resumen_finalizacion = resumenFinalizacion;
      }

      await updateTarea(req.params.id, dataToUpdate);
    }

    const tareaActualizada = await findTareaById(req.params.id);

    const tareaFormateada = {
      id_tarea: tareaActualizada.id_tarea,
      titulo: tareaActualizada.titulo,
      descripcion: tareaActualizada.descripcion,
      area: tareaActualizada.area,
      estado: tareaActualizada.estado,
      fechaAsignacion: tareaActualizada.fechaAsignacion,
      horaAsignacion: tareaActualizada.horaAsignacion,
      fechaVencimiento: tareaActualizada.fechaVencimiento,
      horaVencimiento: tareaActualizada.horaVencimiento,
      resumenFinalizacion: tareaActualizada.resumenFinalizacion,
      observacion: tareaActualizada.observacion,
      createdAt: tareaActualizada.createdAt,
      solicitudReapertura: parseJSON(tareaActualizada.solicitudReapertura),
      colaborador: {
        id_usuario: tareaActualizada.asignedTo,
        name: tareaActualizada.colaborador_name,
        email: tareaActualizada.colaborador_email,
        numeroDocumento: tareaActualizada.numeroDocumento,
      },
      creador: {
        id_usuario: tareaActualizada.createdBy,
        name: tareaActualizada.creador_name,
        email: tareaActualizada.creador_email,
      }
    };

    return res.json({
      message: 'Tarea actualizada exitosamente',
      tarea: tareaFormateada,
    });
  } catch (error) {
    console.error('Error en updateTask:', error.message);
    return res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};
// Agregar observación por atraso
const agregarObservacion = async (req, res) => {
  try {
    const { observacion } = req.body;
    const tarea = await findTareaById(req.params.id);

    if (!tarea) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    const usuario = await findUsuarioById(req.userId);

    await updateTarea(req.params.id, { observacion });

    const tareaActualizada = await findTareaById(req.params.id);

    const tareaFormateada = {
      id_tarea: tareaActualizada.id_tarea,
      titulo: tareaActualizada.titulo,
      descripcion: tareaActualizada.descripcion,
      area: tareaActualizada.area,
      estado: tareaActualizada.estado,
      observacion: tareaActualizada.observacion,
      colaborador: {
        id_usuario: tareaActualizada.asignedTo,
        name: tareaActualizada.colaborador_name,
        email: tareaActualizada.colaborador_email,
        numeroDocumento: tareaActualizada.numeroDocumento,
      },
      creador: {
        id_usuario: tareaActualizada.createdBy,
        name: tareaActualizada.creador_name,
        email: tareaActualizada.creador_email,
      }
    };

    return res.json({
      message: 'Observación agregada exitosamente',
      tarea: tareaFormateada
    });
  } catch (error) {
    console.error('Error en agregarObservacion:', error);
    return res.status(500).json({ message: 'Error al agregar observación', error: error.message });
  }
};

// Obtener tareas recibidas por un colaborador
const getReceivedTasks = async (req, res) => {
  try {
    const userId = req.userId;
    const tareas = await findTareasRecibidas(userId);
    
    const tareasProcessadas = tareas.map(t => ({
      id_tarea: t.id_tarea,
      titulo: t.titulo,
      descripcion: t.descripcion,
      area: t.area,
      estado: t.estado,
      fechaAsignacion: t.fechaAsignacion,
      horaAsignacion: t.horaAsignacion,
      fechaVencimiento: t.fechaVencimiento,
      horaVencimiento: t.horaVencimiento,
      resumenFinalizacion: t.resumenFinalizacion,
      observacion: t.observacion,
      createdAt: t.createdAt,
      solicitudReapertura: parseJSON(t.solicitudReapertura),
      colaborador: {
        id_usuario: t.asignedTo,
        name: t.colaborador_name,
        email: t.colaborador_email,
        numeroDocumento: t.numeroDocumento,
      },
      creador: {
        id_usuario: t.createdBy,
        name: t.creador_name,
        email: t.creador_email,
      }
    }));
    
    return res.json(tareasProcessadas);
  } catch (err) {
    return res.status(500).json({ message: 'Error al obtener tareas', error: err.message });
  }
};

// Solicitar reapertura de tarea
const solicitarReapertura = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const userId = req.userId;

    const tarea = await findTareaById(id);
    if (!tarea) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    if (tarea.asignedTo !== userId) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    if (tarea.estado !== 'finalizada') {
      return res.status(400).json({ message: 'Solo se pueden reabrir tareas finalizadas' });
    }

    const solicitud = {
      motivo,
      solicitadoPor: userId,
      fechaSolicitud: new Date(),
      estado: 'pendiente'
    };

    await updateTarea(id, { solicitud_reapertura: solicitud });

    const tareaActualizada = await findTareaById(id);

    const tareaFormateada = {
      id_tarea: tareaActualizada.id_tarea,
      titulo: tareaActualizada.titulo,
      estado: tareaActualizada.estado,
      solicitudReapertura: parseJSON(tareaActualizada.solicitudReapertura),
      colaborador: {
        id_usuario: tareaActualizada.asignedTo,
        name: tareaActualizada.colaborador_name,
        email: tareaActualizada.colaborador_email,
        numeroDocumento: tareaActualizada.numeroDocumento,
      },
      creador: {
        id_usuario: tareaActualizada.createdBy,
        name: tareaActualizada.creador_name,
        email: tareaActualizada.creador_email,
      }
    };

    return res.json({ message: 'Solicitud enviada exitosamente', tarea: tareaFormateada });
  } catch (err) {
    console.error('ERROR en solicitarReapertura:', err.message);
    return res.status(500).json({ message: 'Error al solicitar reapertura', error: err.message });
  }
};

// Responder solicitud de reapertura
const responderReapertura = async (req, res) => {
  try {
    const { id } = req.params;
    const { aprobada, razon, nuevaFechaVencimiento, nuevaHoraVencimiento } = req.body;
    const userId = req.userId;

    const tarea = await findTareaById(id);
    if (!tarea) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    if (tarea.createdBy !== userId) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    let solicitudActual = parseJSON(tarea.solicitud_reapertura);
    
    if (!solicitudActual || solicitudActual.estado !== 'pendiente') {
      return res.status(400).json({ message: 'No hay solicitud pendiente' });
    }

    let dataToUpdate = {};

    if (aprobada) {
      dataToUpdate.estado = 'asignada';
      if (nuevaFechaVencimiento) {
        dataToUpdate.fecha_vencimiento = nuevaFechaVencimiento;
      }
      if (nuevaHoraVencimiento) {
        dataToUpdate.hora_vencimiento = nuevaHoraVencimiento;
      }
      
      solicitudActual = {
        ...solicitudActual,
        estado: 'aprobada',
        fechaRespuesta: new Date(),
        respondidoPor: userId
      };
    } else {
      solicitudActual = {
        ...solicitudActual,
        estado: 'rechazada',
        razon,
        fechaRespuesta: new Date(),
        respondidoPor: userId
      };
    }

    dataToUpdate.solicitud_reapertura = solicitudActual;
    await updateTarea(id, dataToUpdate);

    const tareaActualizada = await findTareaById(id);

    const tareaFormateada = {
      id_tarea: tareaActualizada.id_tarea,
      titulo: tareaActualizada.titulo,
      estado: tareaActualizada.estado,
      solicitudReapertura: parseJSON(tareaActualizada.solicitudReapertura),
      colaborador: {
        id_usuario: tareaActualizada.asignedTo,
        name: tareaActualizada.colaborador_name,
        email: tareaActualizada.colaborador_email,
        numeroDocumento: tareaActualizada.numeroDocumento,
      },
      creador: {
        id_usuario: tareaActualizada.createdBy,
        name: tareaActualizada.creador_name,
        email: tareaActualizada.creador_email,
      }
    };

    return res.json({ 
      message: aprobada ? 'Solicitud aprobada' : 'Solicitud rechazada', 
      tarea: tareaFormateada 
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error al responder solicitud', error: err.message });
  }
};

// Obtener solicitudes pendientes
const getSolicitudesReaperturaPendientes = async (req, res) => {
  try {
    const userId = req.userId;
    
    const [tareas] = await pool.query(
      `SELECT t.*, 
              u1.name as colaborador_name, 
              u1.email as colaborador_email, 
              u1.numeroDocumento,
              u2.name as creador_name, 
              u2.email as creador_email 
       FROM tareas t 
       LEFT JOIN usuarios u1 ON t.asignedTo = u1.id_usuario 
       LEFT JOIN usuarios u2 ON t.createdBy = u2.id_usuario 
       WHERE t.createdBy = ? AND t.estado = 'finalizada'
       ORDER BY t.createdAt DESC`,
      [userId]
    );

    const conSolicitud = tareas.filter(t => {
      let solicitud = parseJSON(t.solicitud_reapertura);
      return solicitud && solicitud.estado === 'pendiente';
    }).map(t => ({
      id_tarea: t.id_tarea,
      titulo: t.titulo,
      estado: t.estado,
      solicitudReapertura: parseJSON(t.solicitudReapertura),
      colaborador: {
        id_usuario: t.asignedTo,
        name: t.colaborador_name,
        email: t.colaborador_email,
        numeroDocumento: t.numeroDocumento,
      },
      creador: {
        id_usuario: t.createdBy,
        name: t.creador_name,
        email: t.creador_email,
      }
    }));

    return res.json(conSolicitud);
  } catch (err) {
    console.error('ERROR en getSolicitudesReaperturaPendientes:', err.message);
    return res.status(500).json({ message: 'Error al obtener solicitudes', error: err.message });
  }
};

// Función auxiliar
function parseJSON(str) {
  if (!str) return null;
  if (typeof str !== 'string') return str;
  try {
    const trimmed = str.trim();
    if (!trimmed) return null;
    return JSON.parse(trimmed);
  } catch (e) {
    console.error('Error parseando JSON:', e);
    return null;
  }
}

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  agregarObservacion,
  getReceivedTasks,
  solicitarReapertura,
  responderReapertura,
  getSolicitudesReaperturaPendientes,
};
