const express = require("express");
const app = express();
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session)
const fs = require("fs");
const mysql = require("mysql2");

const bodyParser = require("body-parser");
const cors = require("cors");
const config = require("./config");

const internal = require("stream");
const authRoutes = require('./routes/auth')
const authRoute = require('./routes/contact')
const authRout = require('./routes/product')
const authBusiness = require('./routes/businessauth')
const cart = require('./routes/carts')
const Order = require('./routes/order')
const checkout = require('./routes/checkout')
const checkout2 = require('./routes/checkout2')
const transaction = require('./routes/transactions')

app.use(cors());
app.use(express.json())
app.use(bodyParser.urlencoded({extended:true}))



const sessionStore = new MySQLStore({
  host:config.MYSQL_HOST,
  collection:config.MYSQL_STORE_COLLECTION,
  user:config.MYSQL_USERNAME,
  port:config.MYSQL_PORT,
  password:config.MYSQL_ROOT_PASSWORD,
  database:config.MYSQL_DATABASE,
});

app.use(session({
  secret:config.MYSQL_STORE_SECRET_KEY,
  resave:false,
  store:sessionStore,
  saveUninitialized:false,
}))

// Connect to MySQL


app.use('/auth', authRoutes)
app.use('/contact', authRoute)
app.use('/product', authRout)
app.use('/authB', authBusiness)
app.use('/cart',cart)
app.use('/order',Order)
app.use('/checkout',checkout)
app.use('/checkout2',checkout2)
app.use('/transactions',transaction)

app.get('/', (req,res,next)=>{

  req.session.isAuth = true;
  console.log(req.session);
  console.log(req.session.id);
  next();
})



app.listen(config.PORT, () => {
  console.log(`This app is listening on port ${config.PORT}`);
});


