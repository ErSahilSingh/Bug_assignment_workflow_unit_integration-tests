/*
  __tests__/integration/issueRoutes.integration.test.js — Integration Tests
  ===========================================================================
  WHAT IS AN INTEGRATION TEST?
  → While unit tests test one function in isolation, integration tests check
    that MULTIPLE parts work correctly TOGETHER.
  → Here we test: does the HTTP route → controller → database flow work end-to-end?

  SUPERTEST:
  → Supertest is a library that simulates HTTP requests to our Express app.
  → Instead of actually starting the server, it directly calls app.listen()
    internally and sends fake HTTP requests.
  → This lets us test: "If I send POST /api/issues with this data... do I get 201 back?"

  MONGODB MEMORY SERVER:
  → We use jest.mock() + a simple approach: before each test, we create documents
    directly in the database to set up test state.
  → For a real project, you'd use 'mongodb-memory-server' for a fully in-memory DB.
  → Here we use the real MongoDB (from .env) but clean up between tests.

  NOTE: These tests require MongoDB to be running!
  Run: mongod --dbpath="C:/data/db" (or start MongoDB service)

  Structure of an integration test:
  1. beforeAll: runs once before all tests in this file (connect to DB)
  2. beforeEach: runs before EACH test (clear collection to start fresh)
  3. afterAll: runs once after all tests (disconnect from DB)
*/

const request = require("supertest"); // makes HTTP requests to our app
const mongoose = require("mongoose");
const app = require("../../server"); // import the Express app (not started yet)
const Issue = require("../../models/Issue");

// ─── Test Database Setup ─────────────────────────────────────────────────────

// Connect to a separate test database before running any tests
beforeAll(async () => {
  // Use a separate test database (not the same as production)
  const testDbUri =
    process.env.MONGO_URI_TEST ||
    "mongodb://localhost:27017/mini-issue-tracker-test";

  // Disconnect from any existing connection first
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(testDbUri);
});

// Before each individual test, clear the issues collection
// This ensures tests don't affect each other
beforeEach(async () => {
  await Issue.deleteMany({}); // wipe all documents in the test collection
});

// After all tests, disconnect from the database
afterAll(async () => {
  await mongoose.disconnect();
});

// ─── POST /api/issues — Create Issue ────────────────────────────────────────
describe("POST /api/issues", () => {
  it("should create a new issue and return 201", async () => {
    // Define the issue data we want to send
    const issueData = {
      title: "Login page broken",
      description: "Users cannot log in on mobile",
      priority: "High",
    };

    // Use supertest to send a POST request to our app
    const response = await request(app)
      .post("/api/issues")         // URL
      .send(issueData)             // request body
      .set("Content-Type", "application/json"); // headers

    // Check that the response status is 201 (Created)
    expect(response.statusCode).toBe(201);

    // Check the returned issue has correct data
    expect(response.body.title).toBe("Login page broken");
    expect(response.body.priority).toBe("High");
    expect(response.body.status).toBe("Open"); // default value
    expect(response.body._id).toBeDefined(); // MongoDB should assign an ID
  });

  it("should return 400 if title is missing", async () => {
    const response = await request(app)
      .post("/api/issues")
      .send({ description: "No title provided" })
      .set("Content-Type", "application/json");

    // Validation should fail with 400 Bad Request
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBeDefined(); // there should be an error message
  });

  it("should return 400 if description is missing", async () => {
    const response = await request(app)
      .post("/api/issues")
      .send({ title: "Issue without description" })
      .set("Content-Type", "application/json");

    expect(response.statusCode).toBe(400);
  });
});

// ─── GET /api/issues — Get All Issues ───────────────────────────────────────
describe("GET /api/issues", () => {
  it("should return an empty array when no issues exist", async () => {
    const response = await request(app).get("/api/issues");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]); // empty array
  });

  it("should return all issues", async () => {
    // First, manually insert some issues into the test database
    await Issue.create([
      { title: "Bug 1", description: "Description 1", priority: "Low" },
      { title: "Bug 2", description: "Description 2", priority: "High" },
    ]);

    const response = await request(app).get("/api/issues");

    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(2); // should return 2 issues
    expect(response.body[0].title).toBeDefined();
  });
});

// ─── PUT /api/issues/:id — Update Issue Status ──────────────────────────────
describe("PUT /api/issues/:id", () => {
  it("should update the status of an existing issue", async () => {
    // Create an issue to update
    const issue = await Issue.create({
      title: "Fix signup form",
      description: "Form validation broken",
      priority: "Medium",
    });

    // Send a PUT request to update the status
    const response = await request(app)
      .put(`/api/issues/${issue._id}`)
      .send({ status: "In Progress" })
      .set("Content-Type", "application/json");

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("In Progress"); // status should be updated
    expect(response.body._id).toBe(issue._id.toString());
  });

  it("should return 404 for a non-existent issue ID", async () => {
    // Generate a valid MongoDB ObjectId that doesn't exist in the DB
    const nonExistentId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .put(`/api/issues/${nonExistentId}`)
      .send({ status: "Done" })
      .set("Content-Type", "application/json");

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("Issue not found");
  });

  it("should return 400 for an invalid status value", async () => {
    const issue = await Issue.create({
      title: "Some issue",
      description: "Some description",
      priority: "Low",
    });

    const response = await request(app)
      .put(`/api/issues/${issue._id}`)
      .send({ status: "InvalidStatus" }) // not in the enum!
      .set("Content-Type", "application/json");

    expect(response.statusCode).toBe(400);
  });
});

// ─── DELETE /api/issues/:id — Delete Issue ───────────────────────────────────
describe("DELETE /api/issues/:id", () => {
  it("should delete an existing issue and return success message", async () => {
    // Create an issue to delete
    const issue = await Issue.create({
      title: "Issue to delete",
      description: "Will be deleted",
      priority: "Low",
    });

    const response = await request(app).delete(`/api/issues/${issue._id}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Issue deleted successfully");

    // Verify it's actually gone from the database
    const deletedIssue = await Issue.findById(issue._id);
    expect(deletedIssue).toBeNull(); // should not exist anymore
  });

  it("should return 404 when deleting a non-existent issue", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const response = await request(app).delete(`/api/issues/${nonExistentId}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("Issue not found");
  });
});
