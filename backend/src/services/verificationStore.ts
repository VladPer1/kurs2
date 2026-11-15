import { logger } from '../config/logger.js';

export interface VerificationRecord {
  code: string;
  data: any;
  attempts: number;
  timer: NodeJS.Timeout;
  expiresAt: number;
}

export class VerificationStore {
  private static store = new Map<string, VerificationRecord>();
  private static readonly DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes (600 seconds)
  private static readonly MAX_ATTEMPTS = 5;

  /**
   * Store verification code with temporary user data and TTL (default 10 min)
   * @param identifier - Unique key (e.g. email or phone)
   * @param code - Verification code (e.g. 6-digit string)
   * @param data - Temporary user payload data
   * @param ttlMs - Optional custom TTL in milliseconds (default 600000 ms)
   */
  static set(identifier: string, code: string, data: any, ttlMs: number = VerificationStore.DEFAULT_TTL_MS): void {
    // Clear existing entry and its timeout if any exists for this identifier
    VerificationStore.remove(identifier);

    const expiresAt = Date.now() + ttlMs;
    const timer = setTimeout(() => {
      VerificationStore.remove(identifier);
      logger.info(`Verification store TTL expired for identifier: ${identifier}`);
    }, ttlMs);

    if (timer.unref) {
      timer.unref();
    }

    VerificationStore.store.set(identifier, {
      code,
      data,
      attempts: 0,
      timer,
      expiresAt,
    });

    logger.info(`Verification record stored for identifier: ${identifier} (TTL: ${ttlMs}ms)`);
  }

  /**
   * Get raw record for inspection (if needed)
   */
  static get(identifier: string): { code: string; data: any; attempts: number; expiresAt: number } | null {
    const record = VerificationStore.store.get(identifier);
    if (!record) return null;

    if (Date.now() > record.expiresAt) {
      VerificationStore.remove(identifier);
      return null;
    }

    return {
      code: record.code,
      data: record.data,
      attempts: record.attempts,
      expiresAt: record.expiresAt,
    };
  }

  /**
   * Verify code for given identifier.
   * Checks expiration, increments failed attempt counter (max 5),
   * and clears record upon successful verification or max attempts reached.
   */
  static verify(identifier: string, inputCode: string): {
    success: boolean;
    error?: string;
    data?: any;
    attemptsLeft?: number;
  } {
    const record = VerificationStore.store.get(identifier);

    if (!record || Date.now() > record.expiresAt) {
      if (record) {
        VerificationStore.remove(identifier);
      }
      return {
        success: false,
        error: 'Код подтверждения не найден или истек срок его действия.',
      };
    }

    // Check attempts limit
    if (record.attempts >= VerificationStore.MAX_ATTEMPTS) {
      VerificationStore.remove(identifier);
      return {
        success: false,
        error: 'Превышено максимальное количество неудачных попыток (5). Запросите новый код.',
      };
    }

    // Validate code
    if (record.code !== inputCode) {
      record.attempts += 1;
      const attemptsLeft = VerificationStore.MAX_ATTEMPTS - record.attempts;

      if (record.attempts >= VerificationStore.MAX_ATTEMPTS) {
        VerificationStore.remove(identifier);
        return {
          success: false,
          error: 'Превышено максимальное количество неудачных попыток (5). Запросите новый код.',
          attemptsLeft: 0,
        };
      }

      return {
        success: false,
        error: `Неверный код подтверждения. Осталось попыток: ${attemptsLeft}.`,
        attemptsLeft,
      };
    }

    // Success! Consume code (single-use) and return stored data
    const userData = record.data;
    VerificationStore.remove(identifier);

    return {
      success: true,
      data: userData,
    };
  }

  /**
   * Remove verification record and clear its timeout
   */
  static remove(identifier: string): boolean {
    const record = VerificationStore.store.get(identifier);
    if (record) {
      if (record.timer) {
        clearTimeout(record.timer);
      }
      return VerificationStore.store.delete(identifier);
    }
    return false;
  }

  /**
   * Clear all records and timers (useful for tests)
   */
  static clear(): void {
    for (const [identifier] of VerificationStore.store.entries()) {
      VerificationStore.remove(identifier);
    }
    VerificationStore.store.clear();
  }

  /**
   * Get total active records count
   */
  static size(): number {
    return VerificationStore.store.size;
  }
}

