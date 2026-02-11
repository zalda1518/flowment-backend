import express from 'express';
import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  agregarObservacion,
  getReceivedTasks,
  solicitarReapertura,
  responderReapertura,
  getSolicitudesReaperturaPendientes,
} from '../controllers/taskController.js';
import { authMiddleware } from '../middleware/auth.js';

// Todas las rutas requieren autenticación
const router = express.Router();
router.use(authMiddleware);

// RUTAS GET ESPECÍFICAS (deben ir primero)
// endpoint para obtener tareas recibidas por el usuario autenticado
router.get('/recibidas', getReceivedTasks);

// endpoint para obtener solicitudes de reapertura pendientes
router.get('/reaperturas/pendientes', getSolicitudesReaperturaPendientes);

// RUTAS POST
// endpoint para crear una tarea
router.post('/', createTask);

// endpoint para agregar una observación a una tarea
router.post('/:id/observacion', agregarObservacion);

// endpoint para solicitar reapertura de tarea
router.post('/:id/solicitar-reapertura', solicitarReapertura);

// endpoint para responder solicitud de reapertura
router.post('/:id/responder-reapertura', responderReapertura);

// RUTAS PUT
// endpoint para actualizar una tarea
router.put('/:id', updateTask);

// RUTAS GET GENÉRICAS (deben ir al final)
// endpoints para obtener todas las tareas
router.get('/', getAllTasks);

// endpoint para obtener una tarea por ID
router.get('/:id', getTaskById);

export default router;
