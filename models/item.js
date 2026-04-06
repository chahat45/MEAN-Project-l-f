const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema({
  name: String,
  description: String,
  location: String,
  date: String,
  contact: String,
  status: String
});

module.exports = mongoose.model("Item", ItemSchema);