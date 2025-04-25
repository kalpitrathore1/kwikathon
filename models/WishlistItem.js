const mongoose = require('mongoose');

const WishlistItemSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    index: true
  },
  merchantId: {
    type: String,
    required: true
  },
  productId: {
    type: String,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure a user can't add the same product from the same merchant twice
WishlistItemSchema.index({ phone: 1, merchantId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('WishlistItem', WishlistItemSchema);