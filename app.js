const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const Question = require("./schema");

const app = express();
app.use(cors());
app.use(express.json());

const seedQuestions = [
  {
    question: "Which language is primarily used to style web pages?",
    options: ["HTML", "CSS", "JavaScript", "SQL"],
    correctAnswer: 1,
  },
  {
    question: "Which JavaScript method adds an item to the end of an array?",
    options: ["pop()", "shift()", "push()", "unshift()"],
    correctAnswer: 2,
  },
  {
    question: "What does MongoDB store data as?",
    options: ["Tables", "BSON documents", "CSV rows", "XML files"],
    correctAnswer: 1,
  },
  {
    question: "Which HTTP method is commonly used to create a resource?",
    options: ["GET", "POST", "TRACE", "HEAD"],
    correctAnswer: 1,
  },
  {
    question: "Which hook manages state in a React function component?",
    options: ["useState", "useFetch", "useStyle", "useServer"],
    correctAnswer: 0,
  },
];

async function seedIfEmpty() {
  if ((await Question.countDocuments()) === 0) {
    await Question.insertMany(seedQuestions);
    console.log("Seeded sample examination questions.");
  }
}

app.get("/api/questions", async (req, res, next) => {
  try {
    const questions = await Question.aggregate([
      { $sample: { size: 10 } },
      { $project: { question: 1, options: 1 } },
    ]);
    res.json(questions);
  } catch (error) {
    next(error);
  }
});

app.post("/api/questions", async (req, res, next) => {
  try {
    const { question, options, correctAnswer } = req.body;
    const created = await Question.create({ question, options, correctAnswer });
    res.status(201).json({ _id: created._id, question, options });
  } catch (error) {
    next(error);
  }
});

app.post("/api/submit", async (req, res, next) => {
  try {
    const answers = req.body.answers;
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return res.status(400).json({ message: "Answers are required." });
    }

    const ids = Object.keys(answers);
    const questions = await Question.find({ _id: { $in: ids } });
    const results = [];
    let score = 0;

    for (const question of questions) {
      const submittedIndex = Number(answers[question._id.toString()]);
      const isCorrect = Number.isInteger(submittedIndex) && submittedIndex === question.correctAnswer;
      if (isCorrect) score += 1;
      results.push({
        questionId: question._id,
        question: question.question,
        selectedAnswer: submittedIndex,
        correctAnswer: question.correctAnswer,
        isCorrect,
        options: question.options,
      });
    }

    res.json({
      score,
      total: questions.length,
      percentage: questions.length ? Math.round((score / questions.length) * 100) : 0,
      results,
    });
  } catch (error) {
    next(error);
  }
});

const clientDist = path.join(__dirname, "client", "dist");
app.use(express.static(clientDist));
app.get("/{*path}", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(clientDist, "index.html"), (error) => {
    if (error) next(error);
  });
});

app.use((error, req, res, next) => {
  const status = error.name === "ValidationError" ? 400 : 500;
  res.status(status).json({ message: error.message || "Server error" });
});

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/examination-app";
const port = process.env.PORT || 8080;

mongoose
  .connect(mongoUri)
  .then(async () => {
    await seedIfEmpty();
    app.listen(port, () => console.log(`Examination server listening on port ${port}`));
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });