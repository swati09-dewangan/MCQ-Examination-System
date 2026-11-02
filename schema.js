const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (options) => options.length >= 2 && options.length <= 6,
        message: "A question must have between 2 and 6 options.",
      },
    },
    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

QuestionSchema.pre("validate", function () {
  if (this.correctAnswer >= this.options.length) {
    this.invalidate("correctAnswer", "Correct answer must point to an option.");
  }
});

module.exports = mongoose.model("Question", QuestionSchema);