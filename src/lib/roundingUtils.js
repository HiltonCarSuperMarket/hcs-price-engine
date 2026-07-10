const ALL_DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export function parseRoundingDigits(config) {
  if (!config) return [4];

  if (Array.isArray(config.rounding_digits)) {
    const digits = config.rounding_digits
      .map((d) => parseInt(d, 10))
      .filter((d) => !Number.isNaN(d) && d >= 0 && d <= 9);
    if (digits.length > 0) {
      return [...new Set(digits)].sort((a, b) => a - b);
    }
  }

  if (typeof config.rounding_digits === "string") {
    const digits = config.rounding_digits
      .split(/[,;\s]+/)
      .map((d) => parseInt(d.trim(), 10))
      .filter((d) => !Number.isNaN(d) && d >= 0 && d <= 9);
    if (digits.length > 0) {
      return [...new Set(digits)].sort((a, b) => a - b);
    }
  }

  if (config.rounding_digit !== undefined && config.rounding_digit !== null) {
    const digit = parseInt(config.rounding_digit, 10);
    if (!Number.isNaN(digit) && digit >= 0 && digit <= 9) {
      return [digit];
    }
  }

  return [4];
}

export function roundToEndingDigits(price, digits) {
  const val = Math.round(price);
  const resolvedDigits =
    Array.isArray(digits) && digits.length > 0 ? digits : [4];
  const digitSet = new Set(resolvedDigits);

  if (Math.abs(val) % 100 === 99) {
    return val;
  }

  const candidates = [];

  for (let i = val - 10; i <= val + 10; i++) {
    if (i < 0) continue;
    if (digitSet.has(i % 10)) {
      candidates.push(i);
    }
  }

  if (candidates.length === 0) return val;

  return candidates.reduce((prev, curr) =>
    Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev,
  );
}

export { ALL_DIGITS };
