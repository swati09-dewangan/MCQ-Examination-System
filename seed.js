const mongoose = require("mongoose");
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();

const Question = require("./schema");

const mongoUri =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/examination-app";

async function seedDatabase() {
  await mongoose.connect(mongoUri);
  const dataPath = path.join(__dirname, "data", "questions.json");
  const questions = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  await Question.deleteMany({});
  const inserted = await Question.insertMany(questions);
  console.log(`Stored ${inserted.length} questions in ${mongoose.connection.name}.`);
  await mongoose.disconnect();
}

seedDatabase().catch(async (error) => {
  console.error("Database seeding failed:", error.message);
  await mongoose.disconnect();
  process.exit(1);
});
