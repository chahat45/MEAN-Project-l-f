const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema({

  name: String,
  description: String,
  location: String,

  status: {
    type: String,
    default: "Lost"
  },

  reward: {
    type: Number,
    default: 0
  },

  image: String, // store image URL or base64

  gmapLink: String, // optional

  createdBy: String, // rollNo of user

  foundBy: String,

  collectionVenue: String,
  qrCode: String, // image or text

  confirmByOwner: { type: Boolean, default: false },
  confirmByFinder: { type: Boolean, default: false }

}, { timestamps: true });

module.exports = mongoose.model("Item", ItemSchema);