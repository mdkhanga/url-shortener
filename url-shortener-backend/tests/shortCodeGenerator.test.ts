import { ShortCodeGenerator } from '../src/utils/shortCodeGenerator';

describe('ShortCodeGenerator', () => {
  describe('generate', () => {
    test('should generate a string of default length 6', () => {
      const code = ShortCodeGenerator.generate();
      
      expect(typeof code).toBe('string');
      expect(code.length).toBe(6);
    });

    test('should generate a string of specified length', () => {
      const code = ShortCodeGenerator.generate(10);
      
      expect(typeof code).toBe('string');
      expect(code.length).toBe(10);
    });

    test('should generate different values on multiple calls', () => {
      const codes = new Set();
      
      // Generate multiple codes to test uniqueness
      for (let i = 0; i < 100; i++) {
        codes.add(ShortCodeGenerator.generate());
      }
      
      // Should have generated mostly unique codes (allowing for tiny chance of collision)
      expect(codes.size).toBeGreaterThan(95);
    });

    test('should handle length 1', () => {
      const code = ShortCodeGenerator.generate(1);
      
      expect(typeof code).toBe('string');
      expect(code.length).toBe(1);
    });

    test('should handle length 0', () => {
      const code = ShortCodeGenerator.generate(0);
      
      expect(typeof code).toBe('string');
      expect(code.length).toBe(0);
      expect(code).toBe('');
    });

    test('should handle large lengths', () => {
      const code = ShortCodeGenerator.generate(50);
      
      expect(typeof code).toBe('string');
      expect(code.length).toBe(50);
    });

    test('should generate codes with URL-safe characters only', () => {
      const codes = Array.from({ length: 20 }, () => ShortCodeGenerator.generate(20));
      const urlSafePattern = /^[A-Za-z0-9_-]+$/;
      
      codes.forEach(code => {
        expect(urlSafePattern.test(code)).toBe(true);
      });
    });

    test('should consistently return strings', () => {
      for (let i = 0; i < 10; i++) {
        const code = ShortCodeGenerator.generate();
        expect(typeof code).toBe('string');
      }
    });

    test('should handle edge case lengths consistently', () => {
      expect(ShortCodeGenerator.generate(1).length).toBe(1);
      expect(ShortCodeGenerator.generate(2).length).toBe(2);
      expect(ShortCodeGenerator.generate(3).length).toBe(3);
    });

    test('should generate codes that are statistically random', () => {
      const codes = Array.from({ length: 1000 }, () => ShortCodeGenerator.generate(1));
      const charCounts: Record<string, number> = {};
      
      codes.forEach(code => {
        charCounts[code] = (charCounts[code] || 0) + 1;
      });
      
      // Should have reasonable distribution (not all the same character)
      const uniqueChars = Object.keys(charCounts).length;
      expect(uniqueChars).toBeGreaterThan(10); // Should see variety in single characters
    });

    test('should generate codes suitable for URLs', () => {
      const codes = Array.from({ length: 50 }, () => ShortCodeGenerator.generate());
      
      codes.forEach(code => {
        // Should not contain characters that need URL encoding
        expect(code).not.toMatch(/[^A-Za-z0-9_-]/);
        // Should not be empty
        expect(code.length).toBeGreaterThan(0);
      });
    });
  });

  describe('isValidCustomCode', () => {
    describe('valid custom codes', () => {
      test('should return true for valid alphanumeric codes', () => {
        expect(ShortCodeGenerator.isValidCustomCode('abc123')).toBe(true);
        expect(ShortCodeGenerator.isValidCustomCode('TEST123')).toBe(true);
        expect(ShortCodeGenerator.isValidCustomCode('myCode456')).toBe(true);
        expect(ShortCodeGenerator.isValidCustomCode('123456')).toBe(true);
        expect(ShortCodeGenerator.isValidCustomCode('ABCDEF')).toBe(true);
        expect(ShortCodeGenerator.isValidCustomCode('abcdef')).toBe(true);
      });


      test('should return true for codes at maximum length boundary', () => {
        const maxLengthCode = 'a'.repeat(20);
        expect(ShortCodeGenerator.isValidCustomCode(maxLengthCode)).toBe(true);
      });

      test('should return true for mixed case codes', () => {
        expect(ShortCodeGenerator.isValidCustomCode('MyCustomCode123')).toBe(true);
        expect(ShortCodeGenerator.isValidCustomCode('testCODE456')).toBe(true);
      });
    });

    describe('invalid input types', () => {
      test('should return false for non-string input', () => {
        expect(ShortCodeGenerator.isValidCustomCode(123 as any)).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode(null as any)).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode(undefined as any)).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode({} as any)).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode([] as any)).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode(true as any)).toBe(false);
      });

      test('should return false for empty string', () => {
        expect(ShortCodeGenerator.isValidCustomCode('')).toBe(false);
      });

      test('should return false for whitespace-only strings', () => {
        expect(ShortCodeGenerator.isValidCustomCode(' ')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('  ')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('\t')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('\n')).toBe(false);
      });
    });

    describe('length validation', () => {
      test('should return false for codes that are too short', () => {
        expect(ShortCodeGenerator.isValidCustomCode('ab')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('a')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('12')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('X')).toBe(false);
      });

      test('should return false for codes that are too long', () => {
        const tooLongCode = 'a'.repeat(21);
        expect(ShortCodeGenerator.isValidCustomCode(tooLongCode)).toBe(false);
        
        const wayTooLongCode = 'a'.repeat(100);
        expect(ShortCodeGenerator.isValidCustomCode(wayTooLongCode)).toBe(false);
      });
    });

    describe('character validation', () => {
      test('should return false for codes with special characters', () => {
        expect(ShortCodeGenerator.isValidCustomCode('test@code')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('test#code')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('test$code')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('test%code')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('test&code')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('test*code')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('test+code')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('test=code')).toBe(false);
      });

      test('should return false for codes with hyphens/underscores', () => {
        expect(ShortCodeGenerator.isValidCustomCode('test-code')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('test_code')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('my-custom-code')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('my_custom_code')).toBe(false);
      });

      test('should return false for codes with spaces', () => {
        expect(ShortCodeGenerator.isValidCustomCode('test code')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode(' testcode')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('testcode ')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('test code test')).toBe(false);
      });

      test('should return false for codes with punctuation', () => {
        expect(ShortCodeGenerator.isValidCustomCode('test.code')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('test,code')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('test;code')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('test:code')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('test!code')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('test?code')).toBe(false);
      });

      test('should return false for codes with brackets/parentheses', () => {
        expect(ShortCodeGenerator.isValidCustomCode('test(code)')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('test[code]')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('test{code}')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('test<code>')).toBe(false);
      });

      test('should return false for codes with quotes', () => {
        expect(ShortCodeGenerator.isValidCustomCode("test'code")).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('test"code')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('test`code')).toBe(false);
      });

      test('should return false for codes with slashes', () => {
        expect(ShortCodeGenerator.isValidCustomCode('test/code')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('test\\code')).toBe(false);
      });
    });

    describe('reserved words validation', () => {
      test('should return false for exact reserved words in lowercase', () => {
        expect(ShortCodeGenerator.isValidCustomCode('api')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('admin')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('www')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('app')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('dashboard')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('health')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('status')).toBe(false);
      });

      test('should return false for reserved words in uppercase', () => {
        expect(ShortCodeGenerator.isValidCustomCode('API')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('ADMIN')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('WWW')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('APP')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('DASHBOARD')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('HEALTH')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('STATUS')).toBe(false);
      });

      test('should return false for reserved words in mixed case', () => {
        expect(ShortCodeGenerator.isValidCustomCode('Api')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('Admin')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('Www')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('App')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('Dashboard')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('Health')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('Status')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('aPi')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('aDmIn')).toBe(false);
      });

      test('should return true for codes that contain but are not exactly reserved words', () => {
        expect(ShortCodeGenerator.isValidCustomCode('api123')).toBe(true);
        expect(ShortCodeGenerator.isValidCustomCode('admin456')).toBe(true);
        expect(ShortCodeGenerator.isValidCustomCode('myapp')).toBe(true);
        expect(ShortCodeGenerator.isValidCustomCode('apptest')).toBe(true);
        expect(ShortCodeGenerator.isValidCustomCode('dashboardapp')).toBe(true);
        expect(ShortCodeGenerator.isValidCustomCode('healthcheck')).toBe(true);
        expect(ShortCodeGenerator.isValidCustomCode('statuscode')).toBe(true);
        expect(ShortCodeGenerator.isValidCustomCode('wwwtest')).toBe(true);
      });
    });

    describe('edge cases', () => {
      test('should handle Unicode characters', () => {
        expect(ShortCodeGenerator.isValidCustomCode('test😀')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('tëst')).toBe(false);
        expect(ShortCodeGenerator.isValidCustomCode('测试')).toBe(false);
      });

      test('should handle codes with only numbers', () => {
        expect(ShortCodeGenerator.isValidCustomCode('123')).toBe(true);
        expect(ShortCodeGenerator.isValidCustomCode('1234567890')).toBe(true);
      });

      test('should handle codes with only letters', () => {
        expect(ShortCodeGenerator.isValidCustomCode('abc')).toBe(true);
        expect(ShortCodeGenerator.isValidCustomCode('ABCDEF')).toBe(true);
        expect(ShortCodeGenerator.isValidCustomCode('abcDEF')).toBe(true);
      });

      test('should be consistent across multiple calls with same input', () => {
        const testCode = 'testCode123';
        expect(ShortCodeGenerator.isValidCustomCode(testCode)).toBe(true);
        expect(ShortCodeGenerator.isValidCustomCode(testCode)).toBe(true);
        expect(ShortCodeGenerator.isValidCustomCode(testCode)).toBe(true);
      });
    });
  });

  describe('constants and behavior verification', () => {
    test('should enforce correct maximum length for custom codes', () => {
      const exactlyMaxLength = 'a'.repeat(20);
      const overMaxLength = 'a'.repeat(21);
      
      expect(ShortCodeGenerator.isValidCustomCode(exactlyMaxLength)).toBe(true);
      expect(ShortCodeGenerator.isValidCustomCode(overMaxLength)).toBe(false);
    });

    test('should use default length of 6 when no parameter provided', () => {
      const code = ShortCodeGenerator.generate();
      expect(code.length).toBe(6);
    });
  });
});
