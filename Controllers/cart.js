const express = require('express');
//const Router = express.Router();
const pool = require('../util/database').pool;
const validator = require('validator'); // Import the validator library


const createCart = async(req, res) =>{
    try {
        const { email } = req.body;
    
        // Check if the user with the given email exists in the 'users' table
        const [userResult] = await pool.query('SELECT id FROM user WHERE email = ?', [email]);
    
        if (userResult.length === 0) {
          return res.status(400).json({status: false,  message: 'User not found' });
        }
    
        const userId = userResult[0].id;
    
        // Check if userId exists in the 'carts' table
        const [cartExists] = await pool.query('SELECT user_id FROM cart WHERE user_id = ?', [userId]);
    
        if (cartExists.length > 0) {
          return res.status(400).json({status: false,  message: 'User is already in the cart' });
        }
    
        // Insert data into the 'carts' table, associating it with the user
        const [insertResult] = await pool.query('INSERT INTO cart (user_id) VALUES (?)', [userId]);
    
        if (!insertResult) {
          return res.status(400).json({status: false,  message: 'Error inserting data into carts' });
        }
    
        res.status(200).json({status: true,  message: 'Data inserted into carts successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ status: false,  error: 'Internal server error' });
      }
}


const getCart = async(req, res) =>{
    try {
        const result = await pool. query('SELECT * FROM cart');
        if(!result)
        return res. status(400).json({status: true, message:'cart not found'})
         res. status(200).json({status: true, message: 'cart selected successfully'})
       } catch (error) {
          res. status(500).json({status: false, error: error.message})
       }
}

const  getCartById = async(req, res) =>{ 
  const cartId =  req.params.id
    try {
        const [result] = await pool.query('SELECT * FROM cart WHERE id = ?' , cartId)
        if(!result)
        return res. status(400).json({status: true, message:'cart not found'})
         res. status(200).json({status: true, message: 'cart selected successfully'})
    } catch (error) {
         res. status(500).json({status: false, error: error.message})
    }
}

const deleteCart = async(req, res) =>{
    try {
        const result = await pool. query('DELETE  FROM cart');
        if(!result)
        return res. status(400).json({status: true, message:'cart not found'})
         res. status(200).json({status: true, message: 'cart deleted successfully'})
       } catch (error) {
          res. status(500).json({status: false, error: error.message})
       }
}



module. exports = {
    createCart, 
    getCart, 
    getCartById, 
    deleteCart, 
   
}