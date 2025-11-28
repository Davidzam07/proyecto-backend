const fs = require('fs/promises');
const path = require('path');

class CartManager {
  constructor(fileName = 'carts.json') {
    this.filePath = path.resolve(__dirname, '..', 'data', fileName);
    this.ready = this.#ensureFile();
  }

  async #ensureFile() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(this.filePath, '[]');
    }
  }

  async #readFile() {
    await this.ready;
    const data = await fs.readFile(this.filePath, 'utf-8');
    return data ? JSON.parse(data) : [];
  }

  async #writeFile(payload) {
    await fs.writeFile(this.filePath, JSON.stringify(payload, null, 2));
  }

  #generateId(collection) {
    if (!collection.length) return '1';
    const maxId = collection.reduce((max, item) => {
      const current = Number(item.id) || 0;
      return current > max ? current : max;
    }, 0);
    return String(maxId + 1);
  }

  async createCart() {
    const carts = await this.#readFile();
    const newCart = {
      id: this.#generateId(carts),
      products: [],
    };
    carts.push(newCart);
    await this.#writeFile(carts);
    return newCart;
  }

  async getCartById(id) {
    const carts = await this.#readFile();
    return carts.find((cart) => cart.id === String(id));
  }

  async addProductToCart(cartId, productId) {
    const carts = await this.#readFile();
    const index = carts.findIndex((cart) => cart.id === String(cartId));
    if (index === -1) {
      const error = new Error(`Cart with id ${cartId} not found`);
      error.statusCode = 404;
      throw error;
    }

    const cart = carts[index];
    const productEntry = cart.products.find(
      (item) => item.product === String(productId),
    );

    if (productEntry) {
      productEntry.quantity += 1;
    } else {
      cart.products.push({
        product: String(productId),
        quantity: 1,
      });
    }

    carts[index] = cart;
    await this.#writeFile(carts);
    return cart;
  }
}

module.exports = CartManager;

