const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const bodyAuth = require('../middleware/bodyAuth');
const User = require('../models/User');
const WishlistItem = require('../models/WishlistItem');

// In-memory storage for testing without MongoDB
const inMemoryWishlist = [];

// @route   POST api/wishlist
// @desc    Add a product to wishlist
// @access  Private
router.post('/', bodyAuth, async (req, res) => {
  try {
    const { merchantId, productId, token } = req.body;

    // Validate required fields
    if (!merchantId || !productId) {
      return res.status(400).json({ msg: 'Merchant ID and Product ID are required' });
    }

    // Check if MongoDB is connected
    if (global.isMongoDBConnected) {
      try {
        // Check if the item already exists in the user's wishlist
        const existingItem = await WishlistItem.findOne({
          phone: req.user.phone,
          merchantId,
          productId
        });

        if (existingItem) {
          return res.status(400).json({ msg: 'Item already in wishlist' });
        }

        // Create a new wishlist item
        const newWishlistItem = new WishlistItem({
          phone: req.user.phone,
          merchantId,
          productId
        });

        const wishlistItem = await newWishlistItem.save();
        return res.json(wishlistItem);
      } catch (dbError) {
        console.warn('Database operation failed:', dbError.message);
        // Fall through to in-memory storage
      }
    }
    
    // Use in-memory storage
    const existingItemIndex = inMemoryWishlist.findIndex(
      item => item.phone === req.user.phone &&
             item.merchantId === merchantId &&
             item.productId === productId
    );

    if (existingItemIndex !== -1) {
      return res.status(400).json({ msg: 'Item already in wishlist' });
    }

    const newWishlistItem = {
      id: Date.now().toString(),
      phone: req.user.phone,
      merchantId,
      productId,
      addedAt: new Date()
    };

    inMemoryWishlist.push(newWishlistItem);
    res.json(newWishlistItem);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/wishlist (GET functionality)
// @desc    Get all wishlist items for a user
// @access  Private
router.post('/get', bodyAuth, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (global.isMongoDBConnected) {
      try {
        const wishlistItems = await WishlistItem.find({ phone: req.user.phone }).sort({ addedAt: -1 });
        return res.json(wishlistItems);
      } catch (dbError) {
        console.warn('Database operation failed:', dbError.message);
        // Fall through to in-memory storage
      }
    }
    
    // Use in-memory storage
    const userWishlistItems = inMemoryWishlist.filter(item => item.phone === req.user.phone)
      .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    
    res.json(userWishlistItems);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/wishlist/merchant (GET functionality)
// @desc    Get all wishlist items for a user from a specific merchant
// @access  Private
router.post('/merchant', bodyAuth, async (req, res) => {
  try {
    const { merchantId } = req.body;
    
    if (!merchantId) {
      return res.status(400).json({ msg: 'Merchant ID is required' });
    }
    
    // Check if MongoDB is connected
    if (global.isMongoDBConnected) {
      try {
        const wishlistItems = await WishlistItem.find({
          phone: req.user.phone,
          merchantId
        }).sort({ addedAt: -1 });
        
        return res.json(wishlistItems);
      } catch (dbError) {
        console.warn('Database operation failed:', dbError.message);
        // Fall through to in-memory storage
      }
    }
    
    // Use in-memory storage
    const merchantWishlistItems = inMemoryWishlist.filter(
      item => item.phone === req.user.phone && item.merchantId === merchantId
    ).sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    
    res.json(merchantWishlistItems);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/wishlist/delete/:id (DELETE functionality)
// @desc    Delete a wishlist item
// @access  Private
router.post('/delete/:id', bodyAuth, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (global.isMongoDBConnected) {
      try {
        const wishlistItem = await WishlistItem.findById(req.params.id);

        if (!wishlistItem) {
          // Item not found in MongoDB, try in-memory storage
          // Fall through to in-memory storage
        } else {
          // Check if the user owns the wishlist item
          if (wishlistItem.phone !== req.user.phone) {
            return res.status(401).json({ msg: 'User not authorized' });
          }

          await wishlistItem.deleteOne();
          return res.json({ msg: 'Wishlist item removed' });
        }
      } catch (dbError) {
        console.warn('Database operation failed:', dbError.message);
        // Fall through to in-memory storage
      }
    }
    
    // Use in-memory storage
    const itemIndex = inMemoryWishlist.findIndex(item => item.id === req.params.id);
    
    if (itemIndex === -1) {
      return res.status(404).json({ msg: 'Wishlist item not found' });
    }
    
    // Check if the user owns the wishlist item
    if (inMemoryWishlist[itemIndex].phone !== req.user.phone) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    inMemoryWishlist.splice(itemIndex, 1);
    
    res.json({ msg: 'Wishlist item removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Wishlist item not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/wishlist/interested
// @desc    Get the number of people interested in a product
// @access  Public
router.post('/interested', async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ msg: 'Product ID is required' });
    }

    // Check if MongoDB is connected
    if (global.isMongoDBConnected) {
      try {
        // Count the number of unique users who have added this product to their wishlist
        const uniqueUsers = await WishlistItem.distinct('phone', { productId });
        return res.json({ count: uniqueUsers.length });
      } catch (dbError) {
        console.warn('Database operation failed:', dbError.message);
        // Fall through to in-memory storage
      }
    }
    
    // Use in-memory storage
    // Get unique phone numbers who have added this product to their wishlist
    const uniqueUsers = new Set();
    inMemoryWishlist.forEach(item => {
      if (item.productId === productId) {
        uniqueUsers.add(item.phone);
      }
    });
    
    res.json({ count: uniqueUsers.size });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;