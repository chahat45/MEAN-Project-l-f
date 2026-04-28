const express = require("express");
const router = express.Router();
const Item = require("../models/item");

router.post("/add", async (req, res) => {

  console.log(req.body); // 👈 ADD THIS

  const newItem = new Item(req.body);
  await newItem.save();

  res.send("Item added");

});

router.get("/all", async (req, res) => {

  try {
     const items = await Item.find()
    .sort({ reward: -1, createdAt: -1 });

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

//new
router.put("/confirm/:id", async (req, res) => {

  const item = await Item.findById(req.params.id);

  if(req.body.user === item.createdBy){
    item.confirmByOwner = true;
  }

  if(req.body.user === item.foundBy){
    item.confirmByFinder = true;
  }

  // delete only when both confirmed
  if(item.confirmByOwner && item.confirmByFinder){
    await Item.findByIdAndDelete(req.params.id);
    return res.send("Item completed and deleted");
  }

  await item.save();

  res.send("Confirmation saved");
});

module.exports = router;