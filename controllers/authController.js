const { pool } = require('../config/bd');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');
const {
  findUsuarioByEmail,
  findUsuarioById,
  createUsuario,
  findAllUsuarios,
  findColaboradores,
  updateUsuario: updateUsuarioDB,
  deleteUsuario: deleteUsuarioDB,
} = require('../helpers/queryHelper');

// Generar token JWT
const generateToken = (id_usuario, rol) => {
  return jwt.sign({ id_usuario, rol }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// Registro
const register = async (req, res) => { 
  try {
    const { name, email, password, role, tipoDocumento, numeroDocumento, organizacion, area } = req.body;

    // Mapear tipo de documento del frontend a la base de datos
    const mapeoTipoDocumento = {
      'cedula': 'CC',
      'tarjeta': 'TI',
      'cedula extranjeria': 'CE',
      'pasaporte': 'PASAPORTE',
      'ppt': 'PPT',
      'nit': 'NIT',
      'otro': 'OTRO',
      'CC': 'CC',
      'TI': 'TI',
      'CE': 'CE',
      'PASAPORTE': 'PASAPORTE',
      'PPT': 'PPT',
      'NIT': 'NIT',
      'OTRO': 'OTRO'
    };

    const tipoDocumentoFinal = tipoDocumento ? mapeoTipoDocumento[tipoDocumento.toLowerCase()] || tipoDocumento : null;

    console.log('Tipo documento recibido:', tipoDocumento, '-> Mapeado a:', tipoDocumentoFinal);

    // Validaciones
    if (!name || !email || !password || !organizacion) {
      return res.status(400).json({ message: 'Nombre, email, contraseña y organización son requeridos' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
    }

    // Verificar si el email ya existe
    const usuarioExistente = await findUsuarioByEmail(email);
    if (usuarioExistente) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    // Validar rol
    const rolesPermitidos = ['administrador', 'TeamLeader', 'colaborador'];
    const rolFinal = rolesPermitidos.includes(role) ? role : 'colaborador';

    // Validar área
    const areasPermitidas = ['administrativa', 'contabilidad', 'operativo', 'recursos humanos', 'gestion humana', 'tecnologia'];
    const areaFinal = areasPermitidas.includes(area) ? area : 'administrativa';

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const usuarioId = await createUsuario({
      name,
      email,
      password: hashedPassword,
      rol: rolFinal,
      tipoDocumento: tipoDocumentoFinal,
      numeroDocumento: numeroDocumento || null,
      organizacion,
      area: areaFinal,
      estado: 'activo',
    });

    const usuario = await findUsuarioById(usuarioId);

    // Generar token
    const token = generateToken(usuario.id_usuario, usuario.rol);

    const { password: _, ...payload } = usuario;

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      usuario: payload,
    });

  } catch (error) {
    console.error('Error en register:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    const usuario = await findUsuarioByEmail(email);

    if (!usuario) {
      return res.status(401).json({ message: 'Email o contraseña incorrectos' });
    }

    const esPasswordValida = await bcrypt.compare(password, usuario.password);

    if (!esPasswordValida) {
      return res.status(401).json({ message: 'Email o contraseña incorrectos' });
    }

    if (usuario.estado !== 'activo') {
      return res.status(403).json({ message: 'Usuario inactivo' });
    }

    const token = generateToken(usuario.id_usuario, usuario.rol);

    const { password: _, ...payload } = usuario;

    res.json({
      message: 'Login exitoso',
      token,
      usuario: payload,
    });
    
  } catch (error) {
    console.error('Error en login:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener perfil
const getProfile = async (req, res) => {
  try {
    const usuario = await findUsuarioById(req.userId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    const { password: _, ...payload } = usuario;
    res.json(payload);
  } catch (error) {
    console.error('Error en getProfile:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener colaboradores por organización
const getColaboradores = async (req, res) => {
  try {
    const { organizacion } = req.query;

    if (!organizacion) {
      return res.status(400).json({ message: 'La organización es requerida' });
    }

    const colaboradores = await findColaboradores(organizacion);

    res.status(200).json(colaboradores);
  } catch (error) {
    console.error('Error en getColaboradores:', error.message);
    res.status(500).json({ message: 'Error al obtener colaboradores', error: error.message });
  }
};

// Obtener todos los usuarios
const getAllUsuarios = async (req, res) => {
  try {
    const usuarios = await findAllUsuarios({}, ['password']);

    res.status(200).json(usuarios);
  } catch (error) {
    console.error('Error en getAllUsuarios:', error.message);
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
};

// Obtener un usuario por ID
const getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await findUsuarioById(id);

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const { password: _, ...usuarioSinPassword } = usuario;

    res.status(200).json(usuarioSinPassword);
  } catch (error) {
    console.error('Error en getUsuarioById:', error.message);
    res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
  }
};

// Actualizar usuario
const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, tipoDocumento, numeroDocumento, rol, organizacion, estado } = req.body;

    const usuario = await findUsuarioById(id);

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Validar que el email no exista en otro usuario
    if (email && email !== usuario.email) {
      const usuarioExistente = await findUsuarioByEmail(email);
      if (usuarioExistente) {
        return res.status(400).json({ message: 'El email ya está en uso' });
      }
    }

    // Mapear tipo de documento
    const mapeoTipoDocumento = {
      'cedula': 'CC',
      'tarjeta': 'TI',
      'cedula extranjeria': 'CE',
      'pasaporte': 'PASAPORTE',
      'CC': 'CC',
      'TI': 'TI',
      'CE': 'CE',
      'PASAPORTE': 'PASAPORTE'
    };

    const tipoDocumentoFinal = tipoDocumento ? mapeoTipoDocumento[tipoDocumento.toLowerCase()] || tipoDocumento : undefined;

    // Actualizar usuario en la BD
    const dataToUpdate = {};
    if (name) dataToUpdate.name = name;
    if (email) dataToUpdate.email = email;
    if (tipoDocumentoFinal !== undefined) dataToUpdate.tipoDocumento = tipoDocumentoFinal;
    if (numeroDocumento !== undefined) dataToUpdate.numeroDocumento = numeroDocumento;
    if (rol) dataToUpdate.rol = rol;
    if (organizacion) dataToUpdate.organizacion = organizacion;
    if (estado) dataToUpdate.estado = estado;

    await updateUsuarioDB(id, dataToUpdate);

    const usuarioActualizado = await findUsuarioById(id);
    const { password: _, ...payload } = usuarioActualizado;

    res.status(200).json({
      message: 'Usuario actualizado exitosamente',
      usuario: payload,
    });
  } catch (error) {
    console.error('Error en updateUsuario:', error.message);
    res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
  }
};

// Eliminar usuario
const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await findUsuarioById(id);

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await deleteUsuarioDB(id);

    res.status(200).json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error en deleteUsuario:', error.message);
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
};

// Exportar usuarios a Excel
const exportarUsuarios = async (req, res) => {
  try {
    const { usuarios: usuariosIds } = req.body;

    let usuarios;
    if (usuariosIds && usuariosIds.length > 0) {
      usuarios = await findAllUsuarios({}, ['password']);
      usuarios = usuarios.filter(u => usuariosIds.includes(u.id_usuario));
    } else {
      usuarios = await findAllUsuarios({}, ['password']);
    }

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Usuarios');

    // Configurar columnas
    worksheet.columns = [
      { header: 'ID', key: 'id_usuario', width: 10 },
      { header: 'Nombre', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Tipo Documento', key: 'tipoDocumento', width: 18 },
      { header: 'Número Documento', key: 'numeroDocumento', width: 18 },
      { header: 'Rol', key: 'rol', width: 15 },
      { header: 'Organización', key: 'organizacion', width: 25 },
      { header: 'Estado', key: 'estado', width: 12 },
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
    usuarios.forEach(usuario => {
      const row = worksheet.addRow({
        id_usuario: usuario.id_usuario,
        name: usuario.name,
        email: usuario.email,
        tipoDocumento: usuario.tipoDocumento || '',
        numeroDocumento: usuario.numeroDocumento || '',
        rol: usuario.rol,
        organizacion: usuario.organizacion,
        estado: usuario.estado,
        createdAt: usuario.createdAt ? new Date(usuario.createdAt).toLocaleDateString('es-ES') : ''
      });

      // Color según estado
      const coloresEstado = {
        activo: 'FF10B981',
        inactivo: 'FFEF4444'
      };

      if (coloresEstado[usuario.estado]) {
        row.getCell('estado').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: coloresEstado[usuario.estado] }
        };
        row.getCell('estado').font = { color: { argb: 'FFFFFFFF' }, bold: true };
      }

      // Color según rol
      const coloresRol = {
        administrador: 'FF7C3AED',
        TeamLeader: 'FF06B6D4',
        colaborador: 'FF6366F1'
      };

      if (coloresRol[usuario.rol]) {
        row.getCell('rol').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: coloresRol[usuario.rol] }
        };
        row.getCell('rol').font = { color: { argb: 'FFFFFFFF' }, bold: true };
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

    worksheet.addRow(['Total de Usuarios:', usuarios.length]);
    worksheet.addRow(['Activos:', usuarios.filter(u => u.estado === 'activo').length]);
    worksheet.addRow(['Inactivos:', usuarios.filter(u => u.estado === 'inactivo').length]);
    worksheet.addRow(['Administradores:', usuarios.filter(u => u.rol === 'administrador').length]);
    worksheet.addRow(['Team Leaders:', usuarios.filter(u => u.rol === 'TeamLeader').length]);
    worksheet.addRow(['Colaboradores:', usuarios.filter(u => u.rol === 'colaborador').length]);

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Enviar archivo
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=usuarios_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    res.send(buffer);
  } catch (error) {
    console.error('Error al exportar usuarios:', error);
    res.status(500).json({
      message: 'Error al generar el reporte de usuarios',
      error: error.message
    });
  }
};

// Exportar colaboradores a Excel
const exportarColaboradores = async (req, res) => {
  try {
    const { colaboradores } = req.body;

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Información de Colaboradores');

    // Configurar columnas
    worksheet.columns = [
      { header: 'ID Usuario', key: 'idUsuario', width: 12 },
      { header: 'Nombres Completos', key: 'nombresCompletos', width: 30 },
      { header: 'Correo Electrónico', key: 'correoElectronico', width: 35 },
      { header: 'Organización', key: 'organizacion', width: 25 },
      { header: 'Estado', key: 'estado', width: 12 }
    ];

    // Estilo del encabezado
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 25;

    // Agregar datos
    colaboradores.forEach((colaborador, index) => {
      const row = worksheet.addRow({
        idUsuario: colaborador['ID Usuario'],
        nombresCompletos: colaborador['Nombres Completos'],
        correoElectronico: colaborador['Correo Electrónico'],
        organizacion: colaborador['Organización'],
        estado: colaborador['Estado']
      });

      // Alternar colores de fondo para mejor legibilidad
      if (index % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' }
          };
        });
      }

      // Color según estado
      const coloresEstado = {
        activo: 'FF10B981',
        inactivo: 'FFEF4444'
      };

      if (coloresEstado[colaborador['Estado']]) {
        row.getCell('estado').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: coloresEstado[colaborador['Estado']] }
        };
        row.getCell('estado').font = { color: { argb: 'FFFFFFFF' }, bold: true };
        row.getCell('estado').alignment = { vertical: 'middle', horizontal: 'center' };
      }

      // Estilo para ID de usuario
      row.getCell('idUsuario').font = { bold: true, color: { argb: 'FF3B82F6' } };
      row.getCell('idUsuario').alignment = { vertical: 'middle', horizontal: 'center' };
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
    worksheet.addRow([]);
    const resumenRow = worksheet.addRow(['RESUMEN DE INFORMACIÓN']);
    resumenRow.font = { bold: true, size: 14, color: { argb: 'FF0F172A' } };
    resumenRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E7FF' }
    };

    worksheet.addRow(['Total de Colaboradores:', colaboradores.length]);
    worksheet.addRow(['Fecha de Generación:', new Date().toLocaleString('es-ES')]);

    // Obtener organizaciones únicas
    const organizaciones = [...new Set(colaboradores.map(c => c['Organización']))];
    worksheet.addRow(['Organizaciones:', organizaciones.join(', ')]);

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Enviar archivo
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=informacion-colaboradores-${new Date().toISOString().split('T')[0]}.xlsx`
    );

    res.send(buffer);
  } catch (error) {
    console.error('Error al exportar colaboradores:', error);
    res.status(500).json({
      message: 'Error al generar el reporte de colaboradores',
      error: error.message
    });
  }
};

module.exports = { login, register, getProfile, getColaboradores, getAllUsuarios, getUsuarioById, updateUsuario, deleteUsuario, exportarUsuarios, exportarColaboradores };

