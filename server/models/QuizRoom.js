const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
    validate: [arrayLimit, 'Question must have exactly 4 options'],
  },
  correctOptionIndex: {
    type: Number,
    required: true,
    min: 0,
    max: 3,
  },
  timeLimit: {
    type: Number,
    default: 30, // 30 seconds default
  },
});

function arrayLimit(val) {
  return val.length === 4;
}

const responseSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  questionIndex: {
    type: Number,
    required: true,
  },
  selectedOption: {
    type: Number,
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
});

const quizRoomSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  roomCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'ended'],
    default: 'waiting',
  },
  questions: [questionSchema],
  currentQuestionIndex: {
    type: Number,
    default: -1, // -1 means lobby/waiting to start
  },
  currentQuestionStartTime: {
    type: Date,
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  responses: [responseSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('QuizRoom', quizRoomSchema);
