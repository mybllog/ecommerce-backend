const express = require("express");
const router = express.Router();
const validator = require("validator"); // Validating the form with validators

// You need to import the sendEmail function from your Helpers/email file
const { sendEmail } = require('../Helpers/email');

router.post('/api/contacts', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        
        // Validation
        if (!name || !email || !message) {
            return res.status(400).json({ message: 'Please fill out all the fields' });
        }

        // Use your sendEmail function to send the email
        await sendEmail(
            email,
            'chisomeleanora@example.com', // Change to the admin's email address
            'New Contact Form Submission',
            `<p>Name: ${name}</p><p>Email: ${email}</p><p>Message: ${message}</p>`
        );

        console.log('Received form data:', { name, email, message });
        res.status(200).json({ message: 'Successfully sent form data' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error sending form data' });
    }
});

module.exports = router;
