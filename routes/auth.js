const express = require("express");
const router = express.Router();
const User = require("../models/user");

// Register
router.post("/register", async (req, res) => {

  const { rollNo, password, role } = req.body;

  try {
    const existing = await User.findOne({ rollNo });

    if (existing) {
      return res.send("User already exists");
    }

    const user = new User({ rollNo, password, role });
    await user.save();

    res.send("User registered");

  } catch (err) {
    res.status(500).send(err);
  }

});

// Login
router.post("/login", async (req, res) => {

  const { rollNo, password } = req.body;

  try {
    const user = await User.findOne({ rollNo, password });

    if (!user) {
      return res.send("Invalid credentials");
    }

    res.json({
      message: "Login successful",
      role: user.role
    });

  } catch (err) {
    res.status(500).send(err);
  }

});

module.exports = router;