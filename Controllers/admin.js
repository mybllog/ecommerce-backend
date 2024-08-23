const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require("../util/database").pool;

const adminSignup = async (req, res, next) => {
  const { email, role, isSuperAdmin } = req.body;

  try {
    // Check if the user with the given email exists
    const [userResult] = await pool.query('SELECT id, role, super, status FROM user WHERE email = ?', [email]);

    if (userResult.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'User not found'
      });
    }

    const user = userResult[0];
    
    // Check if the authenticated user has admin privileges
    if (req.userId && req.userId.role === 'admin') {
      // Access req.userId.role safely
      // Check if the authenticated user is trying to update their own role
      if (user.id === req.userId.id) {
        return res.status(403).json({
          status: false,
          message: 'You are not allowed to perform this action on your own account'
        });
      }

      // Check if the user has completed registration
      if (!user.status) {
        return res.status(400).json({
          status: false,
          message: 'User has not completed registration'
        });
      }

      // Update the user's role and super admin status
      const updatedRows = await pool.query('UPDATE user SET role = ?, super = ? WHERE id = ?', [role, isSuperAdmin, user.id]);

      if (updatedRows.affectedRows === 0) {
        return res.status(400).json({
          status: false,
          message: 'Unable to update user role'
        });
      }

      res.status(200).json({
        status: true,
        message: 'Role updated successfully'
      });
    } else {
      return res.status(403).json({
        status: false,
        message: 'You are not authorized to perform this action'
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      error: error.message
    });
  }
};

module.exports = { adminSignup };
