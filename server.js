import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { connectDB } from './config/bd.js';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import reporteRoutes from './routes/reporteRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

// Conectar a la base de datos (opcional: await si quieres asegurarte antes de listen)
connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/tareas', taskRoutes);
app.use('/api/reportes', reporteRoutes);

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));