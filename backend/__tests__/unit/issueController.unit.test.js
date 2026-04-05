/*
  __tests__/unit/issueController.unit.test.js — Unit Tests
  ===========================================================
  WHAT IS A UNIT TEST?
  → A unit test tests ONE small piece of code in complete isolation.
  → "Isolation" means: we don't use the real database. Instead, we MOCK it.

  WHAT IS MOCKING?
  → Mocking = replacing real functions with fake ones we control.
  → Why? Because unit tests should be fast and not depend on external services.
  → Example: Instead of actually saving to MongoDB, we pretend it saved.

  JEST:
  → Jest is a JavaScript testing framework. It provides:
    - describe() → groups related tests
    - it() / test() → defines a single test
    - expect() → checks if a value matches what we expect
    - jest.fn() → creates a mock function
    - jest.mock() → replaces a module with a mock version

  HOW TO READ A TEST:
  1. Arrange → set up the test data and mocks
  2. Act     → call the function being tested
  3. Assert  → check the result with expect()
*/

// Tell Jest to mock the entire Issue model module.
// This means when issueController.js does require("../models/Issue"),
// it gets our fake version instead of the real Mongoose model.
jest.mock("../../models/Issue");

const Issue = require("../../models/Issue");
const {
  createIssue,
  getAllIssues,
  updateIssue,
  deleteIssue,
} = require("../../controllers/issueController");

// Helper: creates a fake req (request) object with optional body and params
const mockReq = (body = {}, params = {}) => ({ body, params });

// Helper: creates a fake res (response) object
// We track what status code and JSON were sent using jest.fn()
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res); // allows chaining: res.status(201).json(...)
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ─── Tests for createIssue ───────────────────────────────────────────────────
describe("createIssue", () => {
  // Clear all mock data between tests so they don't affect each other
  afterEach(() => jest.clearAllMocks());

  it("should create an issue and return 201 status", async () => {
    // ARRANGE: fake issue data that mocked save() will return
    const fakeIssue = {
      _id: "abc123",
      title: "Login bug",
      description: "Cannot login",
      priority: "High",
      status: "Open",
    };

    // Mock the Issue constructor and its save() method
    // When 'new Issue(...)' is called, it returns an object with a save() method
    // that resolves to our fakeIssue
    Issue.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(fakeIssue),
    }));

    const req = mockReq({ title: "Login bug", description: "Cannot login", priority: "High" });
    const res = mockRes();

    // ACT: call the controller
    await createIssue(req, res);

    // ASSERT: check the response
    expect(res.status).toHaveBeenCalledWith(201);       // status should be 201
    expect(res.json).toHaveBeenCalledWith(fakeIssue);   // should return the saved issue
  });

  it("should return 400 if save fails (validation error)", async () => {
    // Simulate a validation error being thrown
    Issue.mockImplementation(() => ({
      save: jest.fn().mockRejectedValue(new Error("Title is required")),
    }));

    const req = mockReq({ description: "missing title" }); // no title!
    const res = mockRes();

    await createIssue(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Title is required" });
  });
});

// ─── Tests for getAllIssues ──────────────────────────────────────────────────
describe("getAllIssues", () => {
  afterEach(() => jest.clearAllMocks());

  it("should return all issues with status 200", async () => {
    const fakeIssues = [
      { _id: "1", title: "Bug A", status: "Open" },
      { _id: "2", title: "Bug B", status: "Done" },
    ];

    // Issue.find({}) returns an object with a sort() method (method chaining)
    // We mock this chained call: Issue.find({}).sort({ createdAt: -1 })
    Issue.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue(fakeIssues),
    });

    const req = mockReq();
    const res = mockRes();

    await getAllIssues(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(fakeIssues);
  });

  it("should return 500 if database throws an error", async () => {
    Issue.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockRejectedValue(new Error("DB connection failed")),
    });

    const req = mockReq();
    const res = mockRes();

    await getAllIssues(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "DB connection failed" });
  });
});

// ─── Tests for updateIssue ──────────────────────────────────────────────────
describe("updateIssue", () => {
  afterEach(() => jest.clearAllMocks());

  it("should update issue status and return 200", async () => {
    const updatedIssue = { _id: "abc123", status: "In Progress" };

    // Mock the findByIdAndUpdate static method
    Issue.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedIssue);

    const req = mockReq({ status: "In Progress" }, { id: "abc123" });
    const res = mockRes();

    await updateIssue(req, res);

    expect(Issue.findByIdAndUpdate).toHaveBeenCalledWith(
      "abc123",
      { status: "In Progress" },
      { new: true, runValidators: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updatedIssue);
  });

  it("should return 404 if issue not found", async () => {
    // findByIdAndUpdate returns null when no document matches
    Issue.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

    const req = mockReq({ status: "Done" }, { id: "nonexistent-id" });
    const res = mockRes();

    await updateIssue(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Issue not found" });
  });
});

// ─── Tests for deleteIssue ──────────────────────────────────────────────────
describe("deleteIssue", () => {
  afterEach(() => jest.clearAllMocks());

  it("should delete the issue and return success message", async () => {
    const deletedIssue = { _id: "abc123", title: "Old Bug" };

    Issue.findByIdAndDelete = jest.fn().mockResolvedValue(deletedIssue);

    const req = mockReq({}, { id: "abc123" });
    const res = mockRes();

    await deleteIssue(req, res);

    expect(Issue.findByIdAndDelete).toHaveBeenCalledWith("abc123");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Issue deleted successfully" });
  });

  it("should return 404 if issue does not exist", async () => {
    Issue.findByIdAndDelete = jest.fn().mockResolvedValue(null);

    const req = mockReq({}, { id: "ghost-id" });
    const res = mockRes();

    await deleteIssue(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Issue not found" });
  });
});
