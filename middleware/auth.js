import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id_usuario;
    req.userRole = decoded.rol;

    next();
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado' });
    }
    return res.status(401).json({ message: 'Token inválido' });
  }
};

export const adminMiddleware = (req, res, next) => {
  if (req.userRole !== 'administrador') {
    return res.status(403).json({ message: 'No tienes permisos para acceder a este recurso' });
  }
  next();
};

