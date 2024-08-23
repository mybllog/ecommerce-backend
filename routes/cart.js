const express = require('express');
const Router = express.Router();
const pool = require('../util/database').pool;
const validator = require('validator'); // Import the validator library




Router.post('/cart_items',async(req,res)=>{
  const {cart_id,product_id,quantity} = req.body

  try {
     // Validate cart_id, product_id, and quantity
    if(!cart_id||!product_id||!quantity||isNaN(quantity)||quantity <= 0)
    return res.status(400).json({ message: 'Invalid request data' });

    // Check if the user and product exist in the database
    const [cartResult] = await pool.query('SELECT * FROM carts WHERE id=?',[cart_id])
    const [productResult] = await pool.query('SELECT * FROM product WHERE id=?',[product_id])

    if(cartResult.length===0)
    return res.status(400).json({message: 'id not found'})

    if(productResult.length===0)
    return res.status(400).json({message: 'id not found'})
   
     
      // Check if the product is already in the user's cart
    const [result] = await pool.query('SELECT * FROM cart WHERE cart_id=? AND product_id=?', [cart_id,product_id])

    if(result.length > 0){
      // If the product is already in the cart, update the quantity
  const updatedQuantity = result[0].quantity+quantity
  await pool.query('UPDATE cart SET quantity=? WHERE cart_id=? AND product_id=?', [updatedQuantity,cart_id,product_id])
    }else{
      await pool.query('INSERT INTO cart (cart_id,product_id,quantity) VALUES (?,?,?)', [cart_id,product_id,quantity])
    }
    res.status(200).json({ message: 'Product added to cart successfully' });


  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' });
  }
})

module.exports = Router