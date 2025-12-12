const bcrypt = require('bcrypt');
const { nanoid } = require('nanoid');
const pool = require('../config/database');
const { generateToken } = require('../middleware/auth');

class AuthController {
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      // Validation
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Name, email, and password are required'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters'
        });
      }

      // Check if email exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Email already registered'
        });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const userId = `user_${nanoid(12)}`;
      await pool.query(
        'INSERT INTO users (id, name, email, password) VALUES ($1, $2, $3, $4)',
        [userId, name, email, hashedPassword]
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        userId: userId
      });

    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to register user'
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      // Find user
      const result = await pool.query(
        'SELECT id, name, email, password FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      const user = result.rows[0];

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      // Generate token
      const token = generateToken(user);

      res.json({
        success: true,
        token: token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to login'
      });
    }
  }

  async getMe(req, res) {
    try {
      const userId = req.user.id;

      const result = await pool.query(
        'SELECT id, name, email, created_at FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        user: result.rows[0]
      });

    } catch (error) {
      console.error('Get me error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user info'
      });
    }
  }
}

module.exports = new AuthController();
