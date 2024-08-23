const MySQLStore = require('express-mysql-session')('session')
const session = require('express-session');
const config = require("../config")


const sessionStore = new MySQLStore({
    host:config.MYSQL_HOST,
    collection:config.MYSQL_STORE_COLLECTION,
    user:config.MYSQL_USERNAME,
    port:config.MYSQL_PORT,
    password:config.MYSQL_ROOT_PASSWORD,
    database:config.MYSQL_DATABASE,
  });




  module.exports = {
    sessionStore : sessionStore,
  }