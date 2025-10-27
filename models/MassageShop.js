const mongoose = require('mongoose');

const MassageShopSchema = new mongoose.Schema({
  shopName: {
    type: String,
    required: [true, 'Please add a massage shop name']
  },
  address: {
    type: String,
    required: [true, 'Please add an address']
  },
  telephone: {
    type: String,
    required: [true, 'Please add a telephone number'],
    match: [/^[0-9]{9,15}$/, 'Please add a valid telephone number']
  },
  openTime: {
    type: String,
    required: [true, 'Please specify opening time']
  },
  closeTime: {
    type: String,
    required: [true, 'Please specify closing time']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

MassageShopSchema.virtual('appointments', {
  ref: 'Appointment',        
  localField: '_id',         
  foreignField: 'massageShop',
  justOne: false
});

module.exports = mongoose.model('MassageShop', MassageShopSchema);
