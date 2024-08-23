const express = require('express');
const Router = express();
const crypto = require('crypto');
const config = require('../config')



// Paystack Webhook function starts here

Router.post("/webhook", async (req, res)=> {
   try {
     //validate event
     const hash = crypto.createHmac('sha512', config.PAYSTACK_SECRET_KEY).update(JSON.stringify(req.body)).digest('hex');
  
     if (hash == req.headers['x-paystack-signature']) {
       // Retrieve the request's body
       const event = req.body;
       // Do something with event
       if (event && event.event === 'transfer.success') {
         return res.status(200).json({ message: 'Transfer successful' })
       }  
     } 
     
     res.send(200);
   } catch (error) {
     res.status(500).json({error: error.message})
   }
  });
  
  // Paystack Webhook function ends here
module.exports=Router
