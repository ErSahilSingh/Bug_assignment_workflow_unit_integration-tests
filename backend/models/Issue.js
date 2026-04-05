/*
  models/Issue.js — The Database Schema (Blueprint)
  ===================================================
  A "schema" is like a form template. It defines:
  - What fields an Issue document can have
  - What type of data each field holds (String, Date, etc.)
  - Rules for each field (required, default values, allowed values)

  Mongoose is a library that lets us define schemas and interact with MongoDB
  using JavaScript objects instead of raw MongoDB queries.

  Think of:
  - Schema → the blueprint/template
  - Model  → the class that uses the blueprint to create/read/update/delete records
  - Document → one actual record in the database (like one row in SQL)
*/

const mongoose = require("mongoose");

// Define the shape of an Issue document
const issueSchema = new mongoose.Schema(
  {
    // Title of the issue — required, must be a string
    title: {
      type: String,
      required: [true, "Title is required"], // custom error message
      trim: true, // removes leading/trailing spaces automatically
    },

    // Detailed description of the issue
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },

    // Priority level — can only be one of these three values
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"], // only these values are allowed
      default: "Medium", // if not provided, defaults to "Medium"
    },

    // Current status of the issue
    status: {
      type: String,
      enum: ["Open", "In Progress", "Done"], // allowed values
      default: "Open", // new issues start as "Open"
    },
  },
  {
    // timestamps: true automatically adds two fields:
    // - createdAt: when the document was created
    // - updatedAt: when the document was last updated
    timestamps: true,
  }
);

/*
  mongoose.model("Issue", issueSchema) does two things:
  1. Creates a Model named "Issue"
  2. Mongoose will automatically look for (or create) a MongoDB collection
     called "issues" (lowercase + plural of the model name)
*/
const Issue = mongoose.model("Issue", issueSchema);

module.exports = Issue;
