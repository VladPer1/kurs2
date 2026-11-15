import { test, describe } from 'node:test';
import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000/api/v1';

describe('Courses Updates & Reviews API', () => {
  let studentToken = '';
  let adminToken = '';
  let student2Token = '';
  let createdCourseId = '';
  let createdReviewId = '';

  test('setup test tokens and find a course', async () => {
    // Login student 1
    const s1Login = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@course-platform.local', password: 'StudentPassword123!' }),
    });
    const s1Body = await s1Login.json();
    studentToken = s1Body.data.access_token;

    // Login student 2 (Anna)
    const s2Login = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'anna.student@course-platform.local', password: 'StudentPassword123!' }),
    });
    const s2Body = await s2Login.json();
    student2Token = s2Body.data.access_token;

    // Login admin
    const aLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@course-platform.local', password: 'AdminPassword123!' }),
    });
    const aBody = await aLogin.json();
    adminToken = aBody.data.access_token;

    // Get catalog to find a course
    const catalogRes = await fetch(`${BASE_URL}/courses`);
    const catalogBody = await catalogRes.json();
    assert.ok(catalogBody.data.length > 0);
    createdCourseId = catalogBody.data[0].id;
  });

  test('GET /api/v1/courses/:id returns duration, lessons_count, schedule and instructor profile', async () => {
    const res = await fetch(`${BASE_URL}/courses/${createdCourseId}`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    const course = body.data;
    assert.strictEqual(typeof course.duration, 'string');
    assert.strictEqual(typeof course.lessons_count, 'number');
    assert.strictEqual(typeof course.schedule, 'string');
    assert.ok(course.instructor);
    assert.strictEqual(typeof course.instructor.bio, 'string');
    assert.strictEqual(typeof course.instructor.specialization, 'string');
    assert.strictEqual(typeof course.instructor.rating, 'number');
  });

  test('GET /api/v1/courses/:id/reviews lists reviews with user.full_name', async () => {
    const res = await fetch(`${BASE_URL}/courses/${createdCourseId}/reviews`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    if (body.data.length > 0) {
      assert.ok(body.data[0].user);
      assert.strictEqual(typeof body.data[0].user.full_name, 'string');
    }
  });

  test('POST /api/v1/courses/:id/reviews adds review successfully', async () => {
    // Delete existing review from student if any
    const listRes = await fetch(`${BASE_URL}/courses/${createdCourseId}/reviews`);
    const listBody = await listRes.json();
    // We can use student2Token to avoid conflict with seeded reviews
    const res = await fetch(`${BASE_URL}/courses/${createdCourseId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${student2Token}`,
      },
      body: JSON.stringify({
        rating: 5,
        comment: 'Супер курс от студента 2!',
      }),
    });

    if (res.status === 201) {
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.rating, 5);
      assert.strictEqual(body.data.comment, 'Супер курс от студента 2!');
      assert.ok(body.data.user.full_name);
      createdReviewId = body.data.id;
    } else {
      // If already exists from prior test runs, 400 is also acceptable
      assert.strictEqual(res.status, 400);
    }
  });

  test('POST /api/v1/courses/:id/reviews forbids second review from same user (HTTP 400)', async () => {
    const res = await fetch(`${BASE_URL}/courses/${createdCourseId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${student2Token}`,
      },
      body: JSON.stringify({
        rating: 4,
        comment: 'Второй отзыв',
      }),
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'REVIEW_ALREADY_EXISTS');
  });

  test('PUT /api/v1/reviews/:id allows author to update review', async () => {
    if (!createdReviewId) return; // Skip if review was pre-existing
    const res = await fetch(`${BASE_URL}/reviews/${createdReviewId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${student2Token}`,
      },
      body: JSON.stringify({
        rating: 4,
        comment: 'Обновленный комментарий отзыва.',
      }),
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.rating, 4);
    assert.strictEqual(body.data.comment, 'Обновленный комментарий отзыва.');
  });

  test('DELETE /api/v1/reviews/:id allows admin or author to delete review', async () => {
    if (!createdReviewId) return;
    const res = await fetch(`${BASE_URL}/reviews/${createdReviewId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
  });
});
