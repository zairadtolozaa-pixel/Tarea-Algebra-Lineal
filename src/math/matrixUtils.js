import { Fraction } from './fraction';

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
 * Calculates determinant of an n x n Fraction matrix with step-by-step details.
 */
export function calculateDeterminantWithSteps(matrix, options = {}) {
  const n = matrix.length;
  if (n === 0 || matrix[0].length !== n) {
    throw new Error('La matriz debe ser cuadrada para calcular el determinante.');
  }

  // Deep clone
  const mat = matrix.map(r => r.map(c => (c instanceof Fraction ? c : Fraction.fromString(String(c)))));

  if (n === 1) {
    return {
      value: mat[0][0],
      steps: [{
        title: 'Determinante de orden 1',
        latex: `|A| = ${mat[0][0].toTex(options.useDecimal, options.decimals)}`
      }]
    };
  }

  if (n === 2) {
    const a = mat[0][0];
    const b = mat[0][1];
    const c = mat[1][0];
    const d = mat[1][1];
    const prod1 = a.mul(d);
    const prod2 = b.mul(c);
    const det = prod1.sub(prod2);

    return {
      value: det,
      steps: [{
        title: 'Fórmula para matriz 2×2: |A| = (a_{11} \\cdot a_{22}) - (a_{12} \\cdot a_{21})',
        latex: `\\det(A) = (${a.toTex()}) \\cdot (${d.toTex()}) - (${b.toTex()}) \\cdot (${c.toTex()}) = ${prod1.toTex()} - (${prod2.toTex()}) = ${det.toTex()}`
      }]
    };
  }

  // For n >= 3, use row reduction to upper triangular form
  // det(A) = (-1)^swaps * prod(diagonal)
  const steps = [];
  const A = mat.map(r => [...r]);
  let detMultiplier = Fraction.one();
  let swapCount = 0;

  steps.push({
    title: 'Matriz inicial para cálculo de determinante',
    latex: `\\Delta = ${determinantToTex(A, options)}`,
    matrix: cloneMatrix(A)
  });

  for (let col = 0; col < n; col++) {
    // Find pivot
    let pivotRow = -1;
    for (let r = col; r < n; r++) {
      if (!A[r][col].isZero()) {
        pivotRow = r;
        break;
      }
    }

    if (pivotRow === -1) {
      // Entire column is zero below diagonal, det is 0
      steps.push({
        title: `Columna ${col + 1} con ceros en la diagonal`,
        latex: `\\text{Dado que todos los elementos en la columna ${col + 1} debajo de la diagonal son 0, } \\det(A) = 0`,
        matrix: cloneMatrix(A)
      });
      return {
        value: Fraction.zero(),
        steps
      };
    }

    if (pivotRow !== col) {
      // Swap rows col and pivotRow
      const temp = A[col];
      A[col] = A[pivotRow];
      A[pivotRow] = temp;
      detMultiplier = detMultiplier.neg();
      swapCount++;

      steps.push({
        title: `Intercambiar Fila ${col + 1} y Fila ${pivotRow + 1} (el determinante cambia de signo)`,
        latex: `F_{${col + 1}} \\leftrightarrow F_{${pivotRow + 1}} \\implies -\\det = ${determinantToTex(A, options)}`,
        matrix: cloneMatrix(A)
      });
    }

    const pivot = A[col][col];

    // Eliminate below
    for (let r = col + 1; r < n; r++) {
      if (!A[r][col].isZero()) {
        const factor = A[r][col].div(pivot);
        for (let c = col; c < n; c++) {
          A[r][c] = A[r][c].sub(factor.mul(A[col][c]));
        }

        const signStr = factor.isNegative()
          ? `+ ${factor.abs().toTex()}`
          : `- ${factor.toTex()}`;

        steps.push({
          title: `Hacer cero en fila ${r + 1}, columna ${col + 1}`,
          latex: `F_{${r + 1}} \\to F_{${r + 1}} ${signStr} F_{${col + 1}}`,
          matrix: cloneMatrix(A)
        });
      }
    }
  }

  // Multiply diagonal elements
  let diagonalProduct = Fraction.one();
  const diagTerms = [];
  for (let i = 0; i < n; i++) {
    diagonalProduct = diagonalProduct.mul(A[i][i]);
    diagTerms.push(A[i][i].toTex(options.useDecimal, options.decimals));
  }

  const finalDet = detMultiplier.mul(diagonalProduct);

  steps.push({
    title: 'Producto de los elementos de la diagonal principal',
    latex: `\\det(A) = ${swapCount % 2 === 1 ? '(-1) \\cdot ' : ''}(${diagTerms.join(' \\cdot ')}) = ${finalDet.toTex(options.useDecimal, options.decimals)}`,
    matrix: cloneMatrix(A)
  });

  return {
    value: finalDet,
    steps
  };
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
