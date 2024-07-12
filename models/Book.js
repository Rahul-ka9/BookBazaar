const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.String,
      ref: "User",
    },
    title: String,
    author: String,
    publication_year: Number,
    description: String,
    price: Number,
    publisher: String,
    language: String,
    image: String,
    userEmail: String,
    quantity: Number,
    condition: {
      type: String,
      enum: ["like new", "good", "fair", "poor"],
      required: true,
    },
    userphn: String,
    category: String,
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

module.exports = mongoose.model("Book", bookSchema);