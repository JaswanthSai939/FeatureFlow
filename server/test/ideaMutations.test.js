const assert = require("node:assert/strict");
const test = require("node:test");

const ideaRoutes = require("../src/routes/ideaRoutes");
const {
  createIdea,
  voteForIdea,
  createComment,
} = require("../src/controllers/ideaController");
const authMiddleware = require("../src/middleware/authMiddleware");
const adminMiddleware = require("../src/middleware/adminMiddleware");
const Idea = require("../src/model/Idea");
const Comment = require("../src/model/Comment");
const User = require("../src/model/User");
const Vote = require("../src/model/Vote");

const IDEA_ID = "507f1f77bcf86cd799439011";
const USER_ID = "507f191e810c19729de860ea";
const OTHER_USER_ID = "507f191e810c19729de860eb";

function response() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function routeHandlers(path, method) {
  const layer = ideaRoutes.stack.find(
    (candidate) =>
      candidate.route &&
      candidate.route.path === path &&
      candidate.route.methods[method]
  );

  return layer.route.stack.map((handler) => handler.handle);
}

test("idea write routes require authentication while reads remain public", () => {
  assert.equal(routeHandlers("/", "get").length, 1);
  assert.equal(routeHandlers("/", "post")[0], authMiddleware);
  assert.equal(routeHandlers("/:id/vote", "post")[0], authMiddleware);
  assert.equal(routeHandlers("/:id/comments", "get").length, 1);
  assert.equal(routeHandlers("/:id/comments", "post")[0], authMiddleware);

  const statusHandlers = routeHandlers("/:id/status", "patch");
  assert.equal(statusHandlers[0], authMiddleware);
  assert.equal(statusHandlers[1], adminMiddleware);
});

test("missing bearer token is rejected by authentication middleware", () => {
  const res = response();
  let nextCalled = false;

  authMiddleware({ headers: {} }, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
});

test("an authenticated user creates an idea owned by that user", async () => {
  const originalCreate = Idea.create;
  let savedIdea;

  Idea.create = async (document) => {
    savedIdea = document;
    return { _id: IDEA_ID, ...document };
  };

  try {
    const res = response();
    await createIdea(
      {
        user: { userId: USER_ID },
        body: {
          title: "Improve export controls",
          description: "Add a clearer way to choose exported fields.",
          category: "Productivity",
        },
      },
      res
    );

    assert.equal(res.statusCode, 201);
    assert.equal(savedIdea.createdBy, USER_ID);
    assert.equal(res.body.data.createdBy, USER_ID);
  } finally {
    Idea.create = originalCreate;
  }
});

test("an unauthenticated idea create is rejected defensively", async () => {
  const res = response();
  await createIdea({ body: {} }, res);

  assert.equal(res.statusCode, 401);
});

test("the first vote is recorded and increments the idea once", async () => {
  const originalExists = Idea.exists;
  const originalUpdate = Idea.findByIdAndUpdate;
  const originalVoteCreate = Vote.create;
  let savedVote;

  Idea.exists = async () => ({ _id: IDEA_ID });
  Vote.create = async (document) => {
    savedVote = document;
    return document;
  };
  Idea.findByIdAndUpdate = async () => ({
    _id: IDEA_ID,
    voteCount: 1,
  });

  try {
    const res = response();
    await voteForIdea({ params: { id: IDEA_ID }, user: { userId: USER_ID } }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(savedVote, { user: USER_ID, idea: IDEA_ID });
    assert.equal(res.body.data.voteCount, 1);
  } finally {
    Idea.exists = originalExists;
    Idea.findByIdAndUpdate = originalUpdate;
    Vote.create = originalVoteCreate;
  }
});

test("a duplicate vote returns conflict without incrementing", async () => {
  const originalExists = Idea.exists;
  const originalUpdate = Idea.findByIdAndUpdate;
  const originalVoteCreate = Vote.create;
  let updateCalled = false;

  Idea.exists = async () => ({ _id: IDEA_ID });
  Vote.create = async () => {
    const error = new Error("duplicate vote");
    error.code = 11000;
    throw error;
  };
  Idea.findByIdAndUpdate = async () => {
    updateCalled = true;
  };

  try {
    const res = response();
    await voteForIdea({ params: { id: IDEA_ID }, user: { userId: USER_ID } }, res);

    assert.equal(res.statusCode, 409);
    assert.equal(updateCalled, false);
  } finally {
    Idea.exists = originalExists;
    Idea.findByIdAndUpdate = originalUpdate;
    Vote.create = originalVoteCreate;
  }
});

test("an authenticated comment records the server-derived author", async () => {
  const originalFindIdea = Idea.findById;
  const originalUpdate = Idea.updateOne;
  const originalFindUser = User.findById;
  const originalCommentCreate = Comment.create;
  let savedComment;

  Idea.findById = async () => ({ _id: IDEA_ID });
  Idea.updateOne = async () => ({ acknowledged: true });
  User.findById = () => ({
    select: () => ({
      lean: async () => ({ _id: USER_ID, name: "Trusted User" }),
    }),
  });
  Comment.create = async (document) => {
    savedComment = document;
    return { _id: "507f191e810c19729de860ec", ...document };
  };

  try {
    const res = response();
    await createComment(
      {
        params: { id: IDEA_ID },
        user: { userId: USER_ID },
        body: { text: "This would make reports easier.", authorName: "Untrusted" },
      },
      res
    );

    assert.equal(res.statusCode, 201);
    assert.equal(savedComment.author, USER_ID);
    assert.equal(savedComment.authorName, "Trusted User");
  } finally {
    Idea.findById = originalFindIdea;
    Idea.updateOne = originalUpdate;
    User.findById = originalFindUser;
    Comment.create = originalCommentCreate;
  }
});

test("vote ownership index is unique per user and idea", () => {
  const index = Vote.schema.indexes().find(([fields]) => fields.user === 1 && fields.idea === 1);
  assert.deepEqual(index, [{ user: 1, idea: 1 }, { unique: true }]);
  assert.notEqual(USER_ID, OTHER_USER_ID);
});
