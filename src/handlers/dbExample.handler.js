const pool = require('../db/pool');

const getDbExample = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users');
    res.status(200).json({
      status: 'success',
      data: rows,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDbExample };
