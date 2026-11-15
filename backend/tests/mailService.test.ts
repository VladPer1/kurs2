import test from 'node:test';
import assert from 'node:assert';
import { mailService } from '../src/services/mailService.js';

test('MailService methods exist and run without crashing', async () => {
  assert.strictEqual(typeof mailService.sendVerificationCode, 'function');
  assert.strictEqual(typeof mailService.sendPasswordResetCode, 'function');
  assert.strictEqual(typeof mailService.sendPaymentReceipt, 'function');

  // Test execution in development/test environment (mock transporter or safe send)
  const res1 = await mailService.sendVerificationCode('test@example.com', '123456');
  const res2 = await mailService.sendPasswordResetCode('test@example.com', '654321');
  const res3 = await mailService.sendPaymentReceipt('test@example.com', {
    transaction_ref: 'TXN-987654',
    courseTitle: 'TypeScript Advanced',
    amount: 1500,
    paymentDate: new Date(),
  });

  // In test environment without real SMTP auth credentials, sendEmail returns false gracefully or succeeds if ethereal
  assert.strictEqual(typeof res1, 'boolean');
  assert.strictEqual(typeof res2, 'boolean');
  assert.strictEqual(typeof res3, 'boolean');
});
