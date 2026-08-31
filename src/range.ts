/** Number of decimal places implied by a step value (e.g. 0.5 -> 1, 1 -> 0, 0.25 -> 2). */
export function decimalsForStep(step: number): number {
  if (!isFinite(step) || step <= 0) {
    return 0;
  }

  const str = step.toString();
  const dotIndex = str.indexOf('.');
  return dotIndex === -1 ? 0 : str.length - dotIndex - 1;
}

/** Rounds to a fixed number of decimals, correcting the float drift plain arithmetic accumulates. */
export function roundToStep(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Generates the linear (non-wrapping) sequence of selectable values between min and max,
 * inclusive, stepping by `step`. Unlike a clock's hour/minute wheel, a bounded numeric range
 * has no reason to wrap around - it stops at each end. The final value is clamped to `max`
 * even when `max - min` isn't an exact multiple of `step`, so `max` is always reachable.
 */
export function generateNumberRange(min: number, max: number, step: number): number[] {
  if (!isFinite(min) || !isFinite(max) || !isFinite(step) || step <= 0 || max <= min) {
    return [min];
  }

  const decimals = decimalsForStep(step);
  const count = Math.floor(roundToStep((max - min) / step, 6));
  const values: number[] = [];

  for (let i = 0; i <= count; i++) {
    values.push(roundToStep(min + i * step, decimals));
  }

  if (values[values.length - 1] < max) {
    values.push(roundToStep(max, decimals));
  }

  return values;
}

export function formatNumber(value: number, decimals: number, unit?: string): string {
  const formatted = value.toFixed(decimals);
  return unit ? `${formatted} ${unit}` : formatted;
}

/** Finds the closest value in `values` to `value` - used to snap an entity's raw state onto the wheel's steps. */
export function snapToNearest(value: number, values: number[]): number {
  let closest = values[0];
  let closestDistance = Math.abs(value - closest);

  for (const candidate of values) {
    const distance = Math.abs(value - candidate);
    if (distance < closestDistance) {
      closest = candidate;
      closestDistance = distance;
    }
  }

  return closest;
}
