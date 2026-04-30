const { Router } = require('express');
const { getDbExample } = require('../handlers/dbExample.handler');

const router = Router();

router.get('/db-example', getDbExample);

module.exports = router;
