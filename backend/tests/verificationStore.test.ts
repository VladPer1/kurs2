import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { VerificationStore } from '../src/services/verificationStore.js';

describe('VerificationStore Service (In-Memory Map with TTL & Attempts)', () => {
  const testEmail = 'user@example.com';
  const testCode = '123456';
  const testData = { email: testEmail, full_name: 'Test User', password: 'hashedpassword' };

  beforeEach(() => {
    VerificationStore.clear();
  });

  afterEach(() => {
    VerificationStore.clear();
  });

  test('should successfully set and get verification record', () => {
    VerificationStore.set(testEmail, testCode, testData);
    
    const record = VerificationStore.get(testEmail);
    assert.notStrictEqual(record, null);
    assert.strictEqual(record?.code, testCode);
    assert.deepStrictEqual(record?.data, testData);
    assert.strictEqual(record?.attempts, 0);
  });

  test('should successfully verify correct code on first attempt and consume it', () => {
    VerificationStore.set(testEmail, testCode, testData);

    const result = VerificationStore.verify(testEmail, testCode);
    assert.strictEqual(result.success, true);
    assert.deepStrictEqual(result.data, testData);

    // Code should be consumed (deleted after success)
    const afterVerify = VerificationStore.get(testEmail);
    assert.strictEqual(afterVerify, null);
  });

  test('should handle incorrect code and track failed attempts', () => {
    VerificationStore.set(testEmail, testCode, testData);

    // Attempt 1 with wrong code
    const res1 = VerificationStore.verify(testEmail, '999999');
    assert.strictEqual(res1.success, false);
    assert.strictEqual(res1.attemptsLeft, 4);

    // Attempt 2 with wrong code
    const res2 = VerificationStore.verify(testEmail, '888888');
    assert.strictEqual(res2.success, false);
    assert.strictEqual(res2.attemptsLeft, 3);

    // Verify correct code should still work before max attempts
    const resSuccess = VerificationStore.verify(testEmail, testCode);
    assert.strictEqual(resSuccess.success, true);
    assert.deepStrictEqual(resSuccess.data, testData);
  });

  test('should lock/remove record after 5 failed attempts', () => {
    VerificationStore.set(testEmail, testCode, testData);

    // 5 wrong attempts
    for (let i = 0; i < 4; i++) {
      const res = VerificationStore.verify(testEmail, '000000');
      assert.strictEqual(res.success, false);
    }

    // 5th wrong attempt should block/remove record
    const res5 = VerificationStore.verify(testEmail, '000000');
    assert.strictEqual(res5.success, false);
    assert.ok(res5.error?.includes('Превышено максимальное количество неудачных попыток'));

    // Record should now be deleted
    const record = VerificationStore.get(testEmail);
    assert.strictEqual(record, null);

    // Even if correct code is entered afterwards, it fails
    const resAfter = VerificationStore.verify(testEmail, testCode);
    assert.strictEqual(resAfter.success, false);
  });

  test('should handle non-existent or expired records gracefully', () => {
    const result = VerificationStore.verify('nonexistent@example.com', '123456');
    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('не найден или истек'));
  });

  test('should support custom TTL', async () => {
    // Set TTL to 100ms for quick testing
    VerificationStore.set(testEmail, testCode, testData, 100);

    const recordBefore = VerificationStore.get(testEmail);
    assert.notStrictEqual(recordBefore, null);

    // Wait for TTL expiration
    await new Promise((resolve) => setTimeout(resolve, 150));

    const recordAfter = VerificationStore.get(testEmail);
    assert.strictEqual(recordAfter, null);
  });
});
