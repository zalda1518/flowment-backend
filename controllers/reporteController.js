const ExcelJS = require('exceljs');
const { Tarea } = require('../models/tareas');
const Usuario = require('../models/usuarios');
const { Op } = require('sequelize');

const exportarReporte = async (req, res) => {
  try {
    const { filtros, tareas: tareasIds } = req.body;

    // Construir query con filtros
    const whereClause = {};

    if (tareasIds && tareasIds.length > 0) {
      whereClause.id_tarea = { [Op.in]: tareasIds };
    }

    // Obtener tareas con relaciones
    const tareas = await Tarea.findAll({
      where: whereClause,
      include: [
        {
          model: Usuario,
          as: 'colaborador',
          attributes: ['id_usuario', 'name', 'email', 'numeroDocumento', 'rol']
        },
        {
          model: Usuario,
          as: 'creador',
          attributes: ['id_usuario', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Tareas');

    // Configurar columnas
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Título', key: 'titulo', width: 30 },
      { header: 'Descripción', key: 'descripcion', width: 40 },
      { header: 'Área', key: 'area', width: 20 },
      { header: 'Colaborador', key: 'colaborador', width: 25 },
      { header: 'Número Documento', key: 'numeroDocumento', width: 18 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Fecha Asignación', key: 'fechaAsignacion', width: 18 },
      { header: 'Hora Asignación', key: 'horaAsignacion', width: 15 },
      { header: 'Fecha Vencimiento', key: 'fechaVencimiento', width: 18 },
      { header: 'Hora Vencimiento', key: 'horaVencimiento', width: 15 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Prioridad', key: 'prioridad', width: 12 },
      { header: 'Creado Por', key: 'creador', width: 25 },
      { header: 'Fecha Creación', key: 'createdAt', width: 18 }
    ];

    // Estilo del encabezado
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Agregar datos
    tareas.forEach(tarea => {
      const row = worksheet.addRow({
        id: tarea.id_tarea,
        titulo: tarea.titulo,
        descripcion: tarea.descripcion || '',
        area: tarea.area ? tarea.area.charAt(0).toUpperCase() + tarea.area.slice(1) : '',
        colaborador: tarea.colaborador?.name || 'No asignado',
        numeroDocumento: tarea.colaborador?.numeroDocumento || '',
        email: tarea.colaborador?.email || '',
        fechaAsignacion: tarea.fechaAsignacion || '',
        horaAsignacion: tarea.horaAsignacion || '',
        fechaVencimiento: tarea.fechaVencimiento || '',
        horaVencimiento: tarea.horaVencimiento || '',
        estado: tarea.estado,
        prioridad: tarea.prioridad,
        creador: tarea.creador?.name || '',
        createdAt: tarea.createdAt ? new Date(tarea.createdAt).toLocaleDateString('es-ES') : ''
      });

      // Color según estado
      const coloresEstado = {
        asignada: 'FF3B82F6',
        'en-proceso': 'FFF59E0B',
        atrasada: 'FFEF4444',
        finalizada: 'FF10B981'
      };

      if (coloresEstado[tarea.estado]) {
        row.getCell('estado').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: coloresEstado[tarea.estado] }
        };
        row.getCell('estado').font = { color: { argb: 'FFFFFFFF' }, bold: true };
      }
    });

    // Agregar bordes a todas las celdas
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
    });

    // Agregar resumen al final
    worksheet.addRow([]);
    const resumenRow = worksheet.addRow(['RESUMEN']);
    resumenRow.font = { bold: true, size: 14 };
    resumenRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3F4F6' }
    };

    worksheet.addRow(['Total de Tareas:', tareas.length]);
    worksheet.addRow(['Asignadas:', tareas.filter(t => t.estado === 'asignada').length]);
    worksheet.addRow(['En Proceso:', tareas.filter(t => t.estado === 'en-proceso').length]);
    worksheet.addRow(['Atrasadas:', tareas.filter(t => t.estado === 'atrasada').length]);
    worksheet.addRow(['Finalizadas:', tareas.filter(t => t.estado === 'finalizada').length]);

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Enviar archivo
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=reporte_tareas_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    res.send(buffer);
  } catch (error) {
    console.error('Error al exportar reporte:', error);
    res.status(500).json({
      message: 'Error al generar el reporte',
      error: error.message
    });
  }
};

module.exports = {
  exportarReporte
};