require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { connectDB } = require('./config/bd');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const reporteRoutes = require('./routes/reporteRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/tareas', taskRoutes);
app.use('/api/reportes', reporteRoutes);

const PORT = process.env.PORT || 3001;

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
