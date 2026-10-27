import { Fraction } from '../fraction';
import { cloneMatrix, matrixToTex, computeParticularSolutionGauss } from '../matrixUtils';

/**
 * Solves a linear system [A|b] using Gaussian Elimination (Triangularization + Back-substitution)
 */
export function solveGauss(matrixA, vectorB, options = {}) {
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
    description: 'Se forma la matriz ampliada uniendo la matriz de coeficientes y el vector de términos independientes.',
    latex: matrixToTex(M, { isAugmented: true }),
    matrix: cloneMatrix(M),
    highlightRows: []
  });

  // Forward elimination to upper triangular form
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
      // No pivot in this column, continue to next column
      continue;
    }

    // If pivot is not in leadRow, swap rows
    if (pivotRow !== leadRow) {
      const temp = M[leadRow];
      M[leadRow] = M[pivotRow];
      M[pivotRow] = temp;

      steps.push({
        title: `Intercambiar Fila ${leadRow + 1} y Fila ${pivotRow + 1}`,
        description: `El pivote en la posición (${leadRow + 1}, ${col + 1}) era cero, por lo que se intercambian las filas.`,
        operation: `\\text{Fila } ${leadRow + 1} \\longleftrightarrow \\text{Fila } ${pivotRow + 1}`,
        latex: matrixToTex(M, { isAugmented: true }),
        matrix: cloneMatrix(M),
        highlightRows: [leadRow, pivotRow]
      });
    }

    const pivot = M[leadRow][col];

    // Eliminate below leadRow
    for (let r = leadRow + 1; r < m; r++) {
      if (!M[r][col].isZero()) {
        const factor = M[r][col].div(pivot);

        for (let c = col; c <= n; c++) {
          M[r][c] = M[r][c].sub(factor.mul(M[leadRow][c]));
        }

        const factorTex = factor.abs().toTex();
        const opTex = factor.isNegative()
          ? `\\text{Fila } ${r + 1} + (${factorTex}) \\cdot \\text{Fila } ${leadRow + 1}`
          : `\\text{Fila } ${r + 1} - (${factorTex}) \\cdot \\text{Fila } ${leadRow + 1}`;

        steps.push({
          title: `Hacer cero en la Fila ${r + 1}: restar (${factor.toTex()}) veces la Fila ${leadRow + 1}`,
          description: `Se multiplica la fila pivote ${leadRow + 1} por el factor ${factor.toTex()} y se resta a la fila ${r + 1}.`,
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
    title: 'Matriz triangular superior obtenida',
    description: 'Se ha completado la fase de eliminación hacia adelante (triangularización).',
    latex: matrixToTex(M, { isAugmented: true }),
    matrix: cloneMatrix(M),
    highlightRows: []
  });

  // Check consistency and rank
  let rankA = 0;
  let rankM = 0;
  let inconsistentRow = -1;
  const pivotCols = [];

  for (let r = 0; r < m; r++) {
    const isRowZeroA = M[r].slice(0, n).every(val => val.isZero());
    const isBZero = M[r][n].isZero();

    if (!isRowZeroA) {
      rankA++;
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

  // System Inconsistent (Sin solución)
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
      summary: `El rango de la matriz de coeficientes es ${rankA} y el rango de la matriz ampliada es ${rankM} (${rankA} \\neq ${rankM}). En la fila ${inconsistentRow + 1} se obtiene la contradicción 0 = ${bVal}, por lo que el sistema no tiene solución.`
    };
  }

  // Infinitely many solutions (Compatible Indeterminado)
  if (rankA < n) {
    const context = options.context || null;
    const partSol = computeParticularSolutionGauss(M, n, m, pivotCols, context);
    const partSolFormatted = partSol.map((v, idx) => ({
      variable: varNames[idx],
      fraction: v,
      tex: v.toTex(),
      decimal: v.toDecimalString()
    }));

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
      summary: `El rango del sistema es ${rankA}, el cual es menor que el número de incógnitas (${n}). Por el Teorema de Rouché-Frobenius, el sistema tiene infinitas soluciones con ${n - rankA} grado(s) de libertad. Las variables libres son: ${freeVarNames.join(', ')}.`
    };
  }

  // Unique solution (Compatible Determinado): Backward substitution
  const backSubstitutionSteps = [];
  const solution = Array.from({ length: n }, () => Fraction.zero());

  for (let i = n - 1; i >= 0; i--) {
    let sum = Fraction.zero();
    const sumTerms = [];

    for (let j = i + 1; j < n; j++) {
      const coeff = M[i][j];
      if (!coeff.isZero()) {
        const termVal = coeff.mul(solution[j]);
        sum = sum.add(termVal);
        sumTerms.push(`(${coeff.toTex()}) \\cdot (${solution[j].toTex()})`);
      }
    }

    const bVal = M[i][n];
    const pivot = M[i][i];

    if (pivot.isZero()) {
      continue;
    }

    const numerator = bVal.sub(sum);
    solution[i] = numerator.div(pivot);

    let detailLatex = '';
    if (sumTerms.length === 0) {
      detailLatex = `${varNames[i]} = \\frac{${bVal.toTex()}}{${pivot.toTex()}} = ${solution[i].toTex()}`;
    } else {
      detailLatex = `${varNames[i]} = \\frac{${bVal.toTex()} - [${sumTerms.join(' + ')}]}{${pivot.toTex()}} = \\frac{${numerator.toTex()}}{${pivot.toTex()}} = ${solution[i].toTex()}`;
    }

    backSubstitutionSteps.push({
      variable: varNames[i],
      latex: detailLatex,
      value: solution[i]
    });
  }

  // Reverse so it's shown in order x_n up to x_1
  return {
    status: 'determinado',
    statusText: 'Sistema Compatible Determinado (Solución Única)',
    rankA,
    rankM,
    solution: solution.map((val, idx) => ({
      variable: varNames[idx],
      fraction: val,
      tex: val.toTex(),
      decimal: val.toDecimalString()
    })),
    steps,
    backSubstitutionSteps,
    summary: `El rango de la matriz es igual al número de incógnitas (${rankA} = ${n}). El sistema tiene solución única hallada mediante sustitución regresiva.`
  };
}
