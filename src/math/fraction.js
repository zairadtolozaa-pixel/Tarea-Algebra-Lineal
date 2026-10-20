/**
 * Fraction class for exact rational arithmetic
 * Stores numerator (n) and denominator (d) as BigInt for arbitrary precision without floating-point errors.
 */

function gcd(a, b) {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

export class Fraction {
  constructor(numerator = 0n, denominator = 1n) {
    if (typeof numerator === 'number') {
      const f = Fraction.fromNumber(numerator);
      this.n = f.n;
      this.d = f.d;
      return;
    }
    if (typeof numerator === 'string') {
      const f = Fraction.fromString(numerator);
      this.n = f.n;
      this.d = f.d;
      return;
    }

    let n = BigInt(numerator);
    let d = BigInt(denominator);

    if (d === 0n) {
      throw new Error('División por cero en fracción');
    }

    if (d < 0n) {
      n = -n;
      d = -d;
    }

    const g = gcd(n, d);
    this.n = n / g;
    this.d = d / g;
  }

  static zero() {
    return new Fraction(0n, 1n);
  }

  static one() {
    return new Fraction(1n, 1n);
  }

  static fromNumber(num) {
    if (!Number.isFinite(num)) {
      throw new Error('Número no válido para fracción');
    }
    // Check if integer
    if (Number.isInteger(num)) {
      return new Fraction(BigInt(num), 1n);
    }
    // Convert decimal to fraction
    const str = num.toString();
    const parts = str.split('.');
    if (parts.length === 1) {
      return new Fraction(BigInt(parts[0]), 1n);
    }
    const decDigits = parts[1].length;
    const factor = 10n ** BigInt(decDigits);
    const intVal = BigInt(parts[0].replace('-', '')) * factor + BigInt(parts[1]);
    const isNeg = str.startsWith('-');
    return new Fraction(isNeg ? -intVal : intVal, factor);
  }

  static fromString(str) {
    if (!str || typeof str !== 'string') {
      return Fraction.zero();
    }
    const cleaned = str.trim().replace(/\s+/g, '');
    if (!cleaned || cleaned === '-' || cleaned === '+') {
      return Fraction.zero();
    }

    // Check if contains division '/'
    if (cleaned.includes('/')) {
      const parts = cleaned.split('/');
      if (parts.length === 2) {
        const numPart = Fraction.fromString(parts[0]);
        const denPart = Fraction.fromString(parts[1]);
        return numPart.div(denPart);
      }
    }

    // Check if decimal
    if (cleaned.includes('.')) {
      const parts = cleaned.split('.');
      const integerPart = parts[0] === '' || parts[0] === '-' ? (parts[0] === '-' ? '-0' : '0') : parts[0];
      const fracPart = parts[1] || '0';
      const factor = 10n ** BigInt(fracPart.length);
      const isNeg = integerPart.startsWith('-');
      const absInt = BigInt(integerPart.replace('-', ''));
      const fullVal = absInt * factor + BigInt(fracPart);
      return new Fraction(isNeg ? -fullVal : fullVal, factor);
    }

    // Check if integer
    try {
      return new Fraction(BigInt(cleaned), 1n);
    } catch {
      // Fallback: parse as float
      const val = parseFloat(cleaned);
      if (isNaN(val)) return Fraction.zero();
      return Fraction.fromNumber(val);
    }
  }

  add(other) {
    const o = other instanceof Fraction ? other : Fraction.fromString(String(other));
    const n = this.n * o.d + o.n * this.d;
    const d = this.d * o.d;
    return new Fraction(n, d);
  }

  sub(other) {
    const o = other instanceof Fraction ? other : Fraction.fromString(String(other));
    const n = this.n * o.d - o.n * this.d;
    const d = this.d * o.d;
    return new Fraction(n, d);
  }

  mul(other) {
    const o = other instanceof Fraction ? other : Fraction.fromString(String(other));
    return new Fraction(this.n * o.n, this.d * o.d);
  }

  div(other) {
    const o = other instanceof Fraction ? other : Fraction.fromString(String(other));
    if (o.isZero()) {
      throw new Error('División por cero');
    }
    return new Fraction(this.n * o.d, this.d * o.n);
  }

  neg() {
    return new Fraction(-this.n, this.d);
  }

  abs() {
    return new Fraction(this.n < 0n ? -this.n : this.n, this.d);
  }

  inv() {
    if (this.isZero()) throw new Error('No se puede invertir cero');
    return new Fraction(this.d, this.n);
  }

  isZero() {
    return this.n === 0n;
  }

  isOne() {
    return this.n === 1n && this.d === 1n;
  }

  isNegative() {
    return this.n < 0n;
  }

  equals(other) {
    const o = other instanceof Fraction ? other : Fraction.fromString(String(other));
    return this.n === o.n && this.d === o.d;
  }

  toNumber() {
    return Number(this.n) / Number(this.d);
  }

  toString() {
    if (this.d === 1n) {
      return this.n.toString();
    }
    return `${this.n}/${this.d}`;
  }

  toDecimalString(decimals = 4) {
    const val = this.toNumber();
    // Check if integer
    if (Number.isInteger(val)) return val.toString();
    // Return rounded decimal
    const factor = 10 ** decimals;
    const rounded = Math.round((val + Number.EPSILON) * factor) / factor;
    return rounded.toString();
  }

  toTex(useDecimal = false, decimals = 4) {
    if (useDecimal) {
      return this.toDecimalString(decimals);
    }
    if (this.d === 1n) {
      return this.n.toString();
    }
    if (this.n < 0n) {
      return `-\\frac{${-this.n}}{${this.d}}`;
    }
    return `\\frac{${this.n}}{${this.d}}`;
  }
}
