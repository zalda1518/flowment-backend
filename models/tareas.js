import { DataTypes } from 'sequelize';
import { sequelize } from '../config/bd.js';
import Usuario from './usuarios.js';

export const Tarea = sequelize.define(
  'Tarea',
  {
    id_tarea: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id_tarea',
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    area: {
      type: DataTypes.ENUM('administrativa', 'contabilidad', 'operativo', 'recursos humanos', 'gestion humana', 'tecnologia'),
      allowNull: false,
    },
    colaboradorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'asignedTo',
      references: {
        model: 'usuarios',
        key: 'id_usuario',
      },
    },
    creadorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'createdBy',
      references: {
        model: 'usuarios',
        key: 'id_usuario',
      },
    },
    fechaAsignacion: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'fecha_asignacion',
    },
    horaAsignacion: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'hora_asignacion',
    },
    fechaVencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'fecha_vencimiento',
    },
    horaVencimiento: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'hora_vencimiento',
    },
    estado: {
      type: DataTypes.ENUM('asignada', 'en-proceso', 'atrasada', 'finalizada'),
      defaultValue: 'asignada',
    },
    observacion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resumenFinalizacion: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'resumen_finalizacion',
    },
    solicitudReapertura: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'solicitud_reapertura',
    },
  },
  {
    timestamps: true,
    tableName: 'tareas',
    createdAt: 'createdAt',
    updatedAt: false,
  }
);

// Definir relaciones
Tarea.belongsTo(Usuario, {
  foreignKey: 'colaboradorId',
  as: 'colaborador',
});

Tarea.belongsTo(Usuario, {
  foreignKey: 'creadorId',
  as: 'creador',
});

