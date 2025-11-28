const express = require('express');
const productsRouter = require('./routes/products.router');
const cartsRouter = require('./routes/carts.router');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.json({
    status: 'success',
    message: 'Welcome to the Products & Carts API',
  });
});

app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    error: `Route ${req.originalUrl} not found`,
  });
});

app.use(errorHandler);

module.exports = app;

