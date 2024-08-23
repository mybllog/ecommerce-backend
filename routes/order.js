const express = require('express');
const Router = express.Router();
const pool = require('../util/database').pool;
const validator = require('validator'); // Import the validator library
const verifyToken = require("../Controllers/auth/verifyToken")


Router.post('/order',verifyToken,  async (req, res) => {
  try {
    const {email,   name, address, phone, country, region, city, zipcode, total_amount  } = req.body;
     
    // Validate user_id and total_amount
    if (!name || !address|| !phone || !country || !region || !city || !zipcode || !total_amount) {
      return res.status(400).json({ message: ' name, address, phone, country, region, city, zipcode, total_amount  are required' });
    }
  
      if (!validator.isLength(name, { min: 1, max: 255 })){
        return  res.status(400).json({
              status: false, 
              message: 'name required'
          });
      }

      if(!validator.isLength(address)){
        return  res. status(400).json({
              status: false, 
              message: 'address required'})
      }

      if(!validator.isNumeric(phone)){
        return  res. status(400).json({
              status: false, 
              message: 'phone must be a number or an integer and must contain at least 10 characters'})
      }
      if(!validator.isLength(country)){
       return   res. status(400).json({
              status: false, 
              message: 'country required'})
      }
      if(!validator.isLength(region)){
       return  res. status(400).json({
              status: false, 
              message: 'region required'})
      }
      if(!validator.isLength(city)){
        return res. status(400).json({
              status: false, 
              message: 'city required'})
      }

     {/* const nigeriaPostalCodePattern = /^[0-9]{6}$/;
      const userPostalCode = '123456'
      if(nigeriaPostalCodePattern.test(userPostalCode)){
        return  res. status(400).json({
              status: false, 
              message: 'put valid code'})
      }
    */}
    //check if the user exists
    const [userResult] = await pool.query('SELECT * FROM user WHERE email=?',[email])

    if(userResult.length===0)
    return res.status(400).json({message: 'User not found'})

    

    //check if the order_item exists
    const [orderitemResult] = await pool.query('SELECT * FROM carts_item WHERE user_id=?',[userResult[0].id])
        
    if(orderitemResult.length===0)
    return res.status(400).json({message: 'orderItem not found'})


    //const [productResult] = await pool.query('SELECT * FROM product WHERE id=?',[product_id])
   // const totalQuanity = orderitemResult[0].quantity
   
    //const productPrice =  orderitemResult[0].product_id.product_price

    //const totalAmount  = productPrice * totalQuanity
   // console. log(totalAmount)

   //const totalAmount = totalAmount.reduce((a,b) => a +b , 0);
     
// Fetch the product information for each item
const productPromises = orderitemResult.map(item =>
   pool.query('SELECT * FROM product WHERE id=?', [item.product_id])
);

// Wait for all product queries to complete
const productResults = await Promise.all(productPromises);
console.log("productResults:", productResults);

//Extract product information from the nested array
const productData = productResults.map(result => result[0][0]);
// Calculate total amount based on cart items and product prices
const totalAmount = orderitemResult.reduce((sum, item, index) => {
  const productPrice = productData[index].product_price;
  const totalQuanity = item.quantity;

  console.log("item:", item);
  console.log("price:", productPrice);
  console.log("quantity:", totalQuanity);

  // Check if productPrice and totalQuanity are valid numbers if (typeof productPrice === 'number' && typeof totalQuanity === 'number') {
    const itemAmount = productPrice * totalQuanity;
    console.log("itemAmount:", itemAmount);

    return sum + itemAmount;
  
}, 0);

console.log("totalAmount:", totalAmount);
      
      
      
    // Generate the current date and time in a suitable format (e.g., YYYY-MM-DD HH:MM:SS)
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Insert the order data into the 'order' table with the generated order_date
    const [insertResult] = await pool.query('INSERT INTO `order` (user_id,cart_id, name, address, phone, country, region, city, zipcode,  order_date,total_amount) VALUES (?,?,?,?,?,?,?,?,?,?,?)',[userResult[0].id,orderitemResult[0].id,  name, address, phone, country, region, city, zipcode, currentDate, totalAmount]);

    if (!insertResult) {
      return res.status(500).json({ message: 'Error inserting data into orders' });
    }

   return res.status(200).json({ message: 'Order inserted successfully' });
  } catch (error) {
    console.error(error);
   return res.status(500).json({ error: 'Internal server error' });
  }
});


Router.get('/order',verifyToken, async(req, res)=>{
 
  try {
     // Perform a database query to get all orders
    const [result]  =await pool.query('SELECT * FROM `order` ' )

    if(result. length === 0){
      res.status(404).json({status: false,  message:'Order not found'})
    }
   res.status(200).json({status: true, message: 'orders selected successfully'})
   
  } catch (error) {
    console.error(error);
    res.status(500).json({status:false,  error: error.message });
  }
})


Router.get('/order/:id',verifyToken, async(req, res)=>{
  const orderId = req.params.id
  try {
    const orderid =await pool.query('SELECT * FROM `order` WHERE id=?', [orderId] )

    if(!orderid){
      res.status(404).json({status: false,  message:'Order not found'})
    }
   res.status(200).json({status: true, message: 'order selected successfully'})
   
  } catch (error) {
    console.error(error);
    res.status(500).json({status:false,  error: error.message });
  }
})


Router.patch('/order/:id',verifyToken, async(req, res)=>{
  const orderId = req.params.id

  const {
    user_id, contact_id, order_items,  total_amount 
  } = req.body;
  try {
    const [order]  = await pool.query('SELECT * FROM `order` WHERE id=?', [orderId] )

    if(order.length === 0){
      res.status(404).json({status: false,  message:'Order not found'})
    }
  
    const [result] = await pool.query('update `order` set (user_id, contact_id, order_items, order_date, total_amout) values(?,?,?,?,?)',[ user_id, contact_id, order_items,  order_date , total_amount])
    
      if (!result) {
        return res.status(404).json({ message: 'order could not be updated' });
      } else {
        return res.status(200).json({ message: 'order updated successfully' });
      }
   
  } catch (error) {
    console.error(error);
    res.status(500).json({status:false,  error: error.message });
  }
})

Router.delete('/delete',verifyToken, async(req, res) => {
 
  try {
    const [result]  = await pool.query('DELETE FROM `order`')
    if (result.affectedRows === 0) {
      res.status(400).json({ message: 'order not found' });
  } else {
      res.status(200).json({ message: 'order deleted successfully' });
  }
  } catch (error) {
    res.status(500).json({
      status: false, 
      error: error.message});
  }
})

Router.delete('/delete/:id',verifyToken, async(req, res) => {
  const orderId = req.params.id
  try {
    const [result]  = await pool.query('DELETE FROM `order` WHERE id =?',[orderId])
    if (result.affectedRows === 0) {
      res.status(400).json({ message: 'order not found' });
  } else {
      res.status(200).json({ message: 'order deleted successfully' });
  }
  } catch (error) {
    res.status(500).json({
      status: false, 
      error: error.message});
  }
})


module.exports = Router

