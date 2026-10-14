# FeatureFlow — Community Feature Feedback Board

FeatureFlow is a MERN-stack web application where users can submit product feature ideas, upvote ideas, discuss them through comments, and track progress. Administrators can update an idea's status.

## Features

- User registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Submit ideas with a title, description, and category
- Upvote ideas
- Add and view comments
- Filter ideas by status and sort by votes or newest
- Dashboard statistics
- Admin-only status updates
- MongoDB persistence

## Technology stack

- **Frontend:** React, Vite, JavaScript, CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JSON Web Tokens (JWT), bcryptjs

## Project structure

```text
FeatureFlow/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── App.css
│   └── package.json
├── server/                 # Express API
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── model/
│   │   ├── routes/
│   │   └── server.js
│   └── package.json
├── .gitignore
└── README.md
```

Adjust the structure above if your actual folders differ.

## Prerequisites

- Node.js (LTS recommended)
- npm
- MongoDB running locally, or a MongoDB connection string

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/JaswanthSai939/FeatureFlow.git
cd FeatureFlow
```

### 2. Configure the backend

```bash
cd server
npm install
```

Create `server/.env` using the variable names expected by your existing database configuration:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/featureflow
JWT_SECRET=replace_with_a_long_random_secret
```

Use a strong, unique random value for `JWT_SECRET`. Never commit `.env` or share its contents. Check `server/src/config/db.js` to confirm whether the database variable is named `MONGODB_URI` or something else.

Start the backend using the script defined in `server/package.json`, commonly:

```bash
npm run dev
```

The API should be available at `http://localhost:5000`.

### 3. Start the frontend

Open a second terminal at the project root:

```bash
cd client
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## API overview

Base URLs:

- Ideas API: `http://localhost:5000/api/ideas`
- Authentication API: `http://localhost:5000/api/auth`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check API health |
| POST | `/api/auth/register` | Register an account |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Get the authenticated user's profile |
| GET | `/api/ideas` | List ideas |
| POST | `/api/ideas` | Create an idea |
| POST | `/api/ideas/:id/vote` | Upvote an idea |
| GET | `/api/ideas/:id/comments` | Get comments |
| POST | `/api/ideas/:id/comments` | Add a comment |
| PATCH | `/api/ideas/:id/status` | Update status (admin only) |

Authenticated endpoints use a bearer token in the `Authorization` header:

```http
Authorization: Bearer <JWT_TOKEN>
```

Allowed idea statuses are `Planned`, `In Progress`, and `Shipped`. Check the actual route/controller code for exact validation and authentication requirements.

## Admin access

New accounts default to the `user` role. The status-update endpoint must enforce authentication and admin authorization on the server. Hiding a dropdown in React is not a security boundary. Do not accept a user-supplied role during public registration.

## Testing checklist

- [ ] Register and log in
- [ ] Verify the current-user endpoint
- [ ] Create an idea
- [ ] Upvote an idea
- [ ] Add and view comments
- [ ] Filter and sort ideas
- [ ] Change status as an admin
- [ ] Confirm regular users receive `403 Forbidden` on status updates
- [ ] Confirm missing authentication receives `401 Unauthorized`
- [ ] Confirm invalid statuses are rejected
- [ ] Refresh and confirm data persists

## Security and Git hygiene

- Do not commit `.env`, credentials, JWTs, or database secrets.
- Do not commit `node_modules`.
- Keep passwords and password hashes out of public responses and logs.
- Rotate any secret that has been exposed.
- Enforce admin authorization on the backend.
