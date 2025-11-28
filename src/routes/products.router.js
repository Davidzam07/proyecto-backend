const { Router } = require('express');
const ProductManager = require('../managers/ProductManager');

const router = Router();
const productManager = new ProductManager();

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const products = await productManager.getProducts();
    const { limit } = req.query;

    let payload = products;
    if (limit !== undefined) {
      const numericLimit = Number(limit);
      payload = Number.isNaN(numericLimit) || numericLimit < 0 ? products : products.slice(0, numericLimit);
    }

    res.json({
      status: 'success',
      payload,
      total: payload.length,
    });
  }),
);

router.get(
  '/:pid',
  asyncHandler(async (req, res) => {
    const product = await productManager.getProductById(req.params.pid);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        error: `Product with id ${req.params.pid} not found`,
      });
    }

    res.json({
      status: 'success',
      payload: product,
    });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const newProduct = await productManager.addProduct(req.body);
    res.status(201).json({
      status: 'success',
      payload: newProduct,
    });
  }),
);

router.put(
  '/:pid',
  asyncHandler(async (req, res) => {
    const updatedProduct = await productManager.updateProduct(req.params.pid, req.body);
    res.json({
      status: 'success',
      payload: updatedProduct,
    });
  }),
);

router.delete(
  '/:pid',
  asyncHandler(async (req, res) => {
    await productManager.deleteProduct(req.params.pid);
    res.json({
      status: 'success',
      message: `Product ${req.params.pid} deleted`,
    });
  }),
);

module.exports = router;

