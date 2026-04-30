const express = require('express');
const logger = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');
const exampleRoute = require('./routes/example.route');
const dbExampleRoute = require('./routes/dbExample.route');

const app = express();

app.use(express.json());
app.use(logger);

app.use('/', exampleRoute);
app.use('/', dbExampleRoute);

app.use(errorHandler);

module.exports = app;
