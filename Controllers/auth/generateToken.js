const jwt = require('jsonwebtoken');
const config = require('./../../config');
const { pool, Company, User } = require('./../../models');
const db = require('../../util/database');

const generateTokens = async (user) => {
    let refreshToken = user.token;
    delete user.token;
    const payload = {
        user,
    };
    try {
        // Generate the access token with the payload and the secret key from your config
        const accessToken = jwt.sign(payload, config.ACCESS_TOKEN_PRIVATE_KEY, { expiresIn: '2h' }); // '2h' means the token will expire in 2 hours

        // Here, you can also generate a refresh token and update it in the database
        // const refreshToken = jwt.sign(payload, config.REFRESH_TOKEN_PRIVATE_KEY, {}); // Generate refresh token

        // Update the user's refresh token in the database
        // await User.update({ token: refreshToken }, { where: { id: user.id } }); // Assuming you have a User model

        return { accessToken, refreshToken }; // Return both access and refresh tokens
    } catch (error) {
        // Handle errors
        console.error("Error generating tokens:", error);
        throw error;
    }
};

module.exports = { generateTokens };
