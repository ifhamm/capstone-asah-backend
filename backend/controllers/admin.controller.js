const pool = require('../config/database');

class AdminController {
  async getSummary(req, res) {
    try {
      const userId = req.user.id;

      // Total nasabah
      const totalResult = await pool.query(
        'SELECT COUNT(*) as total FROM nasabah WHERE user_id = $1',
        [userId]
      );
      const totalNasabah = parseInt(totalResult.rows[0].total);

      // Prediction summary
      const predictionResult = await pool.query(
        `SELECT prediction, COUNT(*) as count 
         FROM nasabah 
         WHERE user_id = $1 
         GROUP BY prediction`,
        [userId]
      );

      const predictionSummary = {
        YES: 0,
        NO: 0
      };

      predictionResult.rows.forEach(row => {
        if (row.prediction === 'YES') {
          predictionSummary.YES = parseInt(row.count);
        } else if (row.prediction === 'NO') {
          predictionSummary.NO = parseInt(row.count);
        }
      });

      // Call tracking summary
      const callResult = await pool.query(
        `SELECT status_call, COUNT(*) as count 
         FROM nasabah 
         WHERE user_id = $1 
         GROUP BY status_call`,
        [userId]
      );

      const callSummary = {
        pending: 0,
        called: 0,
        failed: 0,
        not_interested: 0
      };

      callResult.rows.forEach(row => {
        callSummary[row.status_call] = parseInt(row.count);
      });

      // Success rate calculation
      // Success = called AND prediction = YES
      const successResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM nasabah 
         WHERE user_id = $1 AND status_call = 'called' AND prediction = 'YES'`,
        [userId]
      );

      const successCount = parseInt(successResult.rows[0].count);
      const calledCount = callSummary.called;
      const successRate = calledCount > 0 
        ? ((successCount / calledCount) * 100).toFixed(1) + '%'
        : '0%';

      // Recent activities (last 10)
      const recentResult = await pool.query(
        `SELECT id, name, prediction, probability, status_call, created_at
         FROM nasabah 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 10`,
        [userId]
      );

      res.json({
        success: true,
        data: {
          total_nasabah: totalNasabah,
          prediction_summary: {
            positive: predictionSummary.YES,
            negative: predictionSummary.NO
          },
          call_tracking_summary: callSummary,
          success_rate: successRate,
          recent_activities: recentResult.rows
        }
      });

    } catch (error) {
      console.error('Get summary error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get summary data'
      });
    }
  }

  async getStats(req, res) {
    try {
      const userId = req.user.id;
      const { period = '7days' } = req.query;

      // Calculate date range
      let dateFilter = '';
      if (period === '7days') {
        dateFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
      } else if (period === '30days') {
        dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
      } else if (period === '90days') {
        dateFilter = "AND created_at >= NOW() - INTERVAL '90 days'";
      }

      // Daily stats
      const dailyStats = await pool.query(
        `SELECT 
           DATE(created_at) as date,
           COUNT(*) as total,
           COUNT(CASE WHEN prediction = 'YES' THEN 1 END) as positive,
           COUNT(CASE WHEN prediction = 'NO' THEN 1 END) as negative
         FROM nasabah 
         WHERE user_id = $1 ${dateFilter}
         GROUP BY DATE(created_at)
         ORDER BY date DESC`,
        [userId]
      );

      // Average probability
      const avgProbResult = await pool.query(
        `SELECT AVG(probability) as avg_probability
         FROM nasabah 
         WHERE user_id = $1 ${dateFilter}`,
        [userId]
      );

      const avgProbability = avgProbResult.rows[0].avg_probability 
        ? parseFloat(avgProbResult.rows[0].avg_probability).toFixed(4)
        : 0;

      res.json({
        success: true,
        data: {
          period: period,
          daily_stats: dailyStats.rows,
          average_probability: avgProbability
        }
      });

    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get statistics'
      });
    }
  }
}

module.exports = new AdminController();
