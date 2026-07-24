const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const CourseProgress = require('../models/CourseProgress');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// All routes are protected
router.use(protect);

// ─── CREATE COURSE (Teacher only) ──────────────────────────────
router.post('/', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create courses' });
    }

    const { title, link, sequence } = req.body;

    if (!title || !link || sequence === undefined) {
      return res.status(400).json({ message: 'Title, link, and sequence are required' });
    }

    const course = await Course.create({
      title,
      link,
      sequence: Number(sequence),
      createdBy: req.user.id,
    });

    res.status(201).json({ course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET ALL COURSES (sorted by sequence) ──────────────────────
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().sort({ sequence: 1 }).populate('createdBy', 'name');
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── UPDATE COURSE (Teacher only, own course) ──────────────────
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can update courses' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own courses' });
    }

    const { title, link, sequence } = req.body;
    if (title) course.title = title;
    if (link) course.link = link;
    if (sequence !== undefined) course.sequence = Number(sequence);

    await course.save(); // triggers pre-save for thumbnail
    res.json({ course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── DELETE COURSE (Teacher only, own course) ──────────────────
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can delete courses' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own courses' });
    }

    // Delete associated progress records
    await CourseProgress.deleteMany({ course: course._id });
    await Course.findByIdAndDelete(req.params.id);

    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── START COURSE (Student) ────────────────────────────────────
router.post('/:id/start', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can start courses' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check sequential unlock: all courses with lower sequence must be completed
    const previousCourses = await Course.find({ sequence: { $lt: course.sequence } });
    for (const prev of previousCourses) {
      const progress = await CourseProgress.findOne({
        student: req.user.id,
        course: prev._id,
        completed: true,
      });
      if (!progress) {
        return res.status(403).json({
          message: 'You must complete the previous courses first',
        });
      }
    }

    // Create or find existing progress
    let progress = await CourseProgress.findOne({
      student: req.user.id,
      course: course._id,
    });

    if (!progress) {
      progress = await CourseProgress.create({
        student: req.user.id,
        course: course._id,
      });
    }

    res.json({ progress });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── COMPLETE COURSE (Student) ─────────────────────────────────
router.post('/:id/complete', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can complete courses' });
    }

    const progress = await CourseProgress.findOne({
      student: req.user.id,
      course: req.params.id,
    });

    if (!progress) {
      return res.status(400).json({ message: 'You must start the course first' });
    }

    progress.completed = true;
    progress.completedAt = new Date();
    await progress.save();

    res.json({ progress });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET STUDENT PROGRESS ──────────────────────────────────────
router.get('/progress', async (req, res) => {
  try {
    const progress = await CourseProgress.find({ student: req.user.id });
    res.json({ progress });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
