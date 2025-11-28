const { Router } = require('express');
const CartManager = require('../managers/CartManager');
const ProductManager = require('../managers/ProductManager');

const router = Router();
const cartManager = new CartManager();
const productManager = new ProductManager();

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.post(
  '/',
  asyncHandler(async (_req, res) => {
    const cart = await cartManager.createCart();
    res.status(201).json({
      status: 'success',
      payload: cart,
    });
  }),
);

router.get(
  '/:cid',
  asyncHandler(async (req, res) => {
    const cart = await cartManager.getCartById(req.params.cid);
    if (!cart) {
      return res.status(404).json({
        status: 'error',
        error: `Cart with id ${req.params.cid} not found`,
      });
    }

    res.json({
      status: 'success',
      payload: cart.products,
      total: cart.products.length,
    });
  }),
);

router.post(
  '/:cid/product/:pid',
  asyncHandler(async (req, res) => {
    const { cid, pid } = req.params;
    const product = await productManager.getProductById(pid);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        error: `Product with id ${pid} not found`,
      });
    }

    const cart = await cartManager.addProductToCart(cid, pid);
    res.json({
      status: 'success',
      payload: cart,
    });
  }),
);

module.exports = router;

