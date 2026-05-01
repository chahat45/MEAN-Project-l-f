const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Item = require('../models/Item');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    res.json({
      totalUsers:   await User.countDocuments({ role: 'user' }),
      totalItems:   await Item.countDocuments(),
      openItems:    await Item.countDocuments({ status: 'open' }),
      claimedItems: await Item.countDocuments({ status: 'claimed' }),
      lostItems:    await Item.countDocuments({ type: 'lost' }),
      foundItems:   await Item.countDocuments({ type: 'found' })
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    res.json(await User.find({}).select('-password').sort({ createdAt: -1 }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot delete admin' });
    await Item.deleteMany({ reportedBy: req.params.id });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User and their items deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/items', protect, adminOnly, async (req, res) => {
  try {
    res.json(await Item.find({}).populate('reportedBy', 'name email').populate('claimedBy', 'name email').sort({ createdAt: -1 }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/items/:id', protect, adminOnly, async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;