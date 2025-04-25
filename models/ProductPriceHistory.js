const mongoose = require('mongoose');

const ProductPriceHistorySchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    index: true
  },
  price: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index on productId and timestamp
ProductPriceHistorySchema.index({ productId: 1, timestamp: -1 });

module.exports = mongoose.model('ProductPriceHistory', ProductPriceHistorySchema);