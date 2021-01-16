const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PaySchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'profile'
  },
  Amount: {
    type: Number,
    required: true
  },
  Description: {
    type: String,
    required: true
  },
  RefID: {//شماره پیگیری
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = Pay = mongoose.model('pay', PaySchema);