require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { connectDB, sequelize } = require('./config/bd');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

// Importar modelos para sincronizar
const Usuario = require('./models/usuarios');
const { Tarea } = require('./models/tareas');

const app = express();

app.use(cors());
app.use(express.json());

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/tareas', taskRoutes);

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await connectDB();
    // Sincronizar modelos con la base de datos (alter: true actualiza las tablas existentes)
    await sequelize.sync({ alter: true });
    console.log('✓ Modelos sincronizados con la base de datos');
    
    app.listen(PORT, () => {
      console.log(`✓ Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
};

startServer();

