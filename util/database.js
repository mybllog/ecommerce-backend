const { createPool } = require('mysql2');
const config = require('../config');

const pool = createPool({
  user: config.MYSQL_USERNAME,
  host: config.MYSQL_HOST,
  password: config.MYSQL_ROOT_PASSWORD,
  database: config.MYSQL_DATABASE,
  waitForConnections: true, 
  connectionLimit: 10,
  connectTimeout: 30,
  queueLimit: 0,
  authPlugins: {
    mysql_native_password: false
  }
});

// Connect to MySQL
pool.getConnection((err,connection) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL');
    connection.release()
  }
});

module.exports = {
  pool: pool.promise()
};
