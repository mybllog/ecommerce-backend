const express = require("express");
const router = express.Router();
const validator = require("validator");//validating the form with validators
const bcrypt = require("bcrypt"); // for hashing passwords
const saltRounds = 10;// set saltrounds to 10
const pool = require("../util/database").pool;
const jwt = require("jsonwebtoken") // import jsonwebtoken
const config = require("../config")
const verifyToken = require("../Controllers/auth/verifyToken")
const {sendEmail} = require('../Helpers/email')
const {
    User,
     Register,
      Login,  
      verifyRefreshToken,  
      verifyRegistration,
       forgetPassword,
        resetPassword, 
        getUser, 
         getUserById, 
        updatePassword, 
        patchUser, 
       putUser  ,
      deleteUser ,
    deleteUserById     }  = require("../Controllers/auth")
// ... (Other imports and configurations)

// API endpoint to create a new user
router.post('/users',User, async (req, res) => {
    
});

//endpoint to comfirm user

router.post('/confirmuser', async (req, res) => {
    const { email } = req.body;
    
    try {
        const [Result] = await pool.query('SELECT * FROM user WHERE email = ?', [email]);
        
        
        
        if (!Result || Result.length === 0) {
            return res.status(404).json({
                status: false,  
                error: 'User not found' });
        }
    
        const userId = Result[0].id;
        
        // Generate a confirmation token
        const confirmationToken = jwt.sign({ userId }, config.EMAIL_VERIFICATION_TOKEN, { expiresIn: '2h' });
        
        // Save the token to the database (associate it with the user)
        await pool.query('INSERT INTO confirmation_token (user_id, token) VALUES (?, ?)', [userId, confirmationToken]);
        
        // Send a confirmation email with the confirmation link
        const confirmationLink = `${config.BASE_URL}/confirm?token=${confirmationToken}`;
        const details = {
            templateContent: ['name', 'confirmEmail', confirmationLink], // Adjust as needed
        };
        
        await sendEmail(email, 'Confirm Your Email', 'Please confirm your email', details);
    
        res.status(200).json({ 
            status: true, 
            message: 'Email confirmation sent successfully' });
    
        
    } catch (error) {
        console.error("Error confirming user:", error);
        res.status(500).json({ 
            status: false, 
            error: 'Confirmation link failed' });
    }

})

//endpoint to register user
router.post('/register',Register) 



// endpoint to login in registered user
router.post('/login',Login)

// endpoint to verify Refresh token
router.get('/verifyRefreshToken',verifyRefreshToken)

//endpoint to update the password of registered user
router.put('/:id/password/update', updatePassword ,verifyToken) 



  
// endpoint  for user to get a reset link after forgetting their password
router.post('/forget-password',forgetPassword)
   
  
  

  // endpoint to get new password
  router.post('/reset-password', resetPassword )

//verify user is registered sucessfully when user clicks on the confirmation link
// Check if the token is valid and retrieve user information

router.get('/confirm', verifyRegistration )
    


// API endpoint to retrieve all users
router.get('/users',verifyToken, getUser) 


// API endpoint to get a specific user by id
router.get('/users/:id',verifyToken ,getUserById)


// Update a particular user's information
router.patch('/users/:id', patchUser, verifyToken) 


// Change user information completely
router.put('/users/:id',putUser, verifyToken)

// endpoint to Delete all users
router.delete('/users',deleteUser, verifyToken)


// endpoint to Delete a particular  user id
router.delete('/users/:id', deleteUserById, verifyToken)

module.exports = router
