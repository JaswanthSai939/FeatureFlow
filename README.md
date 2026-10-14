# FeatureFlow — Community Feature Feedback Board

FeatureFlow is a MERN-stack web application where users can submit product feature ideas, upvote ideas, discuss them through comments, and track progress. Administrators can update idea statuses.

## Features

- User registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Submit ideas with a title, description, and category
- Browse and filter ideas by status
- Sort ideas by votes or newest
- Upvote ideas with duplicate-vote prevention
- Add and view comments
- Dashboard statistics
- Admin-only idea status updates
- MongoDB persistence using Mongoose
- Server-side authentication and authorization for idea mutations
- Idea ownership and server-verified comment authorship
- Automated backend security tests

## Technology Stack

- **Frontend:** React, Vite, JavaScript, CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JSON Web Tokens (JWT), bcryptjs
- **Testing:** Node.js built-in test runner and ESLint

## Project Structure

```text
FeatureFlow/
├── client/
│   ├── src/
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── model/
│   │   ├── routes/
│   │   └── server.js
│   ├── test/
│   │   └── ideaMutations.test.js
│   └── package.json
├── .gitignore
├── README.md
└── requirements.txt
```

## Prerequisites

- Node.js and npm
- MongoDB running locally or an accessible MongoDB instance
- Git

## Setup and Run

### 1. Clone the repository

```bash
git clone https://github.com/JaswanthSai939/FeatureFlow.git
cd FeatureFlow
```

### 2. Configure the backend

Install the backend dependencies from the project root:

```bash
npm --prefix server install
```

Create a `server/.env` file with the environment variables expected by the backend configuration:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/featureflow
JWT_SECRET=replace_with_a_long_random_secret
```

Use a strong, unique secret for `JWT_SECRET`. Never commit `.env` files, credentials, or tokens.

Check `server/src/config/db.js` and the backend configuration to confirm the exact database environment-variable name before running the application.

Start the backend using the script defined in `server/package.json`. For example, if a `start` script is configured:

```bash
npm --prefix server start
```

### 3. Configure and start the frontend

Install frontend dependencies:

```bash
npm --prefix client install
```

Start the frontend:

```bash
npm --prefix client run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

The backend normally runs on port `5000`, depending on its configuration.

## API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check API health |
| POST | `/api/auth/register` | Register an account |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Get the authenticated user's profile |
| GET | `/api/ideas` | Browse ideas |
| POST | `/api/ideas` | Create an idea; authentication required |
| POST | `/api/ideas/:id/vote` | Upvote an idea; authentication required |
| GET | `/api/ideas/:id/comments` | View comments |
| POST | `/api/ideas/:id/comments` | Add a comment; authentication required |
| PATCH | `/api/ideas/:id/status` | Update idea status; admin authorization required |

Authenticated endpoints use a bearer token in the `Authorization` header:

```http
Authorization: Bearer <JWT_TOKEN>
```

Allowed idea statuses are `Planned`, `In Progress`, and `Shipped`.

## Security and Authorization

- Passwords are hashed using bcryptjs.
- JWT authentication protects idea creation, voting, and comment creation.
- New ideas record their creator using authenticated server-side identity.
- Comment authorship is derived from the authenticated user rather than trusting a client-supplied author name.
- A dedicated vote model records the user and idea associated with a vote.
- A unique database index on `{ user, idea }` helps enforce one vote per user per idea.
- Admin status updates require authentication and server-side role authorization.
- Public idea and comment browsing remains available.

The unique vote index must be successfully created in MongoDB for database-level duplicate prevention to take effect.

## Testing

Run the backend security tests:

```bash
npm --prefix server test
```

Run the frontend lint check:

```bash
npm --prefix client run lint
```

### Verified Results

During development:

- **Backend:** 8 tests passed, 0 failed.
- **Frontend lint:** The command completed without reporting errors.
- **Manual testing:** The main user workflows were checked, including login, idea creation, voting, comments, and admin status updates.

These results reflect the checks performed during development; rerun the commands after making further changes.

## CodeZero Usage Confirmation

CodeZero AI IDE was used during the development and review of FeatureFlow. Its repository exploration and planning workflow was used to inspect the frontend, backend, database models, and API routes before implementing security improvements.

The proposed security plan was reviewed and approved before implementation. The resulting changes were tested, and the implementation was manually checked in the running application.

## AI Development Experience

CodeZero assisted with the following specific tasks:

1. **Repository exploration:** Inspected the React frontend, Express backend, Mongoose models, authentication middleware, and API routes to understand the application structure.
2. **Security review:** Reviewed authentication, authorization, idea mutations, voting, comment handling, input validation, and error handling.
3. **Implementation planning:** Prepared a multi-file plan for protecting idea creation, voting, and commenting, recording idea ownership, and preventing duplicate votes.
4. **Security improvements:** Assisted with protecting mutation routes, recording idea and comment ownership, introducing a dedicated vote model with a unique user-and-idea index, and adding focused backend tests.
5. **Verification:** Added Node.js built-in tests, ran the backend test suite, ran the frontend lint check, and manually checked the main application workflows.

AI-assisted changes were reviewed and tested before being prepared for submission.

## Git and Configuration Hygiene

- Do not commit `.env` files, credentials, JWTs, or database secrets.
- Do not commit `node_modules`.
- Keep local CodeZero task metadata out of the public repository.
- Rotate any secret that has been exposed.
- Enforce authorization on the backend rather than relying on frontend controls.