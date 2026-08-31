import { decimalsForStep, formatNumber, generateNumberRange, roundToStep, snapToNearest } from '../src/range';

describe('decimalsForStep', () => {
  it('returns 0 for whole-number steps', () => {
    expect(decimalsForStep(1)).toBe(0);
    expect(decimalsForStep(5)).toBe(0);
  });

  it('counts decimal places', () => {
    expect(decimalsForStep(0.5)).toBe(1);
    expect(decimalsForStep(0.25)).toBe(2);
    expect(decimalsForStep(0.001)).toBe(3);
  });

  it('treats non-positive or non-finite steps as 0 decimals', () => {
    expect(decimalsForStep(0)).toBe(0);
    expect(decimalsForStep(-1)).toBe(0);
    expect(decimalsForStep(NaN)).toBe(0);
    expect(decimalsForStep(Infinity)).toBe(0);
  });
});

describe('roundToStep', () => {
  it('corrects float drift', () => {
    expect(roundToStep(0.1 + 0.2, 1)).toBe(0.3);
    expect(roundToStep(19.999999999999996, 1)).toBe(20);
  });
});

describe('generateNumberRange', () => {
  it('generates an inclusive integer range', () => {
    expect(generateNumberRange(0, 5, 1)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('respects a larger step', () => {
    expect(generateNumberRange(0, 100, 25)).toEqual([0, 25, 50, 75, 100]);
  });

  it('handles fractional steps without float drift', () => {
    expect(generateNumberRange(0, 2, 0.5)).toEqual([0, 0.5, 1, 1.5, 2]);
  });

  it('always includes max even when the span is not an exact multiple of step', () => {
    expect(generateNumberRange(0, 10, 3)).toEqual([0, 3, 6, 9, 10]);
  });

  it('supports a non-zero min', () => {
    expect(generateNumberRange(60, 80, 5)).toEqual([60, 65, 70, 75, 80]);
  });

  it('falls back to a single-value range for invalid input', () => {
    expect(generateNumberRange(5, 5, 1)).toEqual([5]);
    expect(generateNumberRange(10, 0, 1)).toEqual([10]);
    expect(generateNumberRange(0, 10, 0)).toEqual([0]);
    expect(generateNumberRange(0, 10, -1)).toEqual([0]);
  });
});

describe('formatNumber', () => {
  it('formats with the requested decimal precision', () => {
    expect(formatNumber(5, 0)).toBe('5');
    expect(formatNumber(5.5, 1)).toBe('5.5');
    expect(formatNumber(5, 2)).toBe('5.00');
  });

  it('appends a unit when provided', () => {
    expect(formatNumber(72, 0, '°F')).toBe('72 °F');
    expect(formatNumber(50, 0, '%')).toBe('50 %');
  });

  it('omits the trailing space when no unit is given', () => {
    expect(formatNumber(10, 0, undefined)).toBe('10');
    expect(formatNumber(10, 0, '')).toBe('10');
  });
});

describe('snapToNearest', () => {
  const values = [0, 5, 10, 15, 20];

  it('returns an exact match unchanged', () => {
    expect(snapToNearest(10, values)).toBe(10);
  });

  it('snaps to the nearest value', () => {
    expect(snapToNearest(11, values)).toBe(10);
    expect(snapToNearest(14, values)).toBe(15);
  });

  it('clamps values outside the range to the nearest end', () => {
    expect(snapToNearest(-100, values)).toBe(0);
    expect(snapToNearest(100, values)).toBe(20);
  });

  it('breaks exact ties toward the first (lower) candidate', () => {
    expect(snapToNearest(12.5, values)).toBe(10);
  });
});
