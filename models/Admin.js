const { DataTypes } = require("sequelize");
const bcrypt = require('bcrypt');

const { pool } = require("../models/user.js");
const SaltRounds = 10;

const Admin = pool.define('Admin', {
   id: {
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true
   },
  email: {
    type: DataTypes.STRING, 
    required: true, 
    unique: true, 
    allowNull: true, 
    validate: {
        isEmail: true,
    }
  },
  password: {
    type: DataTypes.STRING, 
    required: true, 
    allowNull: true,
    set(value) {
        const hashedPassword = bcrypt.hashSync(value, bcrypt.genSaltSync(SaltRounds))
        this.setDataValue("password", hashedPassword); // Use "password" (in double quotes) here
    }
  },
  role: {
    type: DataTypes.STRING, // Removed the extra space
    enum: ['Manager', 'Admin'],
    defaultValue: 'Admin',
  },

  

  status: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});



module.exports = {Admin} ;
