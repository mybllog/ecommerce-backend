const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config');
const bcrypt = require('bcrypt');
const saltRound = 10;

const pool = new Sequelize(config.MYSQL_DATABASE, config.MYSQL_USERNAME, config.MYSQL_ROOT_PASSWORD, {
  host: config.MYSQL_HOST,
  dialect: 'mysql',

  pool: {
    max: 3,
    min: 0,
    acquire: 4000,
    idle: 3000,
  },
});

// authentication
try {
  pool.authenticate();
  console.log('Connection has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}

const Company = pool.define('company', {
    id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  company_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  registration_number: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  company_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  company_address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contact_person: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    set(value) {
      const hashedPassword = bcrypt.hashSync(value, bcrypt.genSaltSync(saltRound));
      this.setDataValue('password', hashedPassword);
    },
  },
  status: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

const User = pool.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

Company.hasMany(User, { foreignKey: 'company_id' });
User.belongsTo(Company, { foreignKey: 'company_id' });

module.exports = { Company, User , pool };
