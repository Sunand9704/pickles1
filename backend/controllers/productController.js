const Product = require('../models/Product');
const path = require('path');
const fs = require('fs').promises;
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const CLOUDINARY_PRODUCTS_FOLDER = process.env.CLOUDINARY_PRODUCTS_FOLDER || 'pickles/products';

async function uploadLocalFileToCloudinary(relativeFilePath) {
  // relativeFilePath is relative to backend root (due to convertToRelativePath). Build absolute.
  const absolutePath = path.join(__dirname, '..', relativeFilePath);
  const fileName = path.parse(relativeFilePath).name;
  const publicId = `${CLOUDINARY_PRODUCTS_FOLDER}/${fileName}`;
  const result = await cloudinary.uploader.upload(absolutePath, {
    folder: CLOUDINARY_PRODUCTS_FOLDER,
    public_id: fileName,
    overwrite: true,
    resource_type: 'image',
  });
  // Clean up local file quietly
  try { await fs.unlink(absolutePath); } catch (_) {}
  return result.secure_url;
}

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching products' });
  }
};

// Create new product
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      stock,
      unit,
      discount,
      isDiscountActive,
      discountStartDate,
      discountEndDate,
      offerPrice,
      offerStartDate,
      offerEndDate,
      isOfferActive
    } = req.body;

    // Handle image uploads -> upload to Cloudinary and store URLs
    let images = [];
    if (req.files && req.files.length > 0) {
      const uploads = [];
      for (const file of req.files) {
        uploads.push(uploadLocalFileToCloudinary(file.path));
      }
      images = await Promise.all(uploads);
    }

    const product = new Product({
      name,
      description,
      price,
      category,
      stock,
      unit,
      images,
      discount,
      isDiscountActive,
      discountStartDate,
      discountEndDate,
      offerPrice,
      offerStartDate,
      offerEndDate,
      isOfferActive
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const updateData = { ...req.body };

    // Handle new image uploads: upload to Cloudinary and replace images array
    if (req.files && req.files.length > 0) {
      const newImageUrls = [];
      for (const file of req.files) {
        const url = await uploadLocalFileToCloudinary(file.path);
        newImageUrls.push(url);
      }
      updateData.images = newImageUrls;
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ... existing code ...

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete associated images
    for (const image of product.images) {
      try {
        const fullPath = path.join(__dirname, '..', image);
        await fs.unlink(fullPath);
      } catch (err) {
        console.error('Error deleting image:', err);
      }
    }

    // Use findByIdAndDelete instead of remove()
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ... existing code ...

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    // Decode the category parameter to handle URL encoding
    const decodedCategory = decodeURIComponent(category);
    console.log('Backend: Searching for category:', decodedCategory);
    
    // Use case-insensitive regex search to handle any case variations
    const products = await Product.find({ 
      category: { $regex: new RegExp(`^${decodedCategory}$`, 'i') } 
    }).sort({ createdAt: -1 });
    
    console.log('Backend: Found', products.length, 'products for category:', decodedCategory);
    
    res.json(products);
  } catch (error) {
    console.error('Backend error fetching products by category:', error);
    res.status(500).json({ error: 'Error fetching products by category' });
  }
}; 