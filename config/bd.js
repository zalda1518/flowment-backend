
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,

  {
    host: 'centerbeam.proxy.rlwy.net',
    port:process.env.DB_PORT,
    dialect: 'mysql',
    port: 3306,
    logging: false,
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(' MySQL conectada correctamente');
    
    // Sincronizar modelos
    await sequelize.sync({ alter: true });
    console.log('Modelos sincronizados correctamente');
  } catch (error) {
    console.error('Error conectando a MySQL:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};


module.exports = {
  sequelize,
  connectDB
};
