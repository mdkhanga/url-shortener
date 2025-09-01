import { nanoid } from 'nanoid';

export class ShortCodeGenerator {
  private static readonly DEFAULT_LENGTH = 6;
  private static readonly CUSTOM_CODE_MAX_LENGTH = 20;
  private static readonly ALLOWED_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  static generate(length: number = this.DEFAULT_LENGTH): string {
    return nanoid(length);
  }

  static isValidCustomCode(code: string): boolean {
    if (!code || typeof code !== 'string') {
      return false;
    }

    if (code.length < 3 || code.length > this.CUSTOM_CODE_MAX_LENGTH) {
      return false;
    }

    // alphanumeric only
    const allowedPattern = /^[a-zA-Z0-9]+$/;
    if (!allowedPattern.test(code)) {
      return false;
    }


    const reservedWords = ['api', 'admin', 'www', 'app', 'dashboard', 'health', 'status'];
    if (reservedWords.includes(code.toLowerCase())) {
      return false;
    }

    return true;
  }
}
