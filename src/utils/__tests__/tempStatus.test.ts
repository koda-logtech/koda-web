import { describe, it, expect } from 'vitest';
import { getTempStatus, TEMP_STATUS_BAND_FRACTION } from '../tempStatus';

describe('tempStatus utility', () => {
  it('should export correct TEMP_STATUS_BAND_FRACTION constant', () => {
    expect(TEMP_STATUS_BAND_FRACTION).toBe(0.1);
  });

  describe('getTempStatus', () => {
    const min = 2;
    const max = 8;

    it('should return "crit" when temperature is below min', () => {
      expect(getTempStatus(1.9, min, max)).toBe('crit');
      expect(getTempStatus(-5, min, max)).toBe('crit');
    });

    it('should return "crit" when temperature is above max', () => {
      expect(getTempStatus(8.1, min, max)).toBe('crit');
      expect(getTempStatus(15, min, max)).toBe('crit');
    });

    it('should return "warn" when temperature is within the lower margin band', () => {
      expect(getTempStatus(2.0, min, max)).toBe('warn');
      expect(getTempStatus(2.5, min, max)).toBe('warn');
    });

    it('should return "warn" when temperature is within the upper margin band', () => {
      expect(getTempStatus(7.5, min, max)).toBe('warn');
      expect(getTempStatus(8.0, min, max)).toBe('warn');
    });

    it('should return "ok" when temperature is comfortably inside safe limits', () => {
      expect(getTempStatus(5.0, min, max)).toBe('ok');
      expect(getTempStatus(3.0, min, max)).toBe('ok');
      expect(getTempStatus(7.0, min, max)).toBe('ok');
    });

    it('should return "ok" if span is zero or inverted but value matches', () => {
      expect(getTempStatus(5, 5, 5)).toBe('ok');
    });
  });
});
