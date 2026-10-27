import { Fraction } from './fraction';

// ── BigInt helpers ──────────────────────────────────────────────────────────
function gcdBigInt(a, b) {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b !== 0n) { const t = b; b = a % b; a = t; }
  return a;
}
function lcmBigInt(a, b) {
  if (a === 0n || b === 0n) return 1n;
  return (a / gcdBigInt(a, b)) * (b < 0n ? -b : b);
}

/**
 * Utility functions for matrix manipulations using exact Fraction values.
 */

export function getVariableNames(count, style = 'subscript') {
  if (style === 'letters' && count <= 6) {
    const letters = ['x', 'y', 'z', 'w', 'u', 'v', 's', 't'];
    return letters.slice(0, count);
  }
  // Default subscript: x_1, x_2, ...
  return Array.from({ length: count }, (_, i) => `x_{${i + 1}}`);
}

export function createEmptyMatrix(rows, cols, defaultValue = '') {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => defaultValue));
}

export function toFractionMatrix(rawMatrix) {
  return rawMatrix.map(row =>
    row.map(cell => {
      if (cell instanceof Fraction) return cell;
      return Fraction.fromString(cell !== undefined && cell !== null ? String(cell) : '0');
    })
  );
}

export function cloneMatrix(matrix) {
  return matrix.map(row => [...row]);
}

export function matrixToTex(matrix, options = {}) {
  const { isAugmented = false, useDecimal = false, decimals = 4 } = options;
  if (!matrix || matrix.length === 0) return '';
  const rows = matrix.length;
  const cols = matrix[0].length;

  let colSpec = '';
  if (isAugmented && cols > 1) {
    colSpec = `{|${'c'.repeat(cols - 1)}|c|}`;
  } else {
    colSpec = `{${'c'.repeat(cols)}}`;
  }

  const rowsTex = matrix.map(row => {
    return row.map(val => {
      const f = val instanceof Fraction ? val : Fraction.fromString(String(val));
      return f.toTex(useDecimal, decimals);
    }).join(' & ');
  }).join(' \\\\ \n');

  return `\\left(\\begin{array}${colSpec}\n${rowsTex}\n\\end{array}\\right)`;
}

export function determinantToTex(matrix, options = {}) {
  const { useDecimal = false, decimals = 4 } = options;
  if (!matrix || matrix.length === 0) return '';
  const cols = matrix[0].length;
  const colSpec = `{${'c'.repeat(cols)}}`;

  const rowsTex = matrix.map(row => {
    return row.map(val => {
      const f = val instanceof Fraction ? val : Fraction.fromString(String(val));
      return f.toTex(useDecimal, decimals);
    }).join(' & ');
  }).join(' \\\\ \n');

  return `\\left|\\begin{array}${colSpec}\n${rowsTex}\n\\end{array}\\right|`;
}

/**
 * Renders augmented [A | I_n] matrix with vertical bar at column n.
 */
export function augInvToTex(aug, n) {
  const colSpec = `{${'c'.repeat(n)}|${'c'.repeat(n)}}`;
  const rowsTex = aug.map(row =>
    row.map(val => (val instanceof Fraction ? val : Fraction.fromString(String(val))).toTex()).join(' & ')
  ).join(' \\\\ \n');
  return `\\left(\\begin{array}${colSpec}\n${rowsTex}\n\\end{array}\\right)`;
}

// ── Sarrus (solo 3×3) ────────────────────────────────────────────────────────
function detSarrus(mat, options = {}) {
  const [a, b, c] = mat[0];
  const [d, e, f] = mat[1];
  const [g, h, k] = mat[2];

  const t1 = a.mul(e).mul(k);
  const t2 = b.mul(f).mul(g);
  const t3 = c.mul(d).mul(h);
  const n1 = c.mul(e).mul(g);
  const n2 = a.mul(f).mul(h);
  const n3 = b.mul(d).mul(k);
  const det = t1.add(t2).add(t3).sub(n1).sub(n2).sub(n3);

  const steps = [
    {
      title: '📐 Método de Sarrus — Diagonales principales (↘) menos diagonales secundarias (↗)',
      latex:
        `\\det(A) = a_{11}a_{22}a_{33} + a_{12}a_{23}a_{31} + a_{13}a_{21}a_{32}` +
        ` - a_{13}a_{22}a_{31} - a_{11}a_{23}a_{32} - a_{12}a_{21}a_{33}`
    },
    {
      title: 'Sustitución de valores en Sarrus',
      latex:
        `\\det(A) = (${a.toTex()})(${e.toTex()})(${k.toTex()}) + (${b.toTex()})(${f.toTex()})(${g.toTex()}) + (${c.toTex()})(${d.toTex()})(${h.toTex()})` +
        ` \\\\[0.4em]\\qquad - (${c.toTex()})(${e.toTex()})(${g.toTex()}) - (${a.toTex()})(${f.toTex()})(${h.toTex()}) - (${b.toTex()})(${d.toTex()})(${k.toTex()})`
    },
    {
      title: 'Productos y resultado final',
      latex:
        `\\det(A) = ${t1.toTex()} + ${t2.toTex()} + ${t3.toTex()}` +
        ` - (${n1.toTex()}) - (${n2.toTex()}) - (${n3.toTex()}) = \\boxed{${det.toTex()}}`
    }
  ];
  return { value: det, steps, method: 'sarrus' };
}

// ── Cofactores / Laplace (recursivo) ─────────────────────────────────────────
function detCofactors(mat, options = {}, depth = 0) {
  const n = mat.length;

  if (n === 1) {
    return {
      value: mat[0][0],
      steps: [{ title: 'det(1×1)', latex: `\\det = ${mat[0][0].toTex()}` }],
      method: 'cofactors'
    };
  }

  if (n === 2) {
    const a = mat[0][0], b = mat[0][1], cv = mat[1][0], d = mat[1][1];
    const det = a.mul(d).sub(b.mul(cv));
    return {
      value: det,
      steps: [{
        title: 'det(2×2)',
        latex: `= (${a.toTex()})(${d.toTex()}) - (${b.toTex()})(${cv.toTex()}) = ${det.toTex()}`
      }],
      method: 'cofactors'
    };
  }

  const steps = [];
  if (depth === 0) {
    steps.push({
      title: `🔢 Método de Cofactores (Expansión de Laplace) — Expansión por la Fila 1`,
      latex: `\\det(A) = \\sum_{j=1}^{${n}} (-1)^{1+j}\\, a_{1j}\\, M_{1j}`
    });
  }

  let det = Fraction.zero();
  const termList = [];

  for (let j = 0; j < n; j++) {
    const aij = mat[0][j];
    const signVal = (j % 2 === 0) ? Fraction.one() : Fraction.one().neg();
    const minor = getSubmatrix(mat, 0, j);
    const minorRes = detCofactors(minor, options, depth + 1);
    const cofactor = signVal.mul(minorRes.value);
    const term = aij.mul(cofactor);
    det = det.add(term);

    if (depth === 0) {
      const signStr = j % 2 === 0 ? '(+)' : '(-)';
      steps.push({
        title: `Cofactor C_{1,${j + 1}}: elemento a_{1,${j+1}} = ${aij.toTex()}`,
        latex:
          `${signStr}\\; ${determinantToTex(minor)} = ${cofactor.toTex()}` +
          `\\qquad \\Rightarrow \\quad a_{1,${j+1}} \\cdot C_{1,${j+1}} = (${aij.toTex()})(${cofactor.toTex()}) = ${term.toTex()}`
      });
    }
    termList.push(term);
  }

  // Build sum latex
  const sumTex = termList.map((t, i) => {
    const tex = t.toTex();
    if (i === 0) return tex;
    return tex.startsWith('-') ? `\\; ${tex}` : `\\; +\\; ${tex}`;
  }).join('');

  if (depth === 0) {
    steps.push({
      title: 'Suma de todos los términos',
      latex: `\\det(A) = ${sumTex} = \\boxed{${det.toTex()}}`
    });
  }

  return { value: det, steps, method: 'cofactors' };
}

/**
 * Calculates determinant using explicitly chosen method: 'sarrus' or 'cofactors'.
 * - 2×2: direct cross-product formula
 * - 3×3: Sarrus or Cofactors (Laplace) according to options.detMethod (defaults to Sarrus)
 * - n>=4: Cofactors (Laplace)
 */
export function calculateDeterminantWithSteps(matrix, options = {}) {
  const n = matrix.length;
  if (n === 0 || matrix[0].length !== n) {
    throw new Error('La matriz debe ser cuadrada para calcular el determinante.');
  }

  const mat = matrix.map(r => r.map(c => (c instanceof Fraction ? c : Fraction.fromString(String(c)))));
  const chosenMethod = options.detMethod || (n === 3 ? 'sarrus' : 'cofactors');

  if (n === 1) {
    return {
      value: mat[0][0],
      method: 'directo',
      steps: [{ title: 'Determinante de orden 1 (valor único)', latex: `\\det(A) = ${mat[0][0].toTex()}` }]
    };
  }

  if (n === 2) {
    const a = mat[0][0], b = mat[0][1], cv = mat[1][0], d = mat[1][1];
    const prod1 = a.mul(d), prod2 = b.mul(cv);
    const det = prod1.sub(prod2);
    return {
      value: det,
      method: 'formula2x2',
      steps: [{
        title: 'Fórmula 2×2: \\det(A) = a_{11}a_{22} - a_{12}a_{21}',
        latex: `\\det(A) = (${a.toTex()})(${d.toTex()}) - (${b.toTex()})(${cv.toTex()}) = ${prod1.toTex()} - (${prod2.toTex()}) = \\boxed{${det.toTex()}}`
      }]
    };
  }

  if (n === 3) {
    if (chosenMethod === 'cofactors') {
      return detCofactors(mat, options);
    }
    return detSarrus(mat, options);
  }

  // n >= 4: cofactor expansion (Laplace)
  return detCofactors(mat, options);
}

// ── Helpers for infinite-solutions particular solution ─────────────────────
export function computeParticularSolution(M, n, m, pivotCols, context = null) {
  // Free variable assignment based on application context:
  // In traffic flow (vehicular) or chemical balancing (quimico), variables cannot be zero;
  // assigning free variables = 1 (or small positive integer) produces natural numbers.
  const freeVal = (context === 'vehicular' || context === 'quimico') ? Fraction.one() : Fraction.zero();
  const pivotColSet = new Set(pivotCols.map(p => p.col));
  const sol = Array.from({ length: n }, (_, idx) => pivotColSet.has(idx) ? Fraction.zero() : freeVal);

  for (let k = 0; k < pivotCols.length; k++) {
    const { row, col } = pivotCols[k];
    let sum = M[row][n];
    for (let j = 0; j < n; j++) {
      if (!pivotColSet.has(j)) {
        sum = sum.sub(M[row][j].mul(sol[j]));
      }
    }
    sol[col] = sum;
  }

  // Scale to positive natural numbers / integers using LCM of denominators
  let lcm = 1n;
  for (const v of sol) {
    if (v.d !== 0n) lcm = lcmBigInt(lcm, v.d);
  }

  let scaled = sol.map(v => v.mul(new Fraction(lcm, 1n)));

  // If in application context (vehicular / chemical), ensure all values are strictly positive natural numbers (> 0)
  if (context === 'vehicular' || context === 'quimico') {
    // If any value is negative or zero, flip sign or adjust
    const allNegative = scaled.every(v => v.isNegative() || v.isZero());
    if (allNegative) {
      scaled = scaled.map(v => v.neg());
    }
    // Also simplify by gcd of numerators to get smallest natural numbers
    let g = 0n;
    for (const v of scaled) {
      const val = v.n < 0n ? -v.n : v.n;
      if (val !== 0n) g = g === 0n ? val : gcdBigInt(g, val);
    }
    if (g > 1n) {
      scaled = scaled.map(v => new Fraction(v.n / g, 1n));
    }
  }

  return scaled;
}

export function computeParticularSolutionGauss(M, n, m, pivotCols, context = null) {
  const freeVal = (context === 'vehicular' || context === 'quimico') ? Fraction.one() : Fraction.zero();
  const pivotColSet = new Set(pivotCols.map(p => p.col));
  const sol = Array.from({ length: n }, (_, idx) => pivotColSet.has(idx) ? Fraction.zero() : freeVal);

  for (let i = pivotCols.length - 1; i >= 0; i--) {
    const { row, col } = pivotCols[i];
    let sum = M[row][n];
    for (let j = col + 1; j < n; j++) {
      sum = sum.sub(M[row][j].mul(sol[j]));
    }
    const pivot = M[row][col];
    if (!pivot.isZero()) sol[col] = sum.div(pivot);
  }

  let lcm = 1n;
  for (const v of sol) {
    if (v.d !== 0n) lcm = lcmBigInt(lcm, v.d);
  }

  let scaled = sol.map(v => v.mul(new Fraction(lcm, 1n)));

  if (context === 'vehicular' || context === 'quimico') {
    const allNegative = scaled.every(v => v.isNegative() || v.isZero());
    if (allNegative) {
      scaled = scaled.map(v => v.neg());
    }
    let g = 0n;
    for (const v of scaled) {
      const val = v.n < 0n ? -v.n : v.n;
      if (val !== 0n) g = g === 0n ? val : gcdBigInt(g, val);
    }
    if (g > 1n) {
      scaled = scaled.map(v => new Fraction(v.n / g, 1n));
    }
  }

  return scaled;
}

/**
 * Computes cofactor of element (row, col)
 */
export function getSubmatrix(matrix, excludeRow, excludeCol) {
  return matrix
    .filter((_, r) => r !== excludeRow)
    .map(row => row.filter((_, c) => c !== excludeCol));
}

/**
 * Parse plain text or system of equations into matrix A and vector b
 */
export function parseSystemText(text) {
  if (!text || typeof text !== 'string') return null;
  const lines = text.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  // Check if lines contain '='
  const hasEquals = lines.some(l => l.includes('='));

  if (hasEquals) {
    return parseEquationsList(lines);
  } else {
    return parseMatrixNumbers(lines);
  }
}

function parseEquationsList(lines) {
  // Extract variable names dynamically (e.g. x, y, z or x1, x2, x3)
  const varSet = new Set();
  const eqTokens = lines.map(line => {
    const [lhs, rhs] = line.split('=');
    const bVal = rhs ? rhs.trim() : '0';
    // Match terms: e.g. +2x, -3y, +z, 4x_1, 5x2, -x
    const matches = lhs.match(/([+-]?\s*[\d./]*\s*[a-zA-Z_]\w*)/g) || [];
    const termMap = {};
    for (const match of matches) {
      const clean = match.replace(/\s+/g, '');
      const varMatch = clean.match(/([a-zA-Z_]\w*)$/);
      if (varMatch) {
        const varName = varMatch[1];
        varSet.add(varName);
        let coeffStr = clean.slice(0, -varName.length);
        if (coeffStr === '' || coeffStr === '+') coeffStr = '1';
        if (coeffStr === '-') coeffStr = '-1';
        termMap[varName] = (termMap[varName] || Fraction.zero()).add(Fraction.fromString(coeffStr));
      }
    }
    return { terms: termMap, b: bVal };
  });

  // Sort variables: x, y, z first or natural order
  const vars = Array.from(varSet).sort((a, b) => {
    // If format x1, x2, x10
    const numA = parseInt(a.replace(/\D/g, ''), 10);
    const numB = parseInt(b.replace(/\D/g, ''), 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });

  if (vars.length === 0) return null;

  const rows = eqTokens.length;
  const cols = vars.length;
  const A = createEmptyMatrix(rows, cols, '0');
  const b = Array.from({ length: rows }, () => '0');

  eqTokens.forEach((eq, r) => {
    vars.forEach((v, c) => {
      const val = eq.terms[v];
      A[r][c] = val ? val.toString() : '0';
    });
    b[r] = eq.b;
  });

  return { A, b, vars };
}

function parseMatrixNumbers(lines) {
  const rows = lines.map(line =>
    line
      .trim()
      .split(/[\s,;\t]+/)
      .filter(Boolean)
  );

  if (rows.length === 0 || rows[0].length < 2) return null;
  const cols = rows[0].length;
  const varCount = cols - 1; // Last column is b

  const A = [];
  const b = [];

  for (const r of rows) {
    if (r.length < cols) continue;
    A.push(r.slice(0, varCount));
    b.push(r[varCount]);
  }

  return { A, b, vars: null };
}
