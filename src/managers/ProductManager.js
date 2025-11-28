const fs = require('fs/promises');
const path = require('path');

class ProductManager {
  constructor(fileName = 'products.json') {
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

  #validateProductInput(product) {
    const requiredFields = ['title', 'description', 'code', 'price', 'stock', 'category'];
    const missing = requiredFields.filter((field) => product[field] === undefined);
    if (missing.length) {
      const error = new Error(`Missing fields: ${missing.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    if (typeof product.price !== 'number' || product.price < 0) {
      const error = new Error('price must be a non-negative number');
      error.statusCode = 400;
      throw error;
    }

    if (!Number.isInteger(product.stock) || product.stock < 0) {
      const error = new Error('stock must be a non-negative integer');
      error.statusCode = 400;
      throw error;
    }

    if (product.status !== undefined && typeof product.status !== 'boolean') {
      const error = new Error('status must be boolean');
      error.statusCode = 400;
      throw error;
    }

    if (product.thumbnails && !Array.isArray(product.thumbnails)) {
      const error = new Error('thumbnails must be an array of strings');
      error.statusCode = 400;
      throw error;
    }
  }

  async getProducts() {
    return this.#readFile();
  }

  async getProductById(id) {
    const products = await this.#readFile();
    return products.find((product) => product.id === String(id));
  }

  async addProduct(productData) {
    const productPayload = {
      ...productData,
      status: productData.status ?? true,
      thumbnails: Array.isArray(productData.thumbnails) ? productData.thumbnails : [],
    };

    this.#validateProductInput(productPayload);

    const products = await this.#readFile();
    const duplicated = products.find((product) => product.code === productPayload.code);
    if (duplicated) {
      const error = new Error(`Product with code ${productPayload.code} already exists`);
      error.statusCode = 409;
      throw error;
    }

    const newProduct = {
      ...productPayload,
      id: this.#generateId(products),
    };

    products.push(newProduct);
    await this.#writeFile(products);
    return newProduct;
  }

  async updateProduct(id, updates) {
    if (Object.prototype.hasOwnProperty.call(updates, 'id')) {
      delete updates.id;
    }

    if (updates.thumbnails && !Array.isArray(updates.thumbnails)) {
      const error = new Error('thumbnails must be an array of strings');
      error.statusCode = 400;
      throw error;
    }

    if (updates.price !== undefined && (typeof updates.price !== 'number' || updates.price < 0)) {
      const error = new Error('price must be a non-negative number');
      error.statusCode = 400;
      throw error;
    }

    if (updates.stock !== undefined && (!Number.isInteger(updates.stock) || updates.stock < 0)) {
      const error = new Error('stock must be a non-negative integer');
      error.statusCode = 400;
      throw error;
    }

    if (updates.status !== undefined && typeof updates.status !== 'boolean') {
      const error = new Error('status must be boolean');
      error.statusCode = 400;
      throw error;
    }

    const products = await this.#readFile();
    const index = products.findIndex((product) => product.id === String(id));
    if (index === -1) {
      const error = new Error(`Product with id ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    if (updates.code) {
      const duplicated = products.find(
        (product) => product.code === updates.code && product.id !== String(id),
      );
      if (duplicated) {
        const error = new Error(`Product with code ${updates.code} already exists`);
        error.statusCode = 409;
        throw error;
      }
    }

    const updatedProduct = {
      ...products[index],
      ...updates,
    };

    products[index] = updatedProduct;
    await this.#writeFile(products);
    return updatedProduct;
  }

  async deleteProduct(id) {
    const products = await this.#readFile();
    const index = products.findIndex((product) => product.id === String(id));
    if (index === -1) {
      const error = new Error(`Product with id ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    const [removed] = products.splice(index, 1);
    await this.#writeFile(products);
    return removed;
  }
}

module.exports = ProductManager;

