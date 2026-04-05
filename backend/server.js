/*
  server.js — The Entry Point of our Backend
  ============================================
  Think of this file as the "main door" of our application.
  When someone runs "node server.js", this is the first file that runs.

  What this file does:
  1. Loads environment variables (secret config values) from .env file
  2. Creates an Express app (Express is like a waiter that handles requests)
  3. Connects to MongoDB (our database)
  4. Sets up middleware (functions that run before our routes handle requests)
  5. Plugs in our routes (URL handlers)
  6. Starts listening for incoming requests on a port
*/

// Load environment variables from .env file FIRST
// process.env.MONGO_URI will now be available throughout the app
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Import our issue routes (the URL patterns our app understands)
const issueRoutes = require("./routes/issueRoutes");

// Create the Express application
// Think of 'app' as the main object that controls everything
const app = express();

// ─── Middleware Setup ────────────────────────────────────────────────────────
// Middleware = functions that run on EVERY request before it reaches a route

// cors() allows our React frontend (running on port 3000) to talk to our
// Express backend (running on port 5000). Without this, the browser blocks it.
app.use(cors());

// express.json() lets Express read the JSON body from incoming requests.
// Example: When frontend sends { title: "Bug", description: "..." }, this parses it.
app.use(express.json());

// ─── Routes ─────────────────────────────────────────────────────────────────
// Any request that starts with /api/issues will be handled by issueRoutes
app.use("/api/issues", issueRoutes);

// ─── Root Route ─────────────────────────────────────────────────────────────
// A simple health-check. Visit http://localhost:5000 to confirm server works
app.get("/", (req, res) => {
  res.json({ message: "Mini Issue Tracker API is running!" });
});

// ─── Database Connection ─────────────────────────────────────────────────────
// mongoose.connect() tries to connect to MongoDB
// process.env.MONGO_URI reads the connection string from our .env file
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1); // Stop the server if DB connection fails
  }
};

// ─── Start the Server ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

// Connect to DB first, then start the server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
});

// Export 'app' so that our integration tests can use it without starting the server
module.exports = app;
