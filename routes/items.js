const express = require("express");
const router = express.Router();
const Item = require("../models/item");

router.post("/add", async (req, res) => {

  const item = new Item(req.body);

  try {
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).send(error);
  }

});

router.get("/all", async (req, res) => {

  try {
    const items = await Item.find();
    res.json(items);
  } catch (error) {
    res.status(500).send(error);
  }

});

router.put("/update/:id", async (req, res) => {

  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(item);

  } catch (error) {
    res.status(500).send(error);
  }

});

router.delete("/delete/:id", async (req, res) => {

  try {
    await Item.findByIdAndDelete(req.params.id);
    res.send("Item Deleted");

  } catch (error) {
    res.status(500).send(error);
  }

});

module.exports = router;