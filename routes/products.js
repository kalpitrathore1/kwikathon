const express = require('express');
const router = express.Router();
const ProductPriceHistory = require('../models/ProductPriceHistory');

// In-memory storage for testing without MongoDB
const inMemoryProductPriceHistory = [];

// @route   POST api/products/webhook
// @desc    Receive product updates from Shopify
// @access  Public (but should be secured in production with Shopify HMAC verification)
router.post('/webhook', async (req, res) => {
  try {
    // In a real implementation, you would verify the webhook request using Shopify HMAC
    // https://shopify.dev/apps/webhooks/configuration/https#step-5-verify-the-webhook

    console.log('Webhook request received:', req.body);
    const { id, price, title } = req.body;
    
    if (!id || price === undefined) {
      return res.status(400).json({ msg: 'Product ID and price are required' });
    }

    const productId = id.toString();
    const priceValue = parseFloat(price);

    // Check if MongoDB is connected
    if (global.isMongoDBConnected) {
      try {
        // Create a new price history entry
        const newPriceHistory = new ProductPriceHistory({
          productId,
          price: priceValue
        });

        await newPriceHistory.save();
      } catch (dbError) {
        console.warn('Database operation failed:', dbError.message);
        // Fall through to in-memory storage
      }
    }
    
    // Use in-memory storage as fallback
    const newEntry = {
      productId,
      price: priceValue,
      timestamp: new Date()
    };
    
    inMemoryProductPriceHistory.push(newEntry);
    
    console.log('Added price history entry:', newEntry);
    console.log('Current in-memory price history:', JSON.stringify(inMemoryProductPriceHistory, null, 2));
    
    // Return a 200 response to acknowledge receipt of the webhook
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/products/price-comparison
// @desc    Get price comparison for a product
// @access  Public
router.post('/price-comparison', async (req, res) => {
  try {
    const { productId, price } = req.body;
    console.log('Price comparison request received:', req.body);

    if (!productId) {
      return res.status(400).json({ msg: 'Product ID is required' });
    }

    if (price === undefined) {
      return res.status(400).json({ msg: 'Price is required' });
    }

    const currentPrice = parseFloat(price);

    let priceHistory = [];
    let lowestPrice = null;
    let isAllTimeLow = false;

    // Check if MongoDB is connected
    if (global.isMongoDBConnected) {
      try {
        // Get price history for the product, sorted by timestamp (newest first)
        priceHistory = await ProductPriceHistory.find({ productId })
          .sort({ timestamp: -1 })
          .lean();

        if (priceHistory.length > 0) {
          // Find the lowest price in history
          lowestPrice = Math.min(...priceHistory.map(entry => entry.price));
          
          // Check if current price is the all-time low
          isAllTimeLow = currentPrice <= lowestPrice;
        } else {
          // If no price history, the current price is the all-time low
          lowestPrice = currentPrice;
          isAllTimeLow = true;
        }
      } catch (dbError) {
        console.warn('Database operation failed:', dbError.message);
        // Fall through to in-memory storage
      }
    } else {
      // Use in-memory storage
      priceHistory = inMemoryProductPriceHistory
        .filter(entry => entry.productId === productId)
        .sort((a, b) => b.timestamp - a.timestamp);

      if (priceHistory.length > 0) {
        // Find the lowest price in history
        lowestPrice = Math.min(...priceHistory.map(entry => entry.price));
        
        // Check if current price is the all-time low
        isAllTimeLow = currentPrice <= lowestPrice;
      } else {
        // If no price history, the current price is the all-time low
        lowestPrice = currentPrice;
        isAllTimeLow = true;
      }
    }

    // Add the current price to the price history for display purposes only
    const displayPriceHistory = [
      { price: currentPrice, timestamp: new Date(), isCurrent: true },
      ...priceHistory.map(entry => ({
        price: entry.price,
        timestamp: entry.timestamp,
        isCurrent: false
      }))
    ];

    const responseData = {
      productId,
      currentPrice,
      lowestPrice,
      isAllTimeLow,
      priceHistory: displayPriceHistory
    };
    
    console.log('Price comparison response:', JSON.stringify(responseData, null, 2));
    
    return res.json(responseData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;