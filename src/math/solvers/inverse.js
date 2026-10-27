import { Fraction } from '../fraction';
import {
  cloneMatrix,
  matrixToTex,
  determinantToTex,
  calculateDeterminantWithSteps,
  getSubmatrix
} from '../matrixUtils';

/**
 * Solves a linear system X = A^(-1) * B using Matrix Inversion via Adjugate Matrix:
 *   A^(-1) = (1 / det(A)) * Adj(A) = (1 / det(A)) * (Cof(A))^T
 *   X = A^(-1) * B
 *
 * Fully respects the method of matrix inversion by adjugate/cofactors,
 * with NO Gauss or Gauss-Jordan reduction steps.
 */
export function solveInverseMatrix(matrixA, vectorB, options = {}) {
  const { variableNames = [] } = options;
  const m = matrixA.length;
  const n = matrixA[0].length;
  const varNames = variableNames.length === n
    ? variableNames
    : Array.from({ length: n }, (_, i) => `x_{${i + 1}}`);

  // Check square matrix
  if (m !== n) {
    return {
      status: 'error',
      statusText: 'No aplicable',
      summary: `El método de la matriz inversa requiere una matriz cuadrada de coeficientes (mismo número de ecuaciones que de incógnitas). Su sistema es de ${m} \\times ${n}.`,
      steps: []
    };
  }

  const steps = [];

  // Convert A and B to Fractions
  const A = matrixA.map(row => row.map(c => (c instanceof Fraction ? c : Fraction.fromString(String(c)))));
  const B = vectorB.map(b => (b instanceof Fraction ? b : Fraction.fromString(String(b))));

  // Step 1: Calculate Determinant det(A) using Sarrus (3x3) or Cofactors
  const detResult = calculateDeterminantWithSteps(A, options);
  const detA = detResult.value;
  const detMethodLabel = {
    sarrus: '📐 Regla de Sarrus (3×3)',
    cofactors: '🔢 Expansión por Cofactores (Laplace)',
    formula2x2: 'Fórmula directa 2×2',
    directo: 'Directo'
  }[detResult.method] || 'Determinante';

  steps.push({
    title: `Paso 1: Cálculo del determinante del sistema — ${detMethodLabel}`,
    description: 'Para que la matriz inversa A⁻¹ exista y el sistema tenga solución única, el determinante debe ser diferente de cero (\\det(A) \\neq 0).',
    latex: `\\det(A) = ${detA.toTex()}`,
    substeps: detResult.steps
  });

  if (detA.isZero()) {
    return {
      status: 'singular',
      statusText: 'Matriz Singular (Sin Inversa)',
      detA,
      steps,
      summary: `Dado que \\det(A) = 0, la matriz de coeficientes A es singular y no posee inversa (A^{-1} no existe). El método de la matriz inversa no puede aplicarse a este sistema.`
    };
  }

  // Step 2: Compute Matrix of Cofactors Cof(A) and Adjugate Adj(A) = Cof(A)^T
  const cofactorMatrix = Array.from({ length: n }, () => Array.from({ length: n }, () => Fraction.zero()));
  const cofactorSubsteps = [];

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const signExponent = i + j;
      const signVal = signExponent % 2 === 0 ? Fraction.one() : Fraction.one().neg();
      const signTex = signExponent % 2 === 0 ? '+' : '-';

      let minorDet;
      let minorTex = '';

      if (n === 2) {
        // Minor of 2x2 is the single remaining entry
        const singleVal = A[1 - i][1 - j];
        minorDet = singleVal;
        minorTex = singleVal.toTex();
      } else {
        const sub = getSubmatrix(A, i, j);
        const subDetRes = calculateDeterminantWithSteps(sub, options);
        minorDet = subDetRes.value;
        minorTex = `${determinantToTex(sub)} = ${minorDet.toTex()}`;
      }

      const Cij = signVal.mul(minorDet);
      cofactorMatrix[i][j] = Cij;

      cofactorSubsteps.push({
        title: `Cofactor C_{${i + 1},${j + 1}} (fila ${i + 1}, columna ${j + 1})`,
        latex: `C_{${i + 1},${j + 1}} = (-1)^{${i + 1}+${j + 1}} \\cdot M_{${i + 1},${j + 1}} = (${signTex}1) \\cdot \\left(${minorTex}\\right) = \\mathbf{${Cij.toTex()}}`
      });
    }
  }

  steps.push({
    title: 'Paso 2: Matriz de Cofactores Cof(A)',
    description: 'Se calcula el cofactor de cada elemento de la matriz: C_{ij} = (-1)^{i+j} \\cdot M_{ij}, donde M_{ij} es el menor complementario obtenido al eliminar la fila i y columna j.',
    latex: `\\text{Cof}(A) = ${matrixToTex(cofactorMatrix)}`,
    substeps: cofactorSubsteps
  });

  // Transpose of Cofactor Matrix gives Adjugate Matrix: Adj(A) = Cof(A)^T
  const adjA = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => cofactorMatrix[c][r])
  );

  steps.push({
    title: 'Paso 3: Matriz Adjunta — Transpuesta de Cofactores: Adj(A) = [Cof(A)]ᵀ',
    description: 'La matriz adjunta Adj(A) se obtiene transponiendo la matriz de cofactores (las filas se convierten en columnas).',
    latex: `\\text{Adj}(A) = [\\text{Cof}(A)]^T = ${matrixToTex(adjA)}`
  });

  // Step 4: Inverse Matrix A^(-1) = (1 / det(A)) * Adj(A)
  const invA = adjA.map(row => row.map(cell => cell.div(detA)));

  // Common denominator for integer representation
  let invLcm = 1n;
  let hasFractions = false;
  for (const row of invA) {
    for (const val of row) {
      if (val.d !== 1n) {
        hasFractions = true;
        let a = invLcm, b = val.d;
        while (b !== 0n) { const t = b; b = a % b; a = t; }
        invLcm = (invLcm / a) * val.d;
      }
    }
  }

  const intMatrixAInv = invA.map(row => row.map(val => val.mul(new Fraction(invLcm, 1n))));

  steps.push({
    title: 'Paso 4: Obtención de la Matriz Inversa — A⁻¹ = \\frac{1}{\\det(A)} \\cdot \\text{Adj}(A)',
    description: `Se divide cada elemento de la matriz adjunta entre el determinante del sistema (\\det(A) = ${detA.toTex()}).`,
    latex: hasFractions && invLcm > 1n
      ? `A^{-1} = \\dfrac{1}{${detA.toTex()}}\\, ${matrixToTex(adjA)} = ${matrixToTex(invA)} = \\dfrac{1}{${invLcm.toString()}}\\, ${matrixToTex(intMatrixAInv)}`
      : `A^{-1} = \\dfrac{1}{${detA.toTex()}}\\, ${matrixToTex(adjA)} = ${matrixToTex(invA)}`
  });

  // Step 5: Multiply X = A^(-1) * B
  const bVectorTex = `\\left(\\begin{array}{c}\n${B.map(b => b.toTex()).join(' \\\\ \n')}\n\\end{array}\\right)`;
  const multSteps = [];
  const solution = [];

  // Compute product Adj(A) * B
  const adjTimesB = [];
  for (let i = 0; i < n; i++) {
    let rowSum = Fraction.zero();
    const adjProdTerms = [];
    for (let j = 0; j < n; j++) {
      const adjVal = adjA[i][j];
      const bVal = B[j];
      const p = adjVal.mul(bVal);
      rowSum = rowSum.add(p);
      adjProdTerms.push(`(${adjVal.toTex()})(${bVal.toTex()})`);
    }
    adjTimesB.push(rowSum);
    const finalVal = rowSum.div(detA);
    solution.push({
      variable: varNames[i],
      fraction: finalVal,
      tex: finalVal.toTex(),
      decimal: finalVal.toDecimalString()
    });
    multSteps.push({
      variable: varNames[i],
      latex: `${varNames[i]} = \\dfrac{1}{${detA.toTex()}} \\left[ ${adjProdTerms.join(' + ')} \\right] = \\dfrac{${rowSum.toTex()}}{${detA.toTex()}} = \\boxed{${finalVal.toTex()}}`
    });
  }

  const adjTimesBTex = `\\begin{pmatrix} ${adjTimesB.map(v => v.toTex()).join(' \\\\ ')} \\end{pmatrix}`;
  const finalSolTex = `\\begin{pmatrix} ${solution.map(s => s.tex).join(' \\\\ ')} \\end{pmatrix}`;

  // Common denominator for solution scaling if fractions exist
  let solLcm = 1n;
  let solHasFractions = false;
  for (const s of solution) {
    if (s.fraction.d !== 1n) {
      solHasFractions = true;
      let a = solLcm, b = s.fraction.d;
      while (b !== 0n) { const t = b; b = a % b; a = t; }
      solLcm = (solLcm / a) * s.fraction.d;
    }
  }

  const integerSolution = solHasFractions && solLcm > 1n
    ? solution.map(s => ({
        variable: s.variable,
        fraction: s.fraction.mul(new Fraction(solLcm, 1n)),
        tex: s.fraction.mul(new Fraction(solLcm, 1n)).toTex()
      }))
    : null;

  steps.push({
    title: 'Paso 5: Resultado final del sistema — Multiplicamos A⁻¹ · B',
    description: 'Multiplicamos la matriz inversa por el vector de términos independientes: X = A⁻¹ B = \\frac{1}{\\det(A)} \\cdot \\text{Adj}(A) \\cdot B',
    latex: `X = \\dfrac{1}{${detA.toTex()}}\\, ${matrixToTex(adjA)} ${bVectorTex} = \\dfrac{1}{${detA.toTex()}}\\, ${adjTimesBTex} = ${finalSolTex}`,
    multiplicationDetails: multSteps
  });

  return {
    status: 'determinado',
    statusText: 'Sistema Compatible Determinado (Solución Única)',
    detA,
    detMethod: detMethodLabel,
    invA,
    hasFractions,
    invLcm: invLcm.toString(),
    intMatrixAInv,
    solHasFractions,
    solLcm: solLcm.toString(),
    integerSolution,
    solution,
    steps,
    summary: `La matriz inversa existe (\\det(A) = ${detA.toTex()} \\neq 0) calculada mediante la matriz adjunta y determinantes por ${detMethodLabel}. Al efectuar la multiplicación X = A^{-1} \\cdot B se obtiene la solución única.`
  };
}
