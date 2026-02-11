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

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/tareas', taskRoutes);
app.use('/api/reportes', reporteRoutes);

const PORT = process.env.PORT ?? 3001;

const startServer = async () => {
  try {
    await connectDB();
    console.log('✓ Conexión a la base de datos establecida');

    app.listen(PORT, () => {
      console.log(`✓ Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
};

startServer();
