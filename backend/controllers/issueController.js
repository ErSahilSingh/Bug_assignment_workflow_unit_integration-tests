/*
  controllers/issueController.js — The Business Logic
  =====================================================
  Controllers are functions that handle what happens when a route is matched.
  Think of them like "workers" who process the request and send back a response.

  Each function here handles one specific action:
  - createIssue   → adds a new issue to the database
  - getAllIssues  → fetches all issues from the database
  - updateIssue  → changes the status of an existing issue
  - deleteIssue  → removes an issue from the database

  Why separate controllers from routes?
  → Keeps code organized. Routes just say "which URL → which function".
    Controllers contain the actual logic.

  async/await:
  → Database operations take time (they go over the network).
    'async' marks the function as asynchronous.
    'await' tells JavaScript: "wait for this to finish before moving on".

  try/catch:
  → If something goes wrong (e.g., DB is down), catch() handles the error
    gracefully instead of crashing the server.
*/

const Issue = require("../models/Issue"); // Import our Issue model

// ─────────────────────────────────────────────────────────────────────────────
// CREATE — POST /api/issues
// ─────────────────────────────────────────────────────────────────────────────
/*
  req.body contains data sent from the frontend (e.g., title, description, priority)
  We create a new Issue document and save it to MongoDB.
  Then we send back the saved issue as a JSON response.
*/
const createIssue = async (req, res) => {
  try {
    // Destructure the fields we need from the request body
    const { title, description, priority } = req.body;

    // Create a new Issue instance (not saved yet — just an in-memory object)
    const newIssue = new Issue({ title, description, priority });

    // Save the issue to MongoDB. 'await' waits until it's saved.
    const savedIssue = await newIssue.save();

    // 201 = "Created" — standard HTTP status for a new resource
    res.status(201).json(savedIssue);
  } catch (error) {
    // 400 = "Bad Request" — the input was invalid
    res.status(400).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// READ — GET /api/issues
// ─────────────────────────────────────────────────────────────────────────────
/*
  Issue.find({}) finds ALL documents in the issues collection.
  We sort them by newest first using: sort({ createdAt: -1 })
  -1 = descending order (newest to oldest)
*/
const getAllIssues = async (req, res) => {
  try {
    // fetch all issues, newest first
    const issues = await Issue.find({}).sort({ createdAt: -1 });

    // 200 = "OK" — standard success status
    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE — PUT /api/issues/:id
// ─────────────────────────────────────────────────────────────────────────────
/*
  req.params.id gets the issue ID from the URL.
  Example: PUT /api/issues/64abc123... → req.params.id = "64abc123..."

  findByIdAndUpdate() finds the document by ID and updates it.
  { new: true } → returns the UPDATED document (not the old one)
  { runValidators: true } → runs schema validation on the update too
*/
const updateIssue = async (req, res) => {
  try {
    const { id } = req.params; // ID from the URL
    const { status } = req.body; // new status from the request body

    const updatedIssue = await Issue.findByIdAndUpdate(
      id,
      { status }, // only updating the status field
      { new: true, runValidators: true }
    );

    // If no issue was found with that ID, return 404
    if (!updatedIssue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    res.status(200).json(updatedIssue);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE — DELETE /api/issues/:id
// ─────────────────────────────────────────────────────────────────────────────
/*
  findByIdAndDelete() finds the document by ID and removes it from MongoDB.
  We send back a success message to confirm it was deleted.
*/
const deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedIssue = await Issue.findByIdAndDelete(id);

    if (!deletedIssue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // 200 = OK, send a confirmation message
    res.status(200).json({ message: "Issue deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export all controller functions so routes can use them
module.exports = { createIssue, getAllIssues, updateIssue, deleteIssue };
