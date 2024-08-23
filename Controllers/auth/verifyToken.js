const jwt = require('jsonwebtoken');
const config = require('../../config');

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization']; // Assuming the token is passed in the 'authorization' header
    const token = authHeader && authHeader.split(' ')[1];
    
    try {
        if (!token) {
            return res.status(401).json({ error: 'Token not sent, authorization denied' });
        }

        console.log('Received token:', token);

        const decoded = jwt.verify(token, config.ACCESS_TOKEN_PRIVATE_KEY);

        console.log('Decoded token:', decoded);

        req.userId = decoded.id;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ 
            status: false, 
            error: 'Token is not valid' 
        });
    }
};

module.exports = verifyToken;
