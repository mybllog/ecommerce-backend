const validator = require("validator");//validating the form with validators
const bcrypt = require("bcrypt"); // for hashing passwords
const saltRounds = 10;// set saltrounds to 10
const pool = require("../util/database").pool;
const jwt = require("jsonwebtoken") // import jsonwebtoken
const config = require("../config")
const verifyToken = require("../Controllers/auth/verifyToken")
const {sendEmail} = require('../Helpers/email');
const { DataTypes } = require("sequelize");


const User = async(req, res)=>{
    try {
        const {  name, email, password ,token } = req.body;
        const status = false
        // Input validation
        if (!validator.isLength(name, { min: 1 }) || validator.isNumeric(name)) {
            return res.status(400).json({ 
                status: false, 
                error: "Name must not be empty and must contain characters, not numbers" });
        }

        // Validate email
        if (!validator.isEmail(email)) {
            return res.status(400).json({
                status: false, 
                 error: 'Invalid email' });
        }

        // Validate password
        if (!validator.isStrongPassword(password, {
            minLength: 6,
            minUpperCase: 1,
            minLowerCase: 1,
            minNumbers: 1,
            minSymbols: 1,
        })) {
            return res.status(400).json({ 
                status: false, 
                error: "Password must include Uppercase, Lowercase, Numbers, and Symbols || password required" });
        }
        
        const [userExists] = await pool.query('SELECT * FROM user WHERE email = ?',[email])
        if(userExists && userExists.length > 0){
           
          return  res. status(400).json({
                status: false, 
                message:'User already exists' })
        }
        // Hash the password before storing it in the database
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert the user into the database
        const [insertResult] = await pool.query(
            'INSERT INTO user ( name, email, password, status) VALUES (?, ?, ?, ?)',
            [ name, email, hashedPassword, status]
        );
           
        const userId = insertResult.insertId; // Use insertId to get the generated user ID
            
       
        // Generate a confirmation token
        const confirmationToken = jwt.sign({ userId }, config.EMAIL_VERIFICATION_TOKEN, { expiresIn: '2h' });

        // Save the token to the database (associate it with the user)
        await pool.query('INSERT INTO confirmation_token (user_id, token) VALUES (?, ?)', [userId, confirmationToken]);

        // Send a confirmation email with the confirmation link
        const confirmationLink = `${config.BASE_URL}/confirm?token=${confirmationToken}`;
        const emailDetails = {
            templateContent: ['username', 'confirmEmail', confirmationLink], // Adjust as needed
        };

        // Import the sendEmail function and use it to send the email
        await sendEmail(email, 'Confirm Your Email', 'Please confirm your email', emailDetails);

        console.log('User registered successfully');

        return res.status(200).json({
            status: true,  
            message: 'User registered successfully' });
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({
            status: false, 
             error: "Internal server error" });
    }
}







const Register = async(req, res) =>{
    try {
        const {  name, email, password } = req.body;
        const status = false
        if( !name || !email||!password){
            return res. status(400).json({
                status: false, 
                message: "all this field are required"
            })
        }
        // Input validation
        if (!validator.isLength(name, { min: 1 }) || validator.isNumeric(name)) {
            return res.status(400).json({ 
                status: false, 
                error: "Name must not be empty and must contain characters, not numbers" });
        }
       
        // Validate email
        if (!validator.isEmail(email)) {
            return res.status(400).json({
                status: false, 
                 error: 'Invalid email' });
        }

        // Validate password
        if (!validator.isStrongPassword(password, {
            minLength: 6,
            minUpperCase: 1,
            minLowerCase: 1,
            minNumbers: 1,
            minSymbols: 1,
        })) {
            return res.status(400).json({
                status: false, 
                 error: "Password must include Uppercase, Lowercase, Numbers, and Symbols" });
        }
        
    
        const [userExists] = await pool.query('SELECT * FROM user WHERE email = ?',[email])
        if(userExists && userExists.length > 0){
           
          return  res. status(400).json({
                status: false, 
                message:'User already exists' })
        }
        // Hash the password before storing it in the database
        const hashedPassword = await bcrypt.hash(password, saltRounds);
         
        // Insert the user into the database
        const [insertResult] = await pool.query(
            'INSERT INTO user ( name, email, password, status) VALUES (?, ?, ?, ?)',
            [ name, email, hashedPassword, status]
        );
           
        const userId = insertResult.insertId; // Use insertId to get the generated user ID
            
       
        // Generate a confirmation token
        const confirmationToken = jwt.sign({ userId }, config.EMAIL_VERIFICATION_TOKEN, { expiresIn: '2h' });
         
        const ExpirationDate = new Date();
        ExpirationDate.setHours(ExpirationDate.getHours() + 2);
        // Save the token to the database (associate it with the user)
        await pool.query('INSERT INTO confirmation_token (user_id, token, expireDate) VALUES (?, ?, ?)', [userId, confirmationToken , ExpirationDate ]);

        // Send a confirmation email with the confirmation link
        const confirmationLink = `${config.BASE_URL}/confirm?token=${confirmationToken}`;
        const emailDetails = {
            templateContent: [`${insertResult.name}`, 'confirmEmail', confirmationLink], // Adjust as needed
        };

        // Import the sendEmail function and use it to send the email
        await sendEmail(email, 'Confirm Your Email', 'Please confirm your email', emailDetails);

        console.log('Registration email sent successfully');

        return res.status(200).json({
            status: true,  
            message: 'Registration email sent successfully' });
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ 
            status: false, 
            error: "Internal server error" });
    }
}

const verifyRegistration = async (req, res) => {
    const { token} = req.query; // Check if it should be req.body or req.query

    try {
        const [result] = await pool.query('SELECT * FROM confirmation_token WHERE token = ?' ,[token]);

        if (!result || result.length === 0) {
            // Token not found or user already verified
            return res.status(400).json({
                status: false,
                message: 'Invalid or expired token'
            });
        }

        // Extract user information from the query result
        const userResult = result[0];
        const expiredTokenDate = userResult.expirationDate;
        const currentDate = new Date();

        // Ensure userId is defined
        const userId = userResult.user_id;

        if (expiredTokenDate && expiredTokenDate <= currentDate) {
            // Generate a new token and update the expiration date
            const newToken = generateNewToken(); // Implement a function to generate a new token
            const expirationDate = calculateNewExpirationDate(); // Implement a function to calculate a new expiration date

            // Update the user's token in the database
            await pool.query('UPDATE confirmation_token SET token = ?, expireDate = ?, user_id = ? WHERE id = ?', [newToken, expirationDate, userId, userResult.id]);

            // Generate a confirmation token using the updated userId
            const confirmationToken = jwt.sign({ userId }, newToken, { expiresIn: expirationDate });

            // Send a confirmation email with the confirmation link
            const confirmationLink = `${config.BASE_URL}/confirm?token=${confirmationToken}`;
            const details = {
                templateContent: ['name', 'confirmEmail', confirmationLink], // Adjust as needed
            };

            await sendEmail(userResult.email, 'Confirm Your Email', 'Please confirm your email', details);

            return res.status(200).json({
                status: true,
                message: 'Registration email sent successfully'
            });
        }

        // Token is valid, mark the user as verified in the 'users' table
        const status = true;
        await pool.query('UPDATE user SET token = ?, status = ? WHERE id = ?', [token, status, userId]);

        // Respond with a success message
        return res.status(200).json({
            status: true,
            message: 'Registration confirmed successfully'
        });
    } catch (error) {
        console.error('Error during token verification:', error);
        res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
}



const Login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const [result] = await pool.query('SELECT * FROM user WHERE email = ?', [email]);

        if (result.length === 0) {
            res.status(400).json({ status: false, message: 'Invalid email or password'});
        }

        const user = result[0];
        const userId = user.id;
        const passwordMatched = await bcrypt.compare(password, user.password);

        if (!passwordMatched) {
            res.status(400).json({status: false, message: 'Password mismatch'});
        }

        const payload = {
            id: userId, // Adding the user ID or any other user data to the payload
            email: user.email,
        };
        // set the Access token to expire in 7day
        const accessToken = jwt.sign(payload, config.ACCESS_TOKEN_PRIVATE_KEY, { expiresIn: '7d' });

        // Check if accessToken was generated successfully
        if (!accessToken) {
            res.status(400).json({
                status: false,
                message: 'Unable to generate access token',
            });
        }

        // Verify the access token to check if it has expired
        jwt.verify(accessToken, config.ACCESS_TOKEN_PRIVATE_KEY, (err, decoded) => {
            if (err) {
                return res.status(400).json({
                    status: false,
                    message: 'Access token has expired or is invalid',
                });
            }
        });

        // Generate a refresh token
        const expirationDate = new Date();
       expirationDate.setFullYear(expirationDate.getFullYear() + 1); // Add 1 year to the current date
       const expireDate= Math.floor(expirationDate.getTime() / 1000);
        let refreshToken = null;
      
           refreshToken = jwt.sign(payload, config.REFRESH_TOKEN_PRIVATE_KEY, { expiresIn: expireDate });
       
           if(!refreshToken){
            res.status(400).json({status: false, message: 'error generating refresh token'});
           }

      // Update the user's refresh token and refresh expiration date in the database
        await pool.query('UPDATE user SET refreshToken = ?, refreshExpire = FROM_UNIXTIME(?) WHERE id = ?', [refreshToken, expireDate, userId]);

        console.log('User logged in successfully', accessToken, refreshToken);
        return res.status(200).json({
            status: true,
            message: 'Successful login',
            accessToken,
            refreshToken,
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            error: error.message,
        });
    }
};


const verifyRefreshToken = async (req, res) => {
    const { refreshToken } = req.body;

    try {
        const user = await pool.query('SELECT * FROM user WHERE refreshToken=?', [refreshToken])
        
        if (user.length === 0) {
            res.status(400).json({
                status: false,
                message: 'token not found',
            });
        } else {
            const decodedToken = jwt.verify(refreshToken, config.REFRESH_TOKEN_PRIVATE_KEY);

            if (!decodedToken || !decodedToken.id || !decodedToken.email) {
                res.status(400).json({
                    status: false,
                    message: 'invalid refresh token',
                });
            } else {
                const payload = {
                    id: decodedToken.id,
                    email: decodedToken.email,
                };

                // Generate a new access token
                const accessToken = jwt.sign(payload, config.ACCESS_TOKEN_PRIVATE_KEY, { expiresIn: '7d' });

                console.log('access token generated', accessToken);

                res.status(200).json({
                    status: true,
                    message: 'new access token generated',
                    accessToken
                });
            }
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: false,
            error: error.message,
        });
    }
};


const forgetPassword = async(req, res) =>{
    try {
        const { email } = req.body;
        const [result] = await pool.query('SELECT * FROM user WHERE email = ?', [email]);
    
        if (!result || result.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
       
        payload ={
            email: result[0].email
        }
       
        const resetToken = jwt.sign(payload, config.RESET_PASSWORD_TOKEN, { expiresIn: '24m' });
        const resetLink = `${config.BASE_URL}/forget-password?token=${resetToken}`;
  
        console.log('result:', result); // Check the value of 'result'
        console.log('resetLink:', resetLink); // Check the value of 'resetLink'
        console.log('result[0].name:', result[0].name); // Check the value of 'name' property
    
        const details = {
          templateContent:[result[0].name , 'resetPassword', resetLink]
        };
        console.log('details:', details);
        await sendEmail(email, 'Reset Your Password','please reset your password', details);
        res.status(200).json({
            status: true,  
            message: 'Reset link sent successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ 
            status: false, 
            error: error.message });
           
      }
}


const resetPassword = async (req, res) => {
    try {
        const { newPassword,token } = req.body;
       
        console.log('token:', token);

        // Verify the JWT token
        const decodedToken = jwt.verify(token, config.RESET_PASSWORD_TOKEN);

        if (!decodedToken || !decodedToken.email ) {
            return res.status(400).json({
                status: false, 
                 message: 'Token is invalid or has expired' });
        }

       

        // Find the user by email
        const [result] = await pool.query('SELECT * FROM user WHERE email = ?', [decodedToken.email]);

        if (!result || result.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

       
        const userResult = result[0];
        const userId = userResult.id;
    

        const currentDate = new Date();
        if(decodedToken > currentDate){
            res.status(400).json({
                status: true, 
                message: 'token exists'})
        }

        const samePassword = await bcrypt.compare(userResult.password, newPassword)

        if(samePassword){
            res.status(400).json({
                status: false, 
                message: 'New password cannot be the same as the old password'})

        }

        // Hash the new password and update it in the database
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        await pool.query('UPDATE user SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.status(200).json({
            status: true, 
             message: ' password reset successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false, 
             error: error.message });
    }
};

const updatePassword = async(req, res) =>{
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.params.id;
        const [result] = await pool.query('SELECT * FROM user WHERE id = ?', [userId]);
        console. log(result)
        if (!result || result.length === 0) {
          return res.status(400).json({status: false,  error: 'User not found' });
        }
        
        const userResult = result[0]; 
    
        const passwordMatched = await bcrypt.compare(currentPassword, userResult.password);
    
        if (!passwordMatched) {
          res. status(400).json({
            status: false, 
            message: 'Password mismatch'});
        }
    
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        await pool.query('UPDATE user SET password = ? WHERE id = ?', [hashedPassword, userId]); // Fix the query
    
        res.status(200).json( {
             status: true, 
             message: 'User password updated successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false, 
             error: error.message });
      }
}



const getUser = async(req, res) =>{
    try {
        const [result] = await  pool.query('SELECT * FROM user')
        res.send(result)
      } catch (error) {
          res.status(500).json({status: false, 

             error: "internal error"})
      }
}

const getUserById = async(req, res)=>{
    const userId = req.params.id;
    try {
        const [result] = await pool.query('SELECT * FROM user WHERE id = ?', [userId]);
        if (result.length === 0) {
            res.status(404).json({ error: 'User ID not found' });
        } else {
            const user = result[0];
            res.status(200).json({ 
                status: true, 
                user });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: false, 
             error: 'Internal server error' });
    }
}

const patchUser = async(req, res)=>{
    try {
        const userId = req.params.id;
        const updatedFields = req.body;
    
        // Prepare the SET clause with column names dynamically using template literals
        let setClause = '';
        for (const key in updatedFields) {
            if (updatedFields.hasOwnProperty(key)) {
                setClause += `${key} = ?, `;
            }
        }
        setClause = setClause.slice(0, -2); // Remove the last comma and space
    
        pool.query(
            `UPDATE user SET ${setClause} WHERE id = ?`,
            [...Object.values(updatedFields), userId],
            (error, result) => {
                if (error) {
                    console.log(error);
                    res.status(500).json({ error: 'Internal server error' });
                } else {
                    if (result.affectedRows === 0) {
                        res.status(400).json({
                             status: false, 
                             message: 'User information not updated' });
                    } else {
                        res.status(200).json({ 
                            status: true, 
                            message: 'User information updated successfully' });
                    }
                }
            }
        );
    } catch (error) {
        console. log(error);
        res. status(500).json({
            status: true, 
            error: error.message
        })
    }

}

const putUser = async(req, res)=>{
    const userId = req.params.id;
    const updatedUser = req.body;
     try {
    
     const [result] = pool.query('UPDATE user SET ? WHERE id = ?', [updatedUser, userId])
                if (result.affectedRows === 0) {
                    res.status(400).json({ message: 'User information not updated' });
                } else {
                    res.status(200).json({ message: 'User information updated successfully' });
                }
            
    
     } catch (error) {
        console. log(error);
        res.status(500).json({ status: true, 
            error: error.message });
     }     
}


const deleteUser = async(req, res)=>{
    try {
        const [result]  = await pool.query('DELETE FROM user')
        res.send(result);
     } catch (error) {
         console.log(error);
         res.status(500).json({
            status: false, 
             error: "internal error"})
     }
}

const deleteUserById = async(req, res) =>{
    const userId = req.params.id;
    try {
        pool.query('DELETE FROM user WHERE id = ?', [userId])
         
                if (result.affectedRows === 0) {
                    res.status(400).json({ message: 'User not found' });
                } else {
                    res.status(200).json({ message: 'User deleted successfully' });
                }
            
    
    } catch (error) {
        console. log(error);
        res. status(400).json({
            status: true, 
            error: error.message
        })
    }

}




module.exports = {
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
    putUser, 
    patchUser, 
    deleteUser, 
    deleteUserById
}