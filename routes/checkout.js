const express = require('express');
const Router = express.Router();
const pool = require('../util/database').pool;
const validator = require('validator'); // Import the validator library
const axios = require('axios');
const config = require('../config');
const { v4: uuidv4 } = require('uuid');

// Create a payment checkout for an order
Router.post('/create-checkout', async (req, res) => {
  const { user_id} = req.body;

  try {
    // Retrieve user's email using user_id
    const [userResult] = await pool.query('SELECT email FROM user WHERE id = ?', [user_id]);
    if (!userResult || userResult.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const userEmail = userResult[0].email;

    // Fetch order details using order_id
    const [orderResult] = await pool.query('SELECT * FROM `order` WHERE user_id = ?', [user_id]);
    if (!orderResult || orderResult.length === 0) {
      return res.status(400).json({ message: 'Order not found' });
    }

    const result = userEmail;
    const uniqueTransactionReference = uuidv4();;
    // Make a request to Paystack to create a new payment link
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: result,
        amount: orderResult[0].total_amount * 100,
        redirect_url: 'http://localhost:3000/',
        tx_ref: uniqueTransactionReference,  // Generate a unique reference
      },
      {
        headers: {
          Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const { data } = response;
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

module.exports = Router;


module.exports = Router;
