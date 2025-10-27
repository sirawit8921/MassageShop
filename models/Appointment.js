const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  massageShop: { 
    type: mongoose.Schema.ObjectId,
    ref: 'MassageShop',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Please provide an appointment date']
  },
  status: {
    type: String,
    enum: ['booked', 'completed', 'cancelled'],
    default: 'booked'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
