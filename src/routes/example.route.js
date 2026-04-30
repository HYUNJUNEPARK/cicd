const { Router } = require('express');
const { getExample } = require('../handlers/example.handler');

const router = Router();

router.get('/example', getExample);

module.exports = router;
