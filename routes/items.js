const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Item = require('../models/Item');
const { protect } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Public - get all open items
router.get('/', async (req, res) => {
  try {
    const { type, category, search } = req.query;
    let q = { status: 'open' };
    if (type) q.type = type;
    if (category) q.category = category;
    if (search) q.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } }
    ];
    const items = await Item.find(q).populate('reportedBy', 'name email phone').sort({ createdAt: -1 });
    res.json(items);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// My items
router.get('/my', protect, async (req, res) => {
  try {
    const items = await Item.find({ reportedBy: req.user._id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Single item
router.get('/:id', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('reportedBy', 'name email phone')
      .populate('claimedBy', 'name email phone');
    if (!item) return res.status(404).json({ message: 'Not found' });
    const isReporter = item.reportedBy._id.toString() === req.user._id.toString();
    if (!isReporter && req.user.role !== 'admin') item.internalMessage = undefined;
    res.json(item);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Create item
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { title, description, type, category, location, date, reward, internalMessage } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : '';
    const item = await Item.create({ title, description, type, category, location, date: new Date(date), reward, internalMessage, image, reportedBy: req.user._id });
    res.status(201).json(item);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Update item
router.put('/:id', protect, upload.single('image'), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    const isReporter = item.reportedBy.toString() === req.user._id.toString();
    if (!isReporter && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
    const fields = ['title','description','category','location','reward','status','venueOfCollection','internalMessage'];
    fields.forEach(f => { if (req.body[f] !== undefined) item[f] = req.body[f]; });
    if (req.body.date) item.date = new Date(req.body.date);
    if (req.file) item.image = `/uploads/${req.file.filename}`;
    await item.save();
    res.json(item);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Claim item
router.post('/:id/claim', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    if (item.status !== 'open') return res.status(400).json({ message: 'Already claimed' });
    if (item.reportedBy.toString() === req.user._id.toString()) return res.status(400).json({ message: 'Cannot claim your own item' });
    item.status = 'claimed';
    item.claimedBy = req.user._id;
    item.reporterConfirmed = false;
    item.claimerConfirmed = false;
    await item.save();
    res.json(item);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Confirm resolution
router.post('/:id/confirm', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    if (item.status !== 'claimed') return res.status(400).json({ message: 'Must be claimed first' });
    const uid = req.user._id.toString();
    if (item.reportedBy.toString() === uid) item.reporterConfirmed = true;
    else if (item.claimedBy?.toString() === uid) item.claimerConfirmed = true;
    else return res.status(403).json({ message: 'Not authorized' });
    if (item.reporterConfirmed && item.claimerConfirmed) {
      await Item.findByIdAndDelete(item._id);
      return res.json({ resolved: true, message: 'Item resolved! Listing removed. 🎉' });
    }
    await item.save();
    res.json({ resolved: false, message: 'Your confirmation saved. Waiting for other party.', item });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Delete item
router.delete('/:id', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    if (item.reportedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;