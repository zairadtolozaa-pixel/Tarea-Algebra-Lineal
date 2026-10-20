import { Fraction } from '../fraction';
import { cloneMatrix, matrixToTex } from '../matrixUtils';

/**
 * Solves a linear system [A|b] using Gauss-Jordan Elimination (Reduced Row Echelon Form)
 */
export function solveGaussJordan(matrixA, vectorB, options = {}) {
  const { variableNames = [] } = options;
  const m = matrixA.length;
  const n = matrixA[0].length;
  const varNames = variableNames.length === n
    ? variableNames
    : Array.from({ length: n }, (_, i) => `x_{${i + 1}}`);

  const steps = [];

  // Build augmented matrix M = [A | b]
  const M = matrixA.map((row, i) => [
    ...row.map(c => (c instanceof Fraction ? c : Fraction.fromString(String(c)))),
    vectorB[i] instanceof Fraction ? vectorB[i] : Fraction.fromString(String(vectorB[i]))
  ]);

  steps.push({
    title: 'Paso 1: Matriz aumentada inicial [A | B]',
    description: 'Se forma la matriz ampliada del sistema con los coeficientes y términos independientes.',
    latex: matrixToTex(M, { isAugmented: true }),
    matrix: cloneMatrix(M),
    highlightRows: []
  });

  let leadRow = 0;
  for (let col = 0; col < n && leadRow < m; col++) {
    // Find non-zero pivot in column col from leadRow downwards
    let pivotRow = -1;
    for (let r = leadRow; r < m; r++) {
      if (!M[r][col].isZero()) {
        pivotRow = r;
        break;
      }
    }

    if (pivotRow === -1) {
      continue;
    }

    // Swap if needed
    if (pivotRow !== leadRow) {
      const temp = M[leadRow];
      M[leadRow] = M[pivotRow];
      M[pivotRow] = temp;

      steps.push({
        title: `Intercambio de filas: Fila ${leadRow + 1} y Fila ${pivotRow + 1}`,
        description: `Se intercambian las filas para colocar un pivote distinto de cero en la diagonal.`,
        operation: `F_{${leadRow + 1}} \\leftrightarrow F_{${pivotRow + 1}}`,
        latex: matrixToTex(M, { isAugmented: true }),
        matrix: cloneMatrix(M),
        highlightRows: [leadRow, pivotRow]
      });
    }

    const pivot = M[leadRow][col];

    // Normalize pivot row to make pivot = 1
    if (!pivot.isOne()) {
      const invPivot = pivot.inv();
      for (let c = col; c <= n; c++) {
        M[leadRow][c] = M[leadRow][c].mul(invPivot);
      }

      steps.push({
        title: `Normalizar Fila ${leadRow + 1} (Hacer pivote = 1)`,
        description: `Se divide la fila ${leadRow + 1} entre ${pivot.toTex()} para que el pivote sea 1.`,
        operation: `F_{${leadRow + 1}} \\to \\frac{1}{${pivot.toTex()}} \\cdot F_{${leadRow + 1}}`,
        latex: matrixToTex(M, { isAugmented: true }),
        matrix: cloneMatrix(M),
        highlightRows: [leadRow]
      });
    }

    // Eliminate in ALL other rows (both above and below)
    for (let r = 0; r < m; r++) {
      if (r !== leadRow && !M[r][col].isZero()) {
        const factor = M[r][col];

        for (let c = col; c <= n; c++) {
          M[r][c] = M[r][c].sub(factor.mul(M[leadRow][c]));
        }

        const factorTex = factor.abs().toTex();
        const opTex = factor.isNegative()
          ? `F_{${r + 1}} \\to F_{${r + 1}} + (${factorTex}) \\cdot F_{${leadRow + 1}}`
          : `F_{${r + 1}} \\to F_{${r + 1}} - (${factorTex}) \\cdot F_{${leadRow + 1}}`;

        steps.push({
          title: `Hacer cero en la Fila ${r + 1}, Columna ${col + 1}`,
          description: `Se elimina el elemento en (${r + 1}, ${col + 1}) restando ${factor.toTex()} veces la fila pivote.`,
          operation: opTex,
          latex: matrixToTex(M, { isAugmented: true }),
          matrix: cloneMatrix(M),
          highlightRows: [r]
        });
      }
    }

    leadRow++;
  }

  steps.push({
    title: 'Forma escalonada reducida por filas (RREF)',
    description: 'La matriz ha sido transformada a la forma canónica escalonada reducida.',
    latex: matrixToTex(M, { isAugmented: true }),
    matrix: cloneMatrix(M),
    highlightRows: []
  });

  // Check consistency
  let rankA = 0;
  let rankM = 0;
  let inconsistentRow = -1;

  for (let r = 0; r < m; r++) {
    const isRowZeroA = M[r].slice(0, n).every(val => val.isZero());
    const isBZero = M[r][n].isZero();

    if (!isRowZeroA) {
      rankA++;
    }
    if (!isRowZeroA || !isBZero) {
      rankM++;
    }
    if (isRowZeroA && !isBZero && inconsistentRow === -1) {
      inconsistentRow = r;
    }
  }

  if (inconsistentRow !== -1 || rankA < rankM) {
    const bVal = M[inconsistentRow][n].toTex();
    return {
      status: 'incompatible',
      statusText: 'Sistema Incompatible (Sin Solución)',
      rankA,
      rankM,
      inconsistentRow: inconsistentRow + 1,
      inconsistentEq: `0 = ${bVal}`,
      steps,
      summary: `La fila ${inconsistentRow + 1} de la forma reducida produce la contradicción 0 = ${bVal}. El sistema no tiene solución.`
    };
  }

  if (rankA < n) {
    return {
      status: 'indeterminado',
      statusText: 'Sistema Compatible Indeterminado (Infinitas Soluciones)',
      rankA,
      rankM,
      degreesOfFreedom: n - rankA,
      steps,
      summary: `El rango es ${rankA} < ${n} incógnitas. El sistema cuenta con infinitas soluciones.`
    };
  }

  // Compatible Determinado: Read solution directly from augmented column
  const solution = [];
  for (let i = 0; i < n; i++) {
    const val = M[i][n];
    solution.push({
      variable: varNames[i],
      fraction: val,
      tex: val.toTex(),
      decimal: val.toDecimalString()
    });
  }

  return {
    status: 'determinado',
    statusText: 'Sistema Compatible Determinado (Solución Única)',
    rankA,
    rankM,
    solution,
    steps,
    summary: `La parte izquierda es la matriz identidad I_{${n}}. Las soluciones se leen directamente de la columna de términos independientes.`
  };
}
