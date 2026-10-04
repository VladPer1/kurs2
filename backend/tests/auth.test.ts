import { test, describe } from 'node:test';
import assert from 'node:assert';
import { AuthService } from '../src/services/authService.js';

const BASE_URL = 'http://localhost:3000/api/v1';

describe('Auth Service & Endpoints', () => {
  describe('Unit: AuthService Password & JWT', () => {
    test('hashes password using bcrypt with minimum salt rounds and verifies correctly', async () => {
      const rawPassword = 'SecretP@ssw0rd2026!';
      const hash = await AuthService.hashPassword(rawPassword);

      assert.ok(hash.startsWith('$2'), 'Hash should be standard bcrypt format');
      assert.ok(await AuthService.comparePassword(rawPassword, hash), 'Correct password should match');
      assert.ok(!(await AuthService.comparePassword('WrongPassword', hash)), 'Wrong password should fail');
    });

    test('generates and decodes access token with roles and permissions payload', () => {
      const payload = {
        userId: 'test-usr-1',
        email: 'test@example.com',
        role: 'manager',
        permissions: ['courses:create', 'users:view_all'],
      };

      const token = AuthService.generateAccessToken(payload);
      assert.ok(token, 'Access token generated');

      const refreshToken = AuthService.generateRefreshToken({ userId: payload.userId });
      assert.ok(refreshToken, 'Refresh token generated');

      const verifiedRefresh = AuthService.verifyRefreshToken(refreshToken);
      assert.strictEqual(verifiedRefresh.userId, payload.userId);
    });
  });

  describe('Integration: User Registration & Role Enforcement', () => {
    test('registers student with explicit role: "student"', async () => {
      const timestamp = Date.now();
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `student_${timestamp}@test.local`,
          password: 'Password123!',
          full_name: 'Тестовый Студент',
          role: 'student',
        }),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.access_token, 'access_token should exist in snake_case');
      assert.strictEqual(body.data.user.role.name, 'student', 'User role should be student');
      assert.ok(Array.isArray(body.data.user.role.permissions), 'Permissions array must be present');
    });

    test('forbids instructor registration via public student registration endpoint (HTTP 403)', async () => {
      const timestamp = Date.now();
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `unauthorized_instr_${timestamp}@test.local`,
          password: 'Password123!',
          full_name: 'Попытка Инструктора',
          role: 'instructor',
        }),
      });

      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'FORBIDDEN_ROLE_CREATION');
    });

    test('forbids admin registration via public student registration endpoint (HTTP 403)', async () => {
      const timestamp = Date.now();
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `unauthorized_admin_${timestamp}@test.local`,
          password: 'Password123!',
          full_name: 'Попытка Админа',
          role: 'admin',
        }),
      });

      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'FORBIDDEN_ROLE_CREATION');
    });

    test('allows admin to create instructor via POST /users (HTTP 201)', async () => {
      // 1. Login as admin
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@course-platform.local',
          password: 'AdminPassword123!',
        }),
      });
      const loginBody = await loginRes.json();
      const adminToken = loginBody.data.access_token;

      // 2. Admin creates instructor
      const timestamp = Date.now();
      const createRes = await fetch(`${BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          email: `instructor_${timestamp}@test.local`,
          password: 'Password123!',
          full_name: 'Алексей Преподаватель',
          role: 'instructor',
          bio: 'Специалист по распределенным системам',
          specialization: 'Go & Kubernetes',
        }),
      });

      assert.strictEqual(createRes.status, 201);
      const createBody = await createRes.json();
      assert.strictEqual(createBody.success, true);
      assert.strictEqual(createBody.data.role.name, 'instructor');
      assert.ok(createBody.data.instructor_profile, 'Instructor profile should be created');
    });

    test('allows admin to create another admin via POST /users (HTTP 201)', async () => {
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@course-platform.local',
          password: 'AdminPassword123!',
        }),
      });
      const loginBody = await loginRes.json();
      const adminToken = loginBody.data.access_token;

      const timestamp = Date.now();
      const createRes = await fetch(`${BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          email: `new_admin_${timestamp}@test.local`,
          password: 'Password123!',
          full_name: 'Второй Администратор',
          role: 'admin',
        }),
      });

      assert.strictEqual(createRes.status, 201);
      const createBody = await createRes.json();
      assert.strictEqual(createBody.success, true);
      assert.strictEqual(createBody.data.role.name, 'admin');
    });

    test('forbids non-admin (student) from creating staff via POST /users (HTTP 403)', async () => {
      // 1. Login as student
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'student@course-platform.local',
          password: 'StudentPassword123!',
        }),
      });
      const loginBody = await loginRes.json();
      const studentToken = loginBody.data.access_token;

      // 2. Student attempts to create instructor
      const createRes = await fetch(`${BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          email: `hacked_instr_${Date.now()}@test.local`,
          password: 'Password123!',
          full_name: 'Фейковый Инструктор',
          role: 'instructor',
        }),
      });

      assert.strictEqual(createRes.status, 403);
    });

    test('admin successfully deletes user via DELETE /users/:id (HTTP 200)', async () => {
      // 1. Login as admin
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@course-platform.local',
          password: 'AdminPassword123!',
        }),
      });
      const loginBody = await loginRes.json();
      const adminToken = loginBody.data.access_token;

      // 2. Register temporary student to delete
      const tempEmail = `to_delete_${Date.now()}@test.local`;
      const regRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: tempEmail,
          password: 'Password123!',
          full_name: 'Временный Пользователь',
          role: 'student',
        }),
      });
      const regBody = await regRes.json();
      const userIdToDelete = regBody.data.user.id;

      // 3. Admin deletes the user
      const deleteRes = await fetch(`${BASE_URL}/users/${userIdToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      assert.strictEqual(deleteRes.status, 200);
      const delBody = await deleteRes.json();
      assert.strictEqual(delBody.success, true);
      assert.strictEqual(delBody.data.id, userIdToDelete);

      // 4. Verify user no longer exists
      const verifyRes = await fetch(`${BASE_URL}/users/${userIdToDelete}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      assert.strictEqual(verifyRes.status, 404);
    });

    test('forbids non-admin (student) from deleting user via DELETE /users/:id (HTTP 403)', async () => {
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'student@course-platform.local',
          password: 'StudentPassword123!',
        }),
      });
      const loginBody = await loginRes.json();
      const studentToken = loginBody.data.access_token;

      const deleteRes = await fetch(`${BASE_URL}/users/fake-id-123`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${studentToken}`,
        },
      });

      assert.strictEqual(deleteRes.status, 403);
    });

    test('prevents admin from deleting own account (HTTP 400)', async () => {
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@course-platform.local',
          password: 'AdminPassword123!',
        }),
      });
      const loginBody = await loginRes.json();
      const adminToken = loginBody.data.access_token;
      const adminId = loginBody.data.user.id;

      const deleteRes = await fetch(`${BASE_URL}/users/${adminId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      assert.strictEqual(deleteRes.status, 400);
      const delBody = await deleteRes.json();
      assert.strictEqual(delBody.error.code, 'CANNOT_DELETE_SELF');
    });

    test('fails registration if role is invalid (HTTP 400)', async () => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `badrole_${Date.now()}@test.local`,
          password: 'Password123!',
          full_name: 'Хакер',
          role: 'super_admin',
        }),
      });

      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.ok(
        body.error.details.some((d: string) => d.includes('Недопустимая роль')),
        'Error details must mention invalid role'
      );
    });

    test('fails registration on duplicate email (HTTP 409)', async () => {
      const email = `dupl_${Date.now()}@test.local`;
      const registerPayload = {
        email,
        password: 'Password123!',
        full_name: 'Первый',
        role: 'student',
      };

      const res1 = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerPayload),
      });
      assert.strictEqual(res1.status, 201);

      const res2 = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerPayload),
      });
      assert.strictEqual(res2.status, 409);
      const body2 = await res2.json();
      assert.strictEqual(body2.error.code, 'USER_ALREADY_EXISTS');
    });
  });

  describe('Integration: Login & Brute-force Protection (OWASP Requirement)', () => {
    test('successful login returns access_token and user info', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@course-platform.local',
          password: 'AdminPassword123!',
        }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.ok(body.data.access_token);
      assert.strictEqual(body.data.user.role.name, 'admin');
    });

    test('failed login attempts decrement attempts_left and locks account after 5 attempts', async () => {
      const targetEmail = `brute_target_${Date.now()}@test.local`;
      // Register user first
      await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          password: 'CorrectPassword123!',
          full_name: 'Жертва Брутфорса',
          role: 'student',
        }),
      });

      // 4 failed attempts
      for (let i = 1; i <= 4; i++) {
        const fRes = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail, password: 'WrongPassword!' }),
        });
        assert.strictEqual(fRes.status, 401);
        const fBody = await fRes.json();
        assert.strictEqual(fBody.error.attempts_left, 5 - i);
      }

      // 5th failed attempt -> account locked (423 Locked)
      const lockRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: 'WrongPassword!' }),
      });
      assert.strictEqual(lockRes.status, 423);
      const lockBody = await lockRes.json();
      assert.strictEqual(lockBody.error.code, 'ACCOUNT_LOCKED');
      assert.ok(lockBody.error.lock_until, 'lock_until must be present in snake_case');
    });
  });
});
