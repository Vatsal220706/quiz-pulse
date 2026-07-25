const express = require('express');
const router = express.Router();
const Doubt = require('../models/Doubt');
const User = require('../models/User');
const Course = require('../models/Course');
const { protect } = require('../middleware/auth');

router.use(protect);

// ─── CREATE DOUBT (Student) ────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { title, question, courseId } = req.body;

    if (!title || !question) {
      return res.status(400).json({ message: 'Title and question are required' });
    }

    const doubt = await Doubt.create({
      student: req.user.id,
      title,
      question,
      course: courseId || null,
      status: 'pending',
    });

    const populated = await Doubt.findById(doubt._id)
      .populate('student', 'name email')
      .populate('course', 'title');

    res.status(201).json({ doubt: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET ALL DOUBTS (Filtered by role) ────────────────────────
router.get('/', async (req, res) => {
  try {
    const isTeacher = req.user.role === 'teacher';
    const query = isTeacher ? {} : { student: req.user.id };

    const doubts = await Doubt.find(query)
      .sort({ createdAt: -1 })
      .populate('student', 'name email role')
      .populate('course', 'title');

    res.json({ doubts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── ADD REPLY TO DOUBT (Teacher / Student) ────────────────────
router.post('/:id/reply', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Reply message cannot be empty' });
    }

    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) {
      return res.status(404).json({ message: 'Doubt not found' });
    }

    const user = await User.findById(req.user.id);

    doubt.replies.push({
      sender: req.user.id,
      senderRole: user.role,
      senderName: user.name,
      message: message.trim(),
      createdAt: new Date(),
    });

    // If teacher replies, mark as resolved automatically (or teacher can toggle)
    if (user.role === 'teacher') {
      doubt.status = 'resolved';
    }

    await doubt.save();

    const updated = await Doubt.findById(req.params.id)
      .populate('student', 'name email role')
      .populate('course', 'title');

    res.json({ doubt: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── UPDATE DOUBT STATUS (Teacher / Owner) ────────────────────
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) {
      return res.status(404).json({ message: 'Doubt not found' });
    }

    doubt.status = status;
    await doubt.save();

    const updated = await Doubt.findById(req.params.id)
      .populate('student', 'name email role')
      .populate('course', 'title');

    res.json({ doubt: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── DELETE DOUBT ──────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) {
      return res.status(404).json({ message: 'Doubt not found' });
    }

    // Only teacher or owner student can delete
    if (req.user.role !== 'teacher' && doubt.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this doubt' });
    }

    await Doubt.findByIdAndDelete(req.params.id);
    res.json({ message: 'Doubt deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
