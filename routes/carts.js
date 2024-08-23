const express = require('express');
const Router = express.Router();
const pool = require('../util/database').pool;
const validator = require('validator'); // Import the validator library
const verifyToken = require("../Controllers/auth/verifyToken")

Router.post('/cart_items', async (req, res) => {
  const { quantity, email, product_name } = req.body;

  try {
    // Validate cart_id, product_id, and quantity
    if (!email || !product_name || !quantity || isNaN(quantity) || quantity <= 0)
      return res.status(400).json({ status: false, message: 'Invalid request data' });

    // Check if the user and product exist in the database
    const [userResult] = await pool.query('SELECT * FROM user WHERE email=?', [email]);
    const [productResult] = await pool.query('SELECT * FROM product WHERE product_name=?', [product_name]);

    if (userResult.length === 0)
      return res.status(400).json({ status: false, message: 'User not found' });

    if (productResult.length === 0)
      return res.status(400).json({ status: false, message: 'Product not found' });

    const stockQuantity = productResult[0].stock_quantity;
    if (stockQuantity < quantity) {
      return res.status(400).json({ status: false, message: 'Not enough stock available' });
    }

    // Start a database transaction
    await pool.beginTransaction();

    // There's enough stock, update the stock quantity in the database
    const newStockQuantity = stockQuantity - quantity;
    await pool.query('UPDATE product SET stock_quantity = ? WHERE id = ?', [newStockQuantity, productResult[0].id]);

    // Check if the product is already in the user's cart
    const [result] = await pool.query('SELECT * FROM carts_item WHERE user_id=? AND product_id=?', [userResult[0].id, productResult[0].id]);

    if (result.length > 0) {
      // If the product is already in the cart, update the quantity
      const updatedQuantity = result[0].quantity + quantity;
      await pool.query('UPDATE carts_item SET quantity=? WHERE user_id=? AND product_id=?', [updatedQuantity, userResult[0].id, productResult[0].id]);
    } else {
      await pool.query('INSERT INTO carts_item (user_id, product_id, quantity) VALUES (?,?,?)', [userResult[0].id, productResult[0].id, quantity]);
    }

    await pool.commit();

    res.status(200).json({ status: true, message: 'Product added to cart successfully', userId: userResult[0].id, productId: productResult[0].id });

  } catch (error) {
    console.error(error);
    await pool.rollback(); // Rollback the transaction in case of an error
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
});

Router.get('/cart_items',verifyToken, async(req, res)=>{
  try {
   const [result]  = await pool. query('SELECT * FROM carts_item');
   if(!result)
   return res. status(400).json({status: true, message:'cart_item not found'})
    res. status(200).json({status: true, message: 'cart_item selected successfully'})
  } catch (error) {
     res. status(500).json({status: false, error: error.message})
  }

})


Router.get('/cart_items/:id',verifyToken, async(req, res)=>{
  const cartitemId = req.params.id
  try {
   const [result]  = await pool. query('SELECT * FROM carts_item WHERE id = ?', cartitemId);
   if(result.length === 0){
    res. status(400).json({status: true, message:'cart_item not found'})
   }
   res. status(200).json({status: true, message: 'cart_item selected successfully'})
  } catch (error) {
     res. status(500).json({status: false, error: error.message})
  }

})

Router.delete('/cart_items',verifyToken, async(req, res)=>{
  try {
   const [result]  = await pool. query('DELETE  FROM carts_item');
   if(result === 0)
   res. status(400).json({status: true, message:'cart_item not found'})
    res. status(200).json({status: true, message: 'cart_item deleted successfully'})
  } catch (error) {
     res. status(500).json({status: false, error: error.message})
  }
})

Router.delete('/cart_items/:id',verifyToken, async(req, res)=>{
  const cartitemId = req.params.id
  try {
   const [result]  = await pool. query('DELETE  FROM carts_item WHERE id = ?', cartitemId);
   if(!result)
    res. status(400).json({status: true, message:'cart not found'})
    res. status(200).json({status: true, message: 'cart deleted successfully'})
  } catch (error) {
     res. status(500).json({status: false, error: error.message})
  }
})



module.exports = Router