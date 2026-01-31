const { Tarea } = require('../models/tareas');
const Usuario = require('../models/usuarios');

// Crear tarea
const createTask = async (req, res) => {
  try {
    // Validar que el usuario sea TeamLeader
    const usuario = await Usuario.findByPk(req.userId);
    
    if (!usuario || usuario.rol !== 'TeamLeader') {
      return res.status(403).json({ message: 'Solo TeamLeader puede crear tareas' });
    }

    const { titulo, descripcion, area, colaboradorId, fechaVencimiento, horaVencimiento, fechaAsignacion, horaAsignacion } = req.body;

    if (!titulo || !area || !colaboradorId) {
      return res.status(400).json({ message: 'Título, área y colaborador son requeridos' });
    }

    const tarea = await Tarea.create({
      titulo,
      descripcion,
      area,
      colaboradorId,
      creadorId: req.userId,
      fechaVencimiento,
      horaVencimiento,
      fechaAsignacion,
      horaAsignacion,
      estado: 'asignada',
      prioridad: 'media',
    });

    // Obtener tarea con relaciones
    const tareaConRelaciones = await Tarea.findByPk(tarea.id_tarea, {
      include: [
        { 
          model: Usuario, 
          as: 'colaborador', 
          attributes: ['id_usuario', 'name', 'email', 'rol'] 
        },
        { 
          model: Usuario, 
          as: 'creador', 
          attributes: ['id_usuario', 'name', 'email', 'rol'] 
        }
      ]
    });

    res.status(201).json({
      message: 'Tarea creada exitosamente',
      tarea: tareaConRelaciones,
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
    const filtro = {
      creadorId: userId // Solo tareas creadas por el usuario autenticado
    };

    if (estado) filtro.estado = estado;
    if (colaboradorId) filtro.colaboradorId = colaboradorId;

    const tareas = await Tarea.findAll({
      where: filtro,
      include: [
        { 
          model: Usuario, 
          as: 'colaborador', 
          attributes: ['id_usuario', 'name', 'email', 'rol', 'numeroDocumento'] 
        },
        { 
          model: Usuario, 
          as: 'creador', 
          attributes: ['id_usuario', 'name', 'email', 'rol'] 
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Procesar solicitudReapertura de string a objeto
    const tareasProcessadas = tareas.map(t => {
      if (t.solicitudReapertura && typeof t.solicitudReapertura === 'string') {
        try {
          t.solicitudReapertura = JSON.parse(t.solicitudReapertura);
        } catch (e) {
          console.error('Error parseando solicitudReapertura:', e);
          t.solicitudReapertura = null;
        }
      }
      return t;
    });

    res.json(tareasProcessadas);
  } catch (error) {
    console.error('Error en getAllTasks:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener tarea por ID
const getTaskById = async (req, res) => {
  try {
    const tarea = await Tarea.findByPk(req.params.id, {
      include: [
        { 
          model: Usuario, 
          as: 'colaborador', 
          attributes: ['id_usuario', 'name', 'email', 'rol', 'numeroDocumento'] 
        },
        { 
          model: Usuario, 
          as: 'creador', 
          attributes: ['id_usuario', 'name', 'email', 'rol'] 
        }
      ]
    });

    if (!tarea) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    // Procesar solicitudReapertura de string a objeto
    if (tarea.solicitudReapertura && typeof tarea.solicitudReapertura === 'string') {
      try {
        tarea.solicitudReapertura = JSON.parse(tarea.solicitudReapertura);
      } catch (e) {
        console.error('Error parseando solicitudReapertura:', e);
        tarea.solicitudReapertura = null;
      }
    }

    res.json(tarea);
  } catch (error) {
    console.error('Error en getTaskById:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Actualizar tarea
const updateTask = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.userId);
    const tarea = await Tarea.findByPk(req.params.id);

    if (!tarea) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    // Si es TeamLeader, puede actualizar todo
    if (usuario && usuario.rol === 'TeamLeader') {
      await tarea.update(req.body);
    } else {
      // Colaborador solo puede mover estado a en-proceso o finalizada
      const { estado, resumenFinalizacion } = req.body;
      const permitidos = ['en-proceso', 'finalizada'];

      if (tarea.colaboradorId !== req.userId) {
        return res.status(403).json({ message: 'No autorizado para esta tarea' });
      }
      
      // Validar que no intente cambiar desde finalizada
      if (tarea.estado === 'finalizada') {
        return res.status(403).json({ message: 'No se puede cambiar una tarea finalizada' });
      }
      
      if (!permitidos.includes(estado)) {
        return res.status(403).json({ message: 'Cambio de estado no permitido' });
      }

      // Actualiza el estado
      await tarea.update({ estado });

      // Si finaliza, guarda el resumen de finalización
      if (estado === 'finalizada' && resumenFinalizacion) {
        await tarea.update({ resumenFinalizacion });
      }
    }

    // Obtener tarea actualizada con relaciones
    const tareaActualizada = await Tarea.findByPk(tarea.id_tarea, {
      include: [
        { model: Usuario, as: 'colaborador', attributes: ['id_usuario', 'name', 'email', 'rol', 'numeroDocumento'] },
        { model: Usuario, as: 'creador', attributes: ['id_usuario', 'name', 'email', 'rol'] }
      ]
    });

    return res.json({
      message: 'Tarea actualizada exitosamente',
      tarea: tareaActualizada,
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
    const tarea = await Tarea.findByPk(req.params.id);

    if (!tarea) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    // Obtener usuario que agrega la observación
    const usuario = await Usuario.findByPk(req.userId);

    // Guardar observación en JSON
    const obsExist = tarea.observaciones ? JSON.parse(tarea.observaciones) : [];
    obsExist.push({
      texto: observacion,
      fecha: new Date(),
      usuarioId: req.userId,
      usuarioNombre: usuario?.name || 'TeamLeader',
      tipo: 'observacion_atraso'
    });

    await tarea.update({ observaciones: JSON.stringify(obsExist) });

    const tareaActualizada = await Tarea.findByPk(tarea.id_tarea, {
      include: [
        { model: Usuario, as: 'colaborador', attributes: ['id_usuario', 'name', 'email'] },
        { model: Usuario, as: 'creador', attributes: ['id_usuario', 'name', 'email'] }
      ]
    });

    return res.json({
      message: 'Observación agregada exitosamente',
      tarea: tareaActualizada
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
    const tareas = await Tarea.findAll({
      where: { colaboradorId: userId },
      include: [
        { model: Usuario, as: 'colaborador', attributes: ['id_usuario','name','email','numeroDocumento'] },
        { model: Usuario, as: 'creador', attributes: ['id_usuario','name','email'] },
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Procesar solicitudReapertura de string a objeto
    const tareasProcessadas = tareas.map(t => {
      if (t.solicitudReapertura) {
        if (typeof t.solicitudReapertura === 'string') {
          try {
            t.solicitudReapertura = t.solicitudReapertura.trim() ? JSON.parse(t.solicitudReapertura) : null;
          } catch (e) {
            console.error('Error parseando solicitudReapertura:', e);
            t.solicitudReapertura = null;
          }
        }
      } else {
        // Asegurar que sea null en lugar de undefined o string vacío
        t.solicitudReapertura = null;
      }
      return t;
    });
    
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

    const tarea = await Tarea.findByPk(id);
    if (!tarea) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    // Verificar que el usuario sea el colaborador asignado
    if (tarea.colaboradorId !== userId) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    // Verificar que la tarea esté finalizada
    if (tarea.estado !== 'finalizada') {
      return res.status(400).json({ message: 'Solo se pueden reabrir tareas finalizadas' });
    }

    // Guardar la solicitud
    const solicitud = {
      motivo,
      solicitadoPor: userId,
      fechaSolicitud: new Date(),
      estado: 'pendiente'
    };

    tarea.solicitudReapertura = solicitud;
    await tarea.save();

    const tareaActualizada = await Tarea.findByPk(id, {
      include: [
        { model: Usuario, as: 'colaborador', attributes: ['id_usuario','name','email','numeroDocumento'] },
        { model: Usuario, as: 'creador', attributes: ['id_usuario','name','email'] },
      ]
    });

    return res.json({ message: 'Solicitud enviada exitosamente', tarea: tareaActualizada });
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

    const tarea = await Tarea.findByPk(id);
    if (!tarea) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    // Verificar que el usuario sea el creador (TeamLeader)
    if (tarea.creadorId !== userId) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    // Verificar que haya solicitud pendiente
    let solicitudActual = tarea.solicitudReapertura;
    if (typeof solicitudActual === 'string') {
      solicitudActual = JSON.parse(solicitudActual);
    }
    
    if (!solicitudActual || solicitudActual.estado !== 'pendiente') {
      return res.status(400).json({ message: 'No hay solicitud pendiente' });
    }

    if (aprobada) {
      // Aprobar: cambiar estado a asignada y actualizar fechas
      tarea.estado = 'asignada';
      if (nuevaFechaVencimiento) tarea.fechaVencimiento = nuevaFechaVencimiento;
      if (nuevaHoraVencimiento) tarea.horaVencimiento = nuevaHoraVencimiento;
      
      tarea.solicitudReapertura = {
        ...solicitudActual,
        estado: 'aprobada',
        fechaRespuesta: new Date(),
        respondidoPor: userId
      };
    } else {
      // Rechazar: mantener finalizada
      tarea.solicitudReapertura = {
        ...solicitudActual,
        estado: 'rechazada',
        razon,
        fechaRespuesta: new Date(),
        respondidoPor: userId
      };
    }

    await tarea.save();

    const tareaActualizada = await Tarea.findByPk(id, {
      include: [
        { model: Usuario, as: 'colaborador', attributes: ['id_usuario','name','email','numeroDocumento'] },
        { model: Usuario, as: 'creador', attributes: ['id_usuario','name','email'] },
      ]
    });

    return res.json({ 
      message: aprobada ? 'Solicitud aprobada' : 'Solicitud rechazada', 
      tarea: tareaActualizada 
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error al responder solicitud', error: err.message });
  }
};

// Obtener solicitudes de reapertura pendientes
const getSolicitudesReaperturaPendientes = async (req, res) => {
  try {
    const userId = req.userId;
    
    const tareas = await Tarea.findAll({
      where: {
        creadorId: userId,
        estado: 'finalizada'
      },
      include: [
        { model: Usuario, as: 'colaborador', attributes: ['id_usuario','name','email','numeroDocumento'] },
        { model: Usuario, as: 'creador', attributes: ['id_usuario','name','email'] },
      ],
      raw: false,
      order: [['createdAt', 'DESC']]
    });

    // Filtrar solo las que tienen solicitud pendiente Y parsear JSON
    const conSolicitud = tareas.filter(t => {
      let solicitud = t.solicitudReapertura;
      
      // Parsear si es string
      if (typeof solicitud === 'string') {
        try {
          solicitud = JSON.parse(solicitud);
          t.solicitudReapertura = solicitud; // Actualizar el objeto con JSON parseado
        } catch (e) {
          return false;
        }
      }
      
      return solicitud && 
             typeof solicitud === 'object' && 
             solicitud.estado === 'pendiente';
    });

    return res.json(conSolicitud);
  } catch (err) {
    console.error('ERROR en getSolicitudesReaperturaPendientes:', err.message);
    return res.status(500).json({ message: 'Error al obtener solicitudes', error: err.message });
  }
};

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
