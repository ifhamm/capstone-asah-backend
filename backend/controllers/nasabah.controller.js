const { nanoid } = require('nanoid');
const pool = require('../config/database');
const MLService = require('../services/ml.service');

const mlService = new MLService();

class NasabahController {
  async predictAndCreate(req, res) {
    const client = await pool.connect();
    
    try {
      const userId = req.user.id;
      const {
        name,
        phone,
        age,
        job,
        marital,
        education,
        default_status,
        housing,
        loan,
        contact,
        month,
        day_of_week,
        campaign,
        emp_var_rate,
        cons_price_idx,
        cons_conf_idx,
        euribor3m,
        nr_employed
      } = req.body;

      // Validation
      if (!name || !age || !job || !marital || !education) {
        return res.status(400).json({
          success: false,
          error: 'Required fields: name, age, job, marital, education'
        });
      }

      // Prepare data for ML prediction
      const mlData = {
        age,
        job,
        marital,
        education,
        default: default_status || 'no',
        housing: housing || 'no',
        loan: loan || 'no',
        contact: contact || 'cellular',
        month: month || 'may',
        day_of_week: day_of_week || 'mon',
        campaign: campaign || 1,
        emp_var_rate: emp_var_rate || 1.1,
        cons_price_idx: cons_price_idx || 93.994,
        cons_conf_idx: cons_conf_idx || -36.4,
        euribor3m: euribor3m || 4.857,
        nr_employed: nr_employed || 5191.0
      };

      // Call ML API
      const mlResult = await mlService.predict(mlData);

      if (!mlResult.success) {
        return res.status(500).json({
          success: false,
          error: 'ML prediction failed',
          details: mlResult.error
        });
      }

      const prediction = mlResult.data.label;
      const probability = mlResult.data.probability;

      // Start transaction
      await client.query('BEGIN');

      // Insert nasabah
      const nasabahId = `cust_${nanoid(12)}`;
      const insertQuery = `
        INSERT INTO nasabah (
          id, user_id, name, phone, age, job, marital, education,
          default_status, housing, loan, contact, month, day_of_week,
          campaign, emp_var_rate, cons_price_idx, cons_conf_idx,
          euribor3m, nr_employed, prediction, probability, status_call
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20, $21, $22, 'pending'
        ) RETURNING *
      `;

      const values = [
        nasabahId, userId, name, phone || null, age, job, marital, education,
        default_status || 'no', housing || 'no', loan || 'no',
        contact || 'cellular', month || 'may', day_of_week || 'mon',
        campaign || 1, emp_var_rate || 1.1, cons_price_idx || 93.994,
        cons_conf_idx || -36.4, euribor3m || 4.857, nr_employed || 5191.0,
        prediction, probability
      ];

      await client.query(insertQuery, values);
      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        data: {
          nasabahId: nasabahId,
          prediction: prediction,
          probability: probability,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Predict and create error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create nasabah',
        details: error.message
      });
    } finally {
      client.release();
    }
  }

  async getAll(req, res) {
    try {
      const userId = req.user.id;
      const { status_call, prediction, page = 1, limit = 10 } = req.query;

      let query = 'SELECT * FROM nasabah WHERE user_id = $1';
      const params = [userId];
      let paramIndex = 2;

      if (status_call) {
        query += ` AND status_call = $${paramIndex}`;
        params.push(status_call);
        paramIndex++;
      }

      if (prediction) {
        query += ` AND prediction = $${paramIndex}`;
        params.push(prediction);
        paramIndex++;
      }

      // Count total
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Add pagination
      const offset = (page - 1) * limit;
      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), offset);

      const result = await pool.query(query, params);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Get all nasabah error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get nasabah list'
      });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await pool.query(
        'SELECT * FROM nasabah WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Nasabah not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Get nasabah by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get nasabah'
      });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { name, phone, notes } = req.body;

      const result = await pool.query(
        `UPDATE nasabah 
         SET name = COALESCE($1, name),
             phone = COALESCE($2, phone),
             notes = COALESCE($3, notes)
         WHERE id = $4 AND user_id = $5
         RETURNING *`,
        [name, phone, notes, id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Nasabah not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Update nasabah error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update nasabah'
      });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await pool.query(
        'DELETE FROM nasabah WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Nasabah not found'
        });
      }

      res.json({
        success: true,
        message: 'Nasabah deleted successfully'
      });

    } catch (error) {
      console.error('Delete nasabah error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete nasabah'
      });
    }
  }

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status_call, notes } = req.body;
      const userId = req.user.id;

      // Validate status
      const validStatuses = ['pending', 'called', 'failed', 'not_interested'];
      if (!validStatuses.includes(status_call)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      const result = await pool.query(
        `UPDATE nasabah 
         SET status_call = $1, notes = COALESCE($2, notes)
         WHERE id = $3 AND user_id = $4
         RETURNING *`,
        [status_call, notes || null, id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Nasabah not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update status'
      });
    }
  }
}

module.exports = new NasabahController();
