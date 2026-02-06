require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { connectDB } = require('./config/bd');
const authRoutes = require('./routes/authRoutes'); 
const taskRoutes = require('./routes/taskRoutes');
const reporteRoutes = require('./routes/reporteRoutes');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Conectar a la base de datos
connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/tareas', taskRoutes);
app.use('/api/reportes', reporteRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));