const express = require('express');
const router = express.Router();
const CompetitiveRound = require('../models/CompetitiveRound');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const Course = require('../models/Course');

router.use(protect);

function generateBattleCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CR-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ─── AI QUESTION GENERATOR ENDPOINT (Competitive) ─────────────
router.post('/generate-ai', async (req, res) => {
  try {
    const { courseId, courseTitle, dayCount = 3, sequence = 1 } = req.body;
    
    let title = courseTitle || `Course #${sequence}`;
    let days = Math.max(1, Number(dayCount) || 3);
    let sequenceNum = Number(sequence) || 1;

    if (courseId) {
      const foundCourse = await Course.findById(courseId);
      if (foundCourse) {
        title = foundCourse.title;
        sequenceNum = foundCourse.sequence;
      }
    }

    const t = title.trim();
    const lower = t.toLowerCase();

    let domain = 'Web Application Development';
    let term1 = 'Core Syntax & Principles';
    let term2 = 'State & Lifecycle Hooks';
    let term3 = 'Data Flow & Components';

    if (lower.includes('react')) {
      domain = 'React Frontend Engineering';
      term1 = 'JSX Elements & Component State';
      term2 = 'Hooks (useState, useEffect)';
      term3 = 'Props & State Flow';
    } else if (lower.includes('javascript') || lower.includes('js')) {
      domain = 'JavaScript Programming';
      term1 = 'Variables & Scope (let/const)';
      term2 = 'Async/Await & Promises';
      term3 = 'DOM Manipulation & Event Loop';
    } else if (lower.includes('python')) {
      domain = 'Python Programming';
      term1 = 'Data Structures & Lists/Dicts';
      term2 = 'Functions & Object-Oriented Design';
      term3 = 'Modules & Package Ecosystem';
    } else if (lower.includes('node') || lower.includes('express')) {
      domain = 'Node.js & Express Backend';
      term1 = 'HTTP Routing & Middleware';
      term2 = 'Event Emitter & Async I/O';
      term3 = 'REST APIs & Security';
    } else if (lower.includes('css') || lower.includes('html') || lower.includes('style')) {
      domain = 'HTML5 & Modern CSS Layouts';
      term1 = 'Semantic Elements & DOM Tree';
      term2 = 'Flexbox & CSS Grid';
      term3 = 'Responsive Design & Media Queries';
    } else if (lower.includes('sql') || lower.includes('db') || lower.includes('mongo')) {
      domain = 'Database Design & Queries';
      term1 = 'Schema Definitions & Indexes';
      term2 = 'Query Execution & Aggregation';
      term3 = 'Data Integrity & Transactions';
    } else if (lower.includes('java') || lower.includes('c++') || lower.includes('dsa') || lower.includes('algorithm')) {
      domain = 'Data Structures & Algorithms';
      term1 = 'Time & Space Complexity (Big O)';
      term2 = 'Arrays, Trees & Graphs';
      term3 = 'Sorting & Searching Algorithms';
    }

    const rawQuestions = [
      {
        q: (d) => `[Day ${d}] Fundamentals of "${t}": What is the primary purpose of this course?`,
        opts: [
          `Mastering core concepts and practical application of ${domain}`,
          `Writing low-level hardware machine drivers`,
          `Disabling browser security protocols`,
          `Bypassing network firewall settings`,
        ],
        ans: 0,
      },
      {
        q: (d) => `[Day ${d}] Course Core Principle: Which feature is central to "${t}"?`,
        opts: [
          `Clean modular structure and ${term1}`,
          `Hardcoding static binary values in every file`,
          `Executing single-threaded blocking infinite loops`,
          `Disabling console error reporting`,
        ],
        ans: 0,
      },
      {
        q: (d) => `[Day ${d}] Course Concepts (${term1}): How is "${term1}" implemented in "${t}"?`,
        opts: [
          `By using global un-scoped variables everywhere`,
          `Following modular, scoped definitions and standard conventions`,
          `By modifying system registry entries`,
          `Through manual C++ memory pointers`,
        ],
        ans: 1,
      },
      {
        q: (d) => `[Day ${d}] Course Architecture: What is the recommended project structure for "${t}"?`,
        opts: [
          `Putting all application logic inside a single giant file`,
          `Organizing code into reusable components, modules, and clear layers`,
          `Storing passwords in plain text source files`,
          `Avoiding function definitions`,
        ],
        ans: 1,
      },
      {
        q: (d) => `[Day ${d}] Course Key Feature (${term2}): Why is "${term2}" essential in "${t}"?`,
        opts: [
          `It intentionally delays execution times`,
          `It manages dynamic updates, state transitions, and component behavior efficiently`,
          `It formats operating system hard drives`,
          `It disables user keyboard interactions`,
        ],
        ans: 1,
      },
      {
        q: (d) => `[Day ${d}] Data Handling in "${t}" (${term3}): How should data flow between modules?`,
        opts: [
          `By mutating global objects without isolation`,
          `By passing explicit parameters/props and maintaining predictable data flow`,
          `By saving data to temporary text files on Desktop`,
          `Via synchronous blocking thread delays`,
        ],
        ans: 1,
      },
      {
        q: (d) => `[Day ${d}] Performance in "${t}": Which practice optimizes application speed in "${t}"?`,
        opts: [
          `Re-calculating heavy computations on every single render cycle`,
          `Caching expensive operations and avoiding unnecessary re-renders`,
          `Using infinite recursive polling loops`,
          `Disabling HTTP browser headers`,
        ],
        ans: 1,
      },
      {
        q: (d) => `[Day ${d}] Error Handling: How should exceptions be managed in "${t}"?`,
        opts: [
          `Ignore all errors and swallow exceptions silently`,
          `Use structured error handlers or try/catch blocks to handle failures gracefully`,
          `Terminate the server process on any user input error`,
          `Hardcode fallback 0 values everywhere`,
        ],
        ans: 1,
      },
      {
        q: (d) => `[Day ${d}] Testing & Debugging: How can you verify your "${t}" code works correctly?`,
        opts: [
          `Deleting code lines until it stops throwing errors`,
          `Using developer tools, unit tests, and inspecting execution state`,
          `Restarting the computer repeatedly`,
          `Commenting out broken code permanently`,
        ],
        ans: 1,
      },
      {
        q: (d) => `[Day ${d}] Course Review: What is the main outcome after completing "${t}"?`,
        opts: [
          `Ability to confidently design, build, and deploy real-world projects in ${domain}`,
          `Understanding how to format BIOS firmware`,
          `Ability to write CSS inside Python files`,
          `Knowledge of raw microchip pin layouts`,
        ],
        ans: 0,
      },
    ];

    const generatedQuestions = rawQuestions.map((item, idx) => {
      const assignedDay = Math.min(days, Math.floor((idx / 10) * days) + 1);
      return {
        questionText: item.q(assignedDay),
        options: item.opts,
        correctOptionIndex: item.ans,
        timeLimit: 30,
      };
    });

    res.json({
      title: `${t} (Speed Battle Challenge)`,
      questions: generatedQuestions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── CREATE COMPETITIVE ROUND (Teacher) ───────────────────────
router.post('/', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create competitive rounds' });
    }

    const { title, questions } = req.body;
    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Title and at least 1 question are required' });
    }

    let roomCode = generateBattleCode();
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const existing = await CompetitiveRound.findOne({ roomCode });
      if (!existing) {
        isUnique = true;
      } else {
        roomCode = generateBattleCode();
        attempts++;
      }
    }

    const round = await CompetitiveRound.create({
      title,
      roomCode,
      teacher: req.user.id,
      questions,
    });

    res.status(201).json({ round });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET TEACHER'S COMPETITIVE ROUNDS ──────────────────────────
router.get('/teacher', async (req, res) => {
  try {
    const rounds = await CompetitiveRound.find({ teacher: req.user.id })
      .sort({ createdAt: -1 })
      .populate('participants', 'name email');
    res.json({ rounds });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── JOIN COMPETITIVE ROUND (Student) ──────────────────────────
router.post('/join', async (req, res) => {
  try {
    const { roomCode } = req.body;
    if (!roomCode) {
      return res.status(400).json({ message: 'Room code is required' });
    }

    const formattedCode = roomCode.trim().toUpperCase();
    const round = await CompetitiveRound.findOne({ roomCode: formattedCode });

    if (!round) {
      return res.status(404).json({ message: 'Competitive round not found. Check code and try again.' });
    }

    if (!round.participants.includes(req.user.id)) {
      round.participants.push(req.user.id);
      await round.save();
    }

    res.json({ round });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── LAUNCH QUESTION (Teacher) ─────────────────────────────────
router.post('/:id/launch-question', async (req, res) => {
  try {
    const round = await CompetitiveRound.findById(req.params.id);
    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    if (round.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only host teacher can launch questions' });
    }

    const { questionIndex } = req.body;
    const qIndex = Number(questionIndex);

    if (qIndex < 0 || qIndex >= round.questions.length) {
      return res.status(400).json({ message: 'Invalid question index' });
    }

    round.currentQuestionIndex = qIndex;
    round.currentQuestionStartTime = new Date();
    round.status = 'active';

    await round.save();

    res.json({ round });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── SUBMIT ANSWER & RELATIVE POINTS CALCULATION ──────────────
router.post('/:id/submit-answer', async (req, res) => {
  try {
    const round = await CompetitiveRound.findById(req.params.id);
    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    if (round.currentQuestionIndex < 0) {
      return res.status(400).json({ message: 'No active question' });
    }

    const { selectedOption } = req.body;
    const optionIdx = Number(selectedOption);
    const qIdx = round.currentQuestionIndex;
    const currentQ = round.questions[qIdx];
    const isCorrect = optionIdx === currentQ.correctOptionIndex;

    const responseMs = round.currentQuestionStartTime
      ? Math.max(100, Date.now() - new Date(round.currentQuestionStartTime).getTime())
      : 1000;

    // Check existing response
    const existingIdx = round.responses.findIndex(
      (r) => r.student.toString() === req.user.id && r.questionIndex === qIdx
    );

    if (existingIdx !== -1) {
      round.responses[existingIdx].selectedOption = optionIdx;
      round.responses[existingIdx].isCorrect = isCorrect;
      round.responses[existingIdx].responseMs = responseMs;
      round.responses[existingIdx].submittedAt = new Date();
    } else {
      round.responses.push({
        student: req.user.id,
        questionIndex: qIdx,
        selectedOption: optionIdx,
        isCorrect,
        responseMs,
      });
    }

    // Recalculate Speed Ranks & Relative Points for all correct responders on current question
    const correctResponses = round.responses.filter(
      (r) => r.questionIndex === qIdx && r.isCorrect
    );

    // Sort by responseMs ascending (fastest first)
    correctResponses.sort((a, b) => a.responseMs - b.responseMs);

    let fastestMs = 0;
    if (correctResponses.length > 0) {
      fastestMs = correctResponses[0].responseMs;
    }

    let userPointsAwarded = 0;

    // Assign relative points: 1st fastest gets 100 PTS, others get points relative to fastestMs
    for (let i = 0; i < correctResponses.length; i++) {
      const resp = correctResponses[i];
      resp.speedRank = i + 1;

      if (i === 0) {
        resp.pointsAwarded = 100; // 1st fastest gets FULL 100 POINTS
      } else {
        // Relative score: 100 * (fastestMs / studentMs), with minimum 50 pts
        const ratio = fastestMs / resp.responseMs;
        resp.pointsAwarded = Math.max(50, Math.round(100 * ratio));
      }

      if (resp.student.toString() === req.user.id) {
        userPointsAwarded = resp.pointsAwarded;
      }
    }

    // Set 0 points for incorrect responses on this question
    round.responses.forEach((r) => {
      if (r.questionIndex === qIdx && !r.isCorrect) {
        r.pointsAwarded = 0;
        r.speedRank = 0;
      }
    });

    await round.save();

    // Update student user stats in MongoDB
    const studentUser = await User.findById(req.user.id);
    if (studentUser && studentUser.role === 'student' && isCorrect) {
      studentUser.points = (studentUser.points || 0) + userPointsAwarded;
      studentUser.correctAnswers = (studentUser.correctAnswers || 0) + 1;
      studentUser.totalAnswers = (studentUser.totalAnswers || 0) + 1;
      await studentUser.save();
    }

    res.json({
      message: 'Answer recorded',
      isCorrect,
      responseMs,
      pointsAwarded: userPointsAwarded,
      isFastest: correctResponses[0]?.student.toString() === req.user.id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET STATUS & SPEED STANDINGS ──────────────────────────────
router.get('/:id/status', async (req, res) => {
  try {
    const round = await CompetitiveRound.findById(req.params.id)
      .populate('participants', 'name email')
      .populate('responses.student', 'name email');

    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    const isTeacher = round.teacher.toString() === req.user.id;
    const currentQIndex = round.currentQuestionIndex;
    const currentQuestion = currentQIndex >= 0 ? round.questions[currentQIndex] : null;

    let secondsRemaining = 0;
    if (currentQuestion && round.currentQuestionStartTime) {
      const elapsedSecs = Math.floor((new Date() - new Date(round.currentQuestionStartTime)) / 1000);
      secondsRemaining = Math.max(0, (currentQuestion.timeLimit || 30) - elapsedSecs);
    }

    let studentResponse = null;
    if (!isTeacher && currentQIndex >= 0) {
      studentResponse = round.responses.find(
        (r) => r.student && r.student._id.toString() === req.user.id && r.questionIndex === currentQIndex
      );
    }

    // Speed Standings for current question
    const speedStandings = [];
    if (currentQIndex >= 0) {
      round.responses
        .filter((r) => r.questionIndex === currentQIndex && r.isCorrect)
        .sort((a, b) => a.responseMs - b.responseMs)
        .forEach((r) => {
          speedStandings.push({
            rank: r.speedRank,
            studentName: r.student?.name || 'Student',
            responseSeconds: (r.responseMs / 1000).toFixed(2),
            pointsAwarded: r.pointsAwarded,
            isFastest: r.speedRank === 1,
          });
        });
    }

    res.json({
      round: {
        _id: round._id,
        title: round.title,
        roomCode: round.roomCode,
        status: round.status,
        totalQuestions: round.questions.length,
        currentQuestionIndex: currentQIndex,
        participantsCount: round.participants.length,
        participants: round.participants,
      },
      currentQuestion: currentQuestion
        ? {
            index: currentQIndex,
            questionText: currentQuestion.questionText,
            options: currentQuestion.options,
            timeLimit: currentQuestion.timeLimit || 30,
            ...(isTeacher || secondsRemaining === 0 ? { correctOptionIndex: currentQuestion.correctOptionIndex } : {}),
          }
        : null,
      secondsRemaining,
      studentResponse,
      speedStandings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET BATTLE QUESTION-BY-QUESTION REVIEW FOR STUDENT ────────
router.get('/:id/review', async (req, res) => {
  try {
    const round = await CompetitiveRound.findById(req.params.id)
      .populate('responses.student', 'name email');

    if (!round) {
      return res.status(404).json({ message: 'Competitive round not found' });
    }

    let totalPointsEarned = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let fastestWinsCount = 0;

    const questionReviews = round.questions.map((q, qIdx) => {
      const studentResp = round.responses.find(
        (r) => r.student && r.student._id.toString() === req.user.id && r.questionIndex === qIdx
      );

      let status = 'unanswered';
      let selectedOption = null;
      let selectedOptionText = null;
      let isCorrect = false;
      let pointsAwarded = 0;
      let speedRank = 0;
      let responseSeconds = null;

      if (studentResp) {
        selectedOption = studentResp.selectedOption;
        selectedOptionText = q.options[selectedOption] || null;
        isCorrect = studentResp.isCorrect;
        pointsAwarded = studentResp.pointsAwarded || 0;
        speedRank = studentResp.speedRank || 0;
        responseSeconds = studentResp.responseMs ? (studentResp.responseMs / 1000).toFixed(2) : null;

        if (isCorrect) {
          correctCount++;
          totalPointsEarned += pointsAwarded;
          if (speedRank === 1) {
            status = 'fastest';
            fastestWinsCount++;
          } else {
            status = 'correct';
          }
        } else {
          incorrectCount++;
          status = 'incorrect';
        }
      } else {
        unansweredCount++;
        status = 'unanswered';
      }

      return {
        questionIndex: qIdx,
        questionText: q.questionText,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        correctOptionText: q.options[q.correctOptionIndex],
        selectedOption,
        selectedOptionText,
        isCorrect,
        pointsAwarded,
        speedRank,
        responseSeconds,
        status,
      };
    });

    res.json({
      roundSummary: {
        _id: round._id,
        title: round.title,
        roomCode: round.roomCode,
        totalQuestions: round.questions.length,
        totalPointsEarned,
        correctCount,
        incorrectCount,
        unansweredCount,
        fastestWinsCount,
      },
      questionReviews,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
