const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, required: true },
  type:        { type: String, enum: ['lost', 'found'], required: true },
  category:    { type: String, default: 'Other' },
  location:    { type: String, required: true },
  date:        { type: Date, required: true },
  image:       { type: String, default: '' },
  status:      { type: String, enum: ['open', 'claimed', 'resolved'], default: 'open' },
  reward:      { type: String, default: '' },
  venueOfCollection:  { type: String, default: '' },
  internalMessage:    { type: String, default: '' },
  reportedBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  claimedBy:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reporterConfirmed:  { type: Boolean, default: false },
  claimerConfirmed:   { type: Boolean, default: false },
  createdAt:          { type: Date, default: Date.now }
});

module.exports = mongoose.model('Item', itemSchema);