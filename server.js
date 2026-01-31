require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { sequelize, connectDB } = require('./config/bd');
// Importar modelos para que Sequelize los conozca
const Usuario = require('./models/usuarios');
const { Tarea } = require('./models/tareas');
const authRoutes = require('./routes/authRoutes'); 
const taskRoutes = require('./routes/taskRoutes');
const reporteRoutes = require('./routes/reporteRoutes');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// prueba conexión
connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/tareas', taskRoutes);
app.use('/api/reportes', reporteRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));