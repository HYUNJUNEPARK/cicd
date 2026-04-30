const getExample = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Hello from example API!',
    timestamp: new Date().toISOString(),
  });
};

module.exports = { getExample };
