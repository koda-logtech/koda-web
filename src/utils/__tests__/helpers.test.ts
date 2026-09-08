import { describe, it, expect } from 'vitest';
import {
  truncateText,
  capitalize,
  isValidEmail,
  getApiErrorMessage,
} from '../helpers';

describe('helpers utility', () => {
  describe('truncateText', () => {
    it('should truncate string longer than maxLength and append ellipsis', () => {
      expect(truncateText('Hello World', 5)).toBe('Hello...');
    });

    it('should return original string when length is less than or equal to maxLength', () => {
      expect(truncateText('Hello', 5)).toBe('Hello');
      expect(truncateText('Hi', 5)).toBe('Hi');
    });
  });

  describe('capitalize', () => {
    it('should capitalize the first letter', () => {
      expect(capitalize('motorista')).toBe('Motorista');
      expect(capitalize('caminhao')).toBe('Caminhao');
    });

    it('should handle single character string', () => {
      expect(capitalize('a')).toBe('A');
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@koda.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false);
    });
  });

  describe('getApiErrorMessage', () => {
    it('should extract error message from standard Error', () => {
      const error = new Error('Falha na conexão');
      expect(getApiErrorMessage(error)).toBe('Falha na conexão');
    });

    it('should convert primitive values to string', () => {
      expect(getApiErrorMessage('Erro customizado')).toBe('Erro customizado');
      expect(getApiErrorMessage(500)).toBe('500');
    });
  });
});
