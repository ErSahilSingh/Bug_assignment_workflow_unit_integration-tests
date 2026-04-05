/*
  routes/issueRoutes.js — URL Definitions
  =========================================
  Routes define which URL + HTTP method triggers which controller function.

  Think of routes like a reception desk:
  - "If someone calls asking to CREATE an issue → send them to createIssue"
  - "If someone calls asking to GET all issues → send them to getAllIssues"
  - etc.

  HTTP Methods (verbs) and their meanings:
  - GET    → Read/fetch data
  - POST   → Create new data
  - PUT    → Update existing data
  - DELETE → Remove data

  Express Router lets us group related routes together in one file.
  In server.js, we mounted this router at "/api/issues",
  so every route here is relative to that base path.

  Full URL examples:
  - POST   /api/issues        → createIssue
  - GET    /api/issues        → getAllIssues
  - PUT    /api/issues/:id    → updateIssue  (`:id` is a dynamic segment)
  - DELETE /api/issues/:id    → deleteIssue
*/

const express = require("express");
const router = express.Router(); // Create a mini Express application for routing

// Import the controller functions
const {
  createIssue,
  getAllIssues,
  updateIssue,
  deleteIssue,
} = require("../controllers/issueController");

// POST   /api/issues      → Create a new issue
router.post("/", createIssue);

// GET    /api/issues      → Get all issues
router.get("/", getAllIssues);

// PUT    /api/issues/:id  → Update the status of an issue by ID
// :id is a URL parameter — it can be any value (e.g., /api/issues/64abc123)
router.put("/:id", updateIssue);

// DELETE /api/issues/:id  → Delete an issue by ID
router.delete("/:id", deleteIssue);

module.exports = router;
