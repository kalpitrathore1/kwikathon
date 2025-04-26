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
  productIds: {
    type: [String],
    required: true,
    default: []
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for phone and merchantId
WishlistItemSchema.index({ phone: 1, merchantId: 1 }, { unique: true });

module.exports = mongoose.model('WishlistItem', WishlistItemSchema);