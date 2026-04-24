# Question Answer API

A RESTful Question & Answer backend built with **Node.js**, **Express.js**, and **MongoDB**.

This project provides authentication, question management, answers, user profiles, and admin operations for a Q&A platform.

## Features

- User registration and login
- JWT-based authentication
- Get current user profile
- Edit user details
- Profile image upload
- Forgot / reset password flow
- Create, read, update, and delete questions
- Like / unlike questions
- Add answers to questions
- Fetch all answers for a question
- Get all users or a single user
- Admin-only user block/unblock and delete actions
- Health check endpoint (`GET /health`)

## Quick Start

### Option 1 — Local Node + existing MongoDB

1. Copy env file:

```bash
cp config/env/config.env.example config/env/config.env
```

2. Update `config/env/config.env` with your real values.

3. Install dependencies:

```bash
npm install
```

4. Start the API:

```bash
npm run dev
```

### Option 2 — Docker Compose (recommended)

This starts both MongoDB and the API together.

1. Copy env file:

```bash
cp config/env/config.env.example config/env/config.env
```

2. Start services:

```bash
docker compose up --build
```

3. Check health:

```bash
curl http://localhost:5000/health
```

Expected response:

```json
{
  "success": true,
  "status": "ok",
  "environment": "development"
}
```

4. Stop services:

```bash
docker compose down
```

To remove Mongo volume too:

```bash
docker compose down -v
```

## Environment Variables

Example file: `config/env/config.env.example`

Key values:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/question-answer-api
JWT_SECRET_KEY=replace-with-at-least-32-random-characters
JWT_EXPIRE=10m
JWT_COOKIE=60
RESET_PASSWORD_EXPIRE=3600000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
RESET_PASSWORD_CLIENT_URL=https://your-app.example.com/resetpassword
```

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- multer
- nodemailer
- dotenv
- nodemon

## Project Structure

```bash
question-answer-api/
├── config/
│   └── env/
│       └── config.env
├── controllers/
│   ├── admin.js
│   ├── answer.js
│   ├── auth.js
│   ├── questions.js
│   └── user.js
├── helpers/
├── middlewares/
│   ├── auth/
│   ├── database/
│   ├── errors/
│   └── libraries/
├── models/
│   ├── Answer.js
│   ├── Question.js
│   └── User.js
├── public/
├── routers/
│   ├── admin.js
│   ├── answer.js
│   ├── auth.js
│   ├── index.js
│   ├── questions.js
│   └── user.js
├── server.js
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
