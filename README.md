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
├── package.json
└── README.md
