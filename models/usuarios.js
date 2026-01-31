const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/bd');
const bcrypt = require('bcrypt');

const Usuario = sequelize.define(
  'Usuario',
  {
    id_usuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id_usuario',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rol: {
      type: DataTypes.ENUM('administrador', 'TeamLeader', 'colaborador'),
      defaultValue: 'colaborador',
    },
    tipoDocumento: {
      type: DataTypes.ENUM('CC', 'TI', 'CE', 'PASAPORTE', 'PPT', 'NIT', 'OTRO'),
      allowNull: true,
      field: 'tipoDocumento',
    },
    numeroDocumento: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'numeroDocumento',
    },
    organizacion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM('activo', 'inactivo'),
      defaultValue: 'activo',
    },
    area: {
      type: DataTypes.ENUM('administrativa', 'contabilidad', 'operativo', 'recursos humanos', 'gestion humana', 'tecnologia'),
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: 'usuarios',
    createdAt: 'createdAt',
    updatedAt: false,
  }
);

// Método para comparar contraseñas
Usuario.prototype.compararPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = Usuario;
