const express = require('express');
const Router = express.Router();
const pool = require('../util/database').pool;
const validator = require('validator'); // Import the validator library
const axios = require('axios');
const config = require('../config');
const { v4: uuidv4 } = require('uuid');

Router.post('/create-checkout2',async(req,res)=>{
  const{user_id} = req.body
    try {
      const [userResult] = await pool.query('SELECT email FROM user WHERE id = ?',[user_id])

      if(!userResult||userResult.length === 0)
      res.status(400).json({message:'User not found'})
        
      const result = userResult[0].email
      const [orderResult] = await pool.query('SELECT total_amount FROM `order` WHERE user_id =?',[user_id])
        const amounts = orderResult[0].total_amount
        console.log(amounts)
      if(!orderResult|| orderResult.length === 0)
      res.status(400).json({message:'Order not found'})
               
           console.log(orderResult)
      const uniqueTransactionReference = uuidv4();;
        const paymentData = {
          tx_ref: uniqueTransactionReference,  // Generate a unique reference
          amount: amounts , // Amount in your currency
          currency: 'NGN', // Currency code
          payment_type: "card,bank transfer, mobile money",// Payment type (e.g., card, bank transfer, mobile money)
          redirect_url: 'http://localhost:3000/', // Redirect URL after payment
          // Add more payment data as needed
          customer: {
            email: result,
            // Add other customer details as needed
          },
        };

        // Generate a unique transaction reference
   
    
        const response = await axios.post(
          'https://api.flutterwave.com/v3/payments',
          paymentData,
          {
            headers: {
              Authorization: `Bearer ${config.FLUTTERWAVE_SECRET_KEY}`,
            },
          }
        );
    
        const { data } = response;
        res.json(data);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred' });
      }
})

module.exports = Router

