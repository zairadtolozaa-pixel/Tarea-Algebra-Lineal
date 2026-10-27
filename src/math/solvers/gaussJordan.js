import { Fraction } from '../fraction';
import { cloneMatrix, matrixToTex, computeParticularSolution } from '../matrixUtils';

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
        title: `Intercambiar Fila ${leadRow + 1} y Fila ${pivotRow + 1}`,
        description: `Se intercambian las filas para colocar un pivote distinto de cero en la diagonal.`,
        operation: `\\text{Fila } ${leadRow + 1} \\longleftrightarrow \\text{Fila } ${pivotRow + 1}`,
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
        title: `Normalizar Fila ${leadRow + 1}: hacer pivote = 1`,
        description: `Se divide la fila ${leadRow + 1} entre ${pivot.toTex()} para que el pivote sea 1.`,
        operation: `\\text{Fila } ${leadRow + 1} \\div (${pivot.toTex()})`,
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
          ? `\\text{Fila } ${r + 1} + (${factorTex}) \\cdot \\text{Fila } ${leadRow + 1}`
          : `\\text{Fila } ${r + 1} - (${factorTex}) \\cdot \\text{Fila } ${leadRow + 1}`;

        steps.push({
          title: `Hacer cero en la Fila ${r + 1}: restar (${factor.toTex()}) veces la Fila ${leadRow + 1}`,
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
    title: 'Forma escalonada reducida por filas (RREF) obtenida',
    description: 'La matriz ha sido transformada a la forma canónica escalonada reducida.',
    latex: matrixToTex(M, { isAugmented: true }),
    matrix: cloneMatrix(M),
    highlightRows: []
  });

  // Check consistency
  let rankA = 0;
  let rankM = 0;
  let inconsistentRow = -1;
  const pivotCols = [];

  for (let r = 0; r < m; r++) {
    const rowA = M[r].slice(0, n);
    const isRowZeroA = rowA.every(val => val.isZero());
    const isBZero = M[r][n].isZero();

    if (!isRowZeroA) {
      rankA++;
      // Find pivot column of this row
      for (let c = 0; c < n; c++) {
        if (!M[r][c].isZero()) {
          pivotCols.push({ row: r, col: c });
          break;
        }
      }
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
      summary: `La fila ${inconsistentRow + 1} de la RREF produce la contradicción 0 = ${bVal}. El sistema no tiene solución.`
    };
  }

  if (rankA < n) {
    const context = options.context || null;
    const partSol = computeParticularSolution(M, n, m, pivotCols, context);
    const partSolFormatted = partSol.map((v, idx) => ({
      variable: varNames[idx],
      fraction: v,
      tex: v.toTex(),
      decimal: v.toDecimalString()
    }));

    // Identify free variable names
    const pivotColIndices = new Set(pivotCols.map(p => p.col));
    const freeVarNames = varNames.filter((_, idx) => !pivotColIndices.has(idx));

    return {
      status: 'indeterminado',
      statusText: 'Sistema Compatible Indeterminado (Infinitas Soluciones)',
      rankA,
      rankM,
      degreesOfFreedom: n - rankA,
      freeVarNames,
      context,
      particularSolution: partSolFormatted,
      M: cloneMatrix(M),
      pivotCols,
      steps,
      summary: `El rango es ${rankA} < ${n} incógnitas. El sistema tiene infinitas soluciones con ${n - rankA} grado(s) de libertad. Las variables libres son: ${freeVarNames.join(', ')}.`
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

  // Check if original solution contains fractions or decimals
  const hasFractionSolution = solution.some(item => item.fraction.d !== 1n);

  // If a context was chosen (vehicular o quimico), scale solution to positive integers/natural numbers!
  let finalSolution = solution;
  if (options.context) {
    let solLcm = 1n;
    for (const item of solution) {
      if (item.fraction.d !== 0n) {
        let a = solLcm, b = item.fraction.d;
        while (b !== 0n) { const t = b; b = a % b; a = t; }
        solLcm = (solLcm / a) * item.fraction.d;
      }
    }
    if (solLcm > 1n) {
      finalSolution = solution.map(item => {
        const scaled = item.fraction.mul(new Fraction(solLcm, 1n));
        return {
          variable: item.variable,
          fraction: scaled,
          tex: scaled.toTex(),
          decimal: scaled.toDecimalString()
        };
      });
    }
    const allNeg = finalSolution.every(item => item.fraction.isNegative() || item.fraction.isZero());
    if (allNeg) {
      finalSolution = finalSolution.map(item => {
        const pos = item.fraction.neg();
        return {
          variable: item.variable,
          fraction: pos,
          tex: pos.toTex(),
          decimal: pos.toDecimalString()
        };
      });
    }
  }

  return {
    status: 'determinado',
    statusText: 'Sistema Compatible Determinado (Solución Única)',
    rankA,
    rankM,
    hasFractionSolution,
    context: options.context || null,
    solution: finalSolution,
    steps,
    summary: options.context
      ? `Solución resuelta por Gauss-Jordan y reorientada para ${options.context === 'vehicular' ? 'Flujo Vehicular' : 'Balance Químico'}. Se ajustó el sistema para entregar valores enteros / naturales exactos.`
      : `El rango de la matriz es igual al número de incógnitas (rango = ${rankA} = ${n}). La solución se lee directamente de la RREF.`
  };
}
