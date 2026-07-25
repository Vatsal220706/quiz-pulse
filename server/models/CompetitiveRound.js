const mongoose = require('mongoose');

const competitiveQuestionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
  },
  correctOptionIndex: {
    type: Number,
    required: true,
    min: 0,
    max: 3,
  },
  timeLimit: {
    type: Number,
    default: 30,
  },
});

const competitiveResponseSchema = new mongoose.Schema({
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
  responseMs: {
    type: Number, // milliseconds taken from start to submit
    default: 0,
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
  pointsAwarded: {
    type: Number,
    default: 0,
  },
  speedRank: {
    type: Number,
    default: 0,
  },
});

const competitiveRoundSchema = new mongoose.Schema({
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
  questions: [competitiveQuestionSchema],
  currentQuestionIndex: {
    type: Number,
    default: -1,
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
  responses: [competitiveResponseSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('CompetitiveRound', competitiveRoundSchema);
