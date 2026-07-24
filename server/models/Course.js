const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  link: {
    type: String,
    required: true,
    trim: true,
  },
  sequence: {
    type: Number,
    required: true,
  },
  thumbnail: {
    type: String,
    default: '',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-extract YouTube thumbnail from link before saving
courseSchema.pre('save', function (next) {
  if (this.isModified('link') || !this.thumbnail) {
    this.thumbnail = extractThumbnail(this.link);
  }
  next();
});

function extractThumbnail(url) {
  try {
    // YouTube: youtube.com/watch?v=ID or youtu.be/ID
    let videoId = null;
    if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      videoId = urlObj.searchParams.get('v');
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split(/[?&#]/)[0];
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('youtube.com/embed/')[1]?.split(/[?&#]/)[0];
    }

    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
  } catch (e) {
    // ignore
  }
  return '';
}

// Index for ordering
courseSchema.index({ createdBy: 1, sequence: 1 });

module.exports = mongoose.model('Course', courseSchema);
