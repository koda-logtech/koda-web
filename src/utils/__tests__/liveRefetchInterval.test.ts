import { describe, expect, it } from 'vitest';
import { liveRefetchInterval } from '@/utils/liveRefetchInterval';

describe('liveRefetchInterval', () => {
  it('desliga polling quando Realtime está saudável', () => {
    expect(liveRefetchInterval(15_000, true)).toBe(false);
  });

  it('mantém intervalo legado quando Realtime falhou', () => {
    expect(liveRefetchInterval(10_000, false)).toBe(10_000);
  });
});
