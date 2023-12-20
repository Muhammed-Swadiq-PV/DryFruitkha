const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    image: [String],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'category',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
  });

  productSchema.virtual('categoryDetails', {
    ref: 'category',
    localField: 'category',
    foreignField: '_id',
    justOne: true,
});
  

module.exports = mongoose.model('products',productSchema)

