const jwt = require('jsonwebtoken');
const config = require('../../config');
const { json } = require('body-parser');

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization']; // Assuming the token is passed in the 'authorization' header
    const token = authHeader && authHeader.split(' ')[1]; // Corrected the split statement
    
    try {
        if (!token) {
            return res.status(401).json({ error: 'Token not sent, authorization denied' });
        }

        const decoded = jwt.verify(token, config.ADMIN_VERIFY_TOKEN);

        // Attach the decoded user ID to the request object
        req.userId = decoded.id;

        // Check the role and return an error if it's not 'Admin'
        if (req.userId.role !== 'Admin') {
            return res.status(400).json({ error: 'Unauthorized: Only Admins are allowed' });
        }

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token is not valid' });
    }
};

module.exports = verifyToken; // Corrected "module.export" to "module.exports"
