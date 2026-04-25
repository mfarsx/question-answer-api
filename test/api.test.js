const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.PORT = '5002';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/question-answer-api-test';
process.env.JWT_SECRET_KEY = 'test-secret-key-1234567890-abcdef';
process.env.JWT_EXPIRE = '10m';
process.env.JWT_COOKIE = '60';
process.env.RESET_PASSWORD_EXPIRE = '3600000';
process.env.SMTP_HOST = 'smtp.gmail.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'your-email@example.com';
process.env.SMTP_PASS = 'your-app-password';

const { app } = require('../server');
const { connectDatabase } = require('../helpers/database/connectDatabase');
const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');

const api = request(app);

async function clearDatabase() {
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
}

async function register(overrides = {}) {
  const unique = Date.now() + Math.floor(Math.random() * 10000);
  const payload = {
    name: 'test user',
    email: `user${unique}@example.com`,
    password: 'secret123',
    ...overrides,
  };
  const res = await api.post('/api/auth/register').send(payload);
  assert.equal(res.status, 200);
  assert.ok(res.body.access_token);
  return { ...payload, token: res.body.access_token };
}

async function login(email, password) {
  const res = await api.post('/api/auth/login').send({ email, password });
  assert.equal(res.status, 200);
  assert.ok(res.body.access_token);
  return res.body.access_token;
}

async function promoteToAdmin(email) {
  const user = await User.findOne({ email });
  user.role = 'admin';
  await user.save();
  return login(user.email, 'secret123');
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

function uniqueTitle(prefix = 'Question title') {
  return `${prefix} ${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

test.before(async () => {
  await connectDatabase();
  await clearDatabase();
});

test.after(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

test.beforeEach(async () => {
  await clearDatabase();
});

// ── Health ────────────────────────────────────────────

test('GET /health returns ok', async () => {
  const res = await api.get('/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.status, 'ok');
  assert.equal(res.body.environment, 'test');
});

// ── Auth register ───────────────────────────────────

test('register requires name/email/password', async () => {
  const missingName = await api.post('/api/auth/register').send({
    email: 'no-name@example.com',
    password: 'secret123',
  });
  assert.equal(missingName.status, 400);

  const missingEmail = await api.post('/api/auth/register').send({
    name: 'x',
    password: 'secret123',
  });
  assert.equal(missingEmail.status, 400);

  const missingPassword = await api.post('/api/auth/register').send({
    name: 'x',
    email: 'x@example.com',
  });
  assert.equal(missingPassword.status, 400);

  const shortPassword = await api.post('/api/auth/register').send({
    name: 'x',
    email: 'x@example.com',
    password: 'abc',
  });
  assert.equal(shortPassword.status, 400);
});

test('register rejects duplicate email', async () => {
  await api.post('/api/auth/register').send({
    name: 'dup user',
    email: 'dup@example.com',
    password: 'secret123',
  });
  const dup = await api.post('/api/auth/register').send({
    name: 'dup user 2',
    email: 'dup@example.com',
    password: 'secret123',
  });
  assert.equal(dup.status, 400);
  assert.ok(dup.body.message?.includes('Duplicate'));
});

// ── Auth login ──────────────────────────────────────

test('login rejects invalid email', async () => {
  const res = await api.post('/api/auth/login').send({
    email: 'nobody@example.com',
    password: 'secret123',
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.message, 'Please check your inputs');
});

test('login rejects wrong password', async () => {
  await api.post('/api/auth/register').send({
    name: 'login test',
    email: 'logintest@example.com',
    password: 'secret123',
  });
  const res = await api.post('/api/auth/login').send({
    email: 'logintest@example.com',
    password: 'wrongpass',
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.message, 'Please check your inputs');
});

// ── Auth profile ────────────────────────────────────

test('profile requires token', async () => {
  const res = await api.get('/api/auth/profile');
  assert.equal(res.status, 401);
});

test('profile rejects invalid token', async () => {
  const res = await api.get('/api/auth/profile').set('Authorization', 'Bearer invalid.token.here');
  assert.equal(res.status, 401);
});

test('profile returns data with valid token', async () => {
  const user = await register();
  const res = await api.get('/api/auth/profile').set(authHeader(user.token));
  assert.equal(res.status, 200);
  assert.equal(res.body.data.name, user.name);
  assert.equal(res.body.data.email, undefined); // password not leaked
  assert.equal(res.body.data.role, 'user');
});

// ── Auth logout ─────────────────────────────────────

test('logout requires token', async () => {
  const res = await api.get('/api/auth/logout');
  assert.equal(res.status, 401);
});

// ── Unauthorized / authz guards ────────────────────

test('POST /api/questions/ask rejects without token', async () => {
  const res = await api.post('/api/questions/ask').send({
    title: 'No auth question',
    content: 'Should be rejected',
  });
  assert.equal(res.status, 401);
});

test('PUT /api/questions/edit/:id rejects non-owner', async () => {
  const owner = await register({ name: 'owner' });
  const q = await api.post('/api/questions/ask').set(authHeader(owner.token)).send({
    title: 'Owner question',
    content: 'Content by owner that has enough characters in it and is unique enough and is unique enough for testing',
  });

  const intruder = await register({ name: 'intruder' });
  const res = await api.put(`/api/questions/edit/${q.body.data._id}`)
    .set(authHeader(intruder.token))
    .send({ title: 'Hacked' });

  assert.equal(res.status, 403);
});

test('admin/block rejects non-admin', async () => {
  const user = await register();
  const res = await api.get('/api/admin/block/123456789012345678901234')
    .set(authHeader(user.token));
  assert.equal(res.status, 403);
});

test('admin/block rejects without token', async () => {
  const res = await api.get('/api/admin/block/123456789012345678901234');
  assert.equal(res.status, 401);
});

// ── Pagination guards ──────────────────────────────

test('GET /api/questions?page=1&limit=1 returns pagination meta', async () => {
  const { token } = await register();
  await api.post('/api/questions/ask').set(authHeader(token)).send({
    title: 'First question title',
    content: 'First question content with enough chars',
  });
  await api.post('/api/questions/ask').set(authHeader(token)).send({
    title: 'Second question title',
    content: 'Second question content with enough chars',
  });

  const res = await api.get('/api/questions?page=1&limit=1');
  assert.equal(res.status, 200);
  assert.equal(res.body.meta.page, 1);
  assert.equal(res.body.meta.limit, 1);
  assert.equal(res.body.meta.total, 2);
  assert.equal(res.body.data.length, 1);
});

test('GET /api/users?page=1&limit=1 returns pagination meta', async () => {
  await register({ name: 'user one' });
  await register({ name: 'user two' });

  const res = await api.get('/api/users?page=1&limit=1');
  assert.equal(res.status, 200);
  assert.equal(res.body.meta.page, 1);
  assert.equal(res.body.meta.limit, 1);
  assert.equal(res.body.meta.total, 2);
  assert.equal(res.body.data.length, 1);
});

// ── Password reset flow ────────────────────────────

test('forgot password: no reset token written when SMTP not configured', async () => {
  await api.post('/api/auth/register').send({
    name: 'forgot user',
    email: 'forgot@example.com',
    password: 'secret123',
  });
  const res = await api.post('/api/auth/forgotpassword').send({
    email: 'forgot@example.com',
  });
  assert.equal(res.status, 200);
  assert.ok(res.body.message);
  assert.ok(res.body.message.includes('unavailable'));

  // SMTP yoksa DB'ye reset token yazılmamalı
  const user = await User.findOne({ email: 'forgot@example.com' });
  assert.equal(user.resetPasswordToken, undefined);
  assert.equal(user.resetPasswordExpire, undefined);
});

test('forgot password enumeration-safe: same response for existing and missing email', async () => {
  const existingEmail = 'enum-existing@example.com';
  await api.post('/api/auth/register').send({
    name: 'enum user',
    email: existingEmail,
    password: 'secret123',
  });

  const existingRes = await api.post('/api/auth/forgotpassword').send({ email: existingEmail });
  assert.equal(existingRes.status, 200);

  const missingRes = await api.post('/api/auth/forgotpassword').send({
    email: 'nonexistent-enum@example.com',
  });
  assert.equal(missingRes.status, 200);

  // Aynı response body → enumeration mümkün değil
  assert.equal(existingRes.body.success, missingRes.body.success);
  assert.equal(existingRes.body.message, missingRes.body.message);
});

test('reset password requires token', async () => {
  const res = await api.put('/api/auth/resetpassword').send({
    password: 'newpass123',
  });
  assert.equal(res.status, 400);
  assert.ok(res.body.message?.toLowerCase().includes('token'));
});

test('reset password rejects invalid token', async () => {
  const res = await api.put('/api/auth/resetpassword')
    .query({ resetPasswordToken: 'invalid-token-value' })
    .send({ password: 'newpass123' });
  assert.equal(res.status, 400);
  assert.ok(res.body.message?.includes('Invalid Token'));
});

// ── Question guards ────────────────────────────────

test('GET /api/questions/:id rejects invalid ObjectId', async () => {
  const res = await api.get('/api/questions/not-an-id');
  assert.equal(res.status, 400);
  assert.ok(res.body.message?.includes('valid id'));
});

test('GET /api/questions/:id rejects non-existent', async () => {
  const res = await api.get('/api/questions/000000000000000000000000');
  assert.equal(res.status, 400);
  assert.ok(res.body.message?.includes('no such question'));
});

test('PUT /api/questions/edit/:id updates own question', async () => {
  const user = await register();
  const q = await api.post('/api/questions/ask').set(authHeader(user.token)).send({
    title: uniqueTitle('Editable question'),
    content: 'Original content that is definitely long enough',
  });

  const updatedTitle = uniqueTitle('Updated question');
  const res = await api.put(`/api/questions/edit/${q.body.data._id}`)
    .set(authHeader(user.token))
    .send({
      title: updatedTitle,
      content: 'Updated content that is also definitely long enough',
    });

  assert.equal(res.status, 200);
  assert.equal(res.body.data.title, updatedTitle);
});

test('question create rejects duplicate title', async () => {
  const user = await register();
  const title = uniqueTitle('Duplicate title');

  const first = await api.post('/api/questions/ask').set(authHeader(user.token)).send({
    title,
    content: 'First duplicate candidate content with enough chars',
  });
  assert.equal(first.status, 200);

  const second = await api.post('/api/questions/ask').set(authHeader(user.token)).send({
    title,
    content: 'Second duplicate candidate content with enough chars',
  });

  assert.equal(second.status, 400);
  assert.ok(second.body.message?.includes('Duplicate'));
});

test('POST /api/questions/:question_id/answers adds an answer', async () => {
  const user = await register();
  const q = await api.post('/api/questions/ask').set(authHeader(user.token)).send({
    title: uniqueTitle('Answerable question'),
    content: 'Question content that is long enough for answer posting',
  });

  const answerRes = await api.post(`/api/questions/${q.body.data._id}/answers`)
    .set(authHeader(user.token))
    .send({ content: 'This answer content is long enough' });

  assert.equal(answerRes.status, 200);
  assert.equal(answerRes.body.data.question, q.body.data._id);

  const answerCount = await Answer.countDocuments({ question: q.body.data._id });
  assert.equal(answerCount, 1);
});

test('GET /api/questions/:question_id/answers lists question answers', async () => {
  const user = await register();
  const q = await api.post('/api/questions/ask').set(authHeader(user.token)).send({
    title: uniqueTitle('List answers question'),
    content: 'Question content that is long enough for answer listing',
  });

  await api.post(`/api/questions/${q.body.data._id}/answers`)
    .set(authHeader(user.token))
    .send({ content: 'First answer content is long enough' });

  await api.post(`/api/questions/${q.body.data._id}/answers`)
    .set(authHeader(user.token))
    .send({ content: 'Second answer content is long enough' });

  const res = await api.get(`/api/questions/${q.body.data._id}/answers`);

  assert.equal(res.status, 200);
  assert.equal(res.body.count, 2);
  assert.equal(res.body.data.length, 2);
});

test('DELETE own question cascades answer cleanup', async () => {
  const user = await register();
  const q = await api.post('/api/questions/ask').set(authHeader(user.token)).send({
    title: uniqueTitle('Cascade delete question'),
    content: 'Question content that will be removed with answers attached',
  });

  await api.post(`/api/questions/${q.body.data._id}/answers`)
    .set(authHeader(user.token))
    .send({ content: 'Cascade answer content is long enough' });

  assert.equal(await Answer.countDocuments({ question: q.body.data._id }), 1);

  const del = await api.delete(`/api/questions/delete/${q.body.data._id}`).set(authHeader(user.token));
  assert.equal(del.status, 200);

  const get = await api.get(`/api/questions/${q.body.data._id}`);
  assert.equal(get.status, 400);
  assert.equal(await Answer.countDocuments({ question: q.body.data._id }), 0);
});

// ── Invalid ObjectId on users ──────────────────────

test('GET /api/users/:id rejects invalid ObjectId', async () => {
  const res = await api.get('/api/users/not-an-id');
  assert.equal(res.status, 400);
  assert.ok(res.body.message?.includes('valid id'));
});

// ── editDetails: email blocked ──────────────────────

test('editDetails rejects email field', async () => {
  const user = await register();
  const res = await api.put('/api/auth/edit').set(authHeader(user.token)).send({
    name: 'new name',
    email: 'hacked@example.com',
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.name, 'new name');
  assert.equal(res.body.data.email, user.email);
});

test('editDetails allows safe fields', async () => {
  const user = await register();
  const res = await api.put('/api/auth/edit').set(authHeader(user.token)).send({
    title: 'Engineer',
    about: 'Full-stack dev',
    place: 'Istanbul',
    website: 'https://example.com',
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.title, 'Engineer');
  assert.equal(res.body.data.about, 'Full-stack dev');
  assert.equal(res.body.data.place, 'Istanbul');
  assert.equal(res.body.data.website, 'https://example.com');
});
