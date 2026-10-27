import { Fraction } from '../fraction';
import { cloneMatrix, matrixToTex, augInvToTex, calculateDeterminantWithSteps } from '../matrixUtils';

/**
 * Solves a linear system X = A^(-1) * B using Matrix Inversion
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

  // Step 1: Calculate Determinant
  const detResult = calculateDeterminantWithSteps(A, options);
  const detA = detResult.value;
  const detMethodLabel = {
    sarrus: '📐 Sarrus (3×3)',
    cofactors: '🔢 Cofactores (Laplace)',
    formula2x2: 'Fórmula 2×2',
    directo: 'Directo'
  }[detResult.method] || 'Determinante';

  steps.push({
    title: `Paso 1: Cálculo del determinante — Método: ${detMethodLabel}`,
    description: 'Para que la matriz sea invertible, su determinante debe ser diferente de cero (\\det(A) \\neq 0).',
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

  // Step 2: Compute Inverse A^(-1) using augmented [A | I_n] via Gauss-Jordan
  const invSteps = [];
  const aug = Array.from({ length: n }, (_, r) => {
    const row = [...A[r]];
    for (let c = 0; c < n; c++) {
      row.push(r === c ? Fraction.one() : Fraction.zero());
    }
    return row;
  });

  invSteps.push({
    title: 'Matriz ampliada inicial [A | I_n]',
    description: 'Se construye la matriz ampliada uniendo A con la identidad I. Se aplicará Gauss-Jordan hasta obtener [I | A⁻¹].',
    latex: augInvToTex(aug, n)
  });

  // Gauss-Jordan on aug to get [I_n | A^(-1)]
  for (let col = 0; col < n; col++) {
    // Find pivot
    let pivotRow = col;
    while (pivotRow < n && aug[pivotRow][col].isZero()) {
      pivotRow++;
    }

    if (pivotRow !== col) {
      const temp = aug[col];
      aug[col] = aug[pivotRow];
      aug[pivotRow] = temp;

      const opTex = `\\text{Fila } ${col + 1} \\longleftrightarrow \\text{Fila } ${pivotRow + 1}`;
      invSteps.push({
        title: `Intercambiar Fila ${col + 1} y Fila ${pivotRow + 1}`,
        latex: `${opTex}\\\\[0.6em] \\text{Nueva matriz aumentada [A | I]:} \\\\[0.3em] ${augInvToTex(aug, n)}`
      });
    }

    const pivot = aug[col][col];

    // Scale pivot row to 1
    if (!pivot.isOne()) {
      const invPivot = pivot.inv();
      for (let c = 0; c < 2 * n; c++) {
        aug[col][c] = aug[col][c].mul(invPivot);
      }
      const opTex = `\\text{Fila } ${col + 1} \\div (${pivot.toTex()})`;
      invSteps.push({
        title: `Normalizar Fila ${col + 1}: dividir entre ${pivot.toTex()}`,
        latex: `${opTex}\\\\[0.6em] \\text{Nueva matriz aumentada [A | I]:} \\\\[0.3em] ${augInvToTex(aug, n)}`
      });
    }

    // Eliminate other rows
    for (let r = 0; r < n; r++) {
      if (r !== col && !aug[r][col].isZero()) {
        const factor = aug[r][col];
        for (let c = 0; c < 2 * n; c++) {
          aug[r][c] = aug[r][c].sub(factor.mul(aug[col][c]));
        }

        const factorTex = factor.abs().toTex();
        const opTex = factor.isNegative()
          ? `\\text{Fila } ${r + 1} + (${factorTex}) \\cdot \\text{Fila } ${col + 1}`
          : `\\text{Fila } ${r + 1} - (${factorTex}) \\cdot \\text{Fila } ${col + 1}`;

        invSteps.push({
          title: `Hacer cero en la Fila ${r + 1}: restar (${factor.toTex()}) veces la Fila ${col + 1}`,
          latex: `${opTex}\\\\[0.6em] \\text{Nueva matriz aumentada [A | I]:} \\\\[0.3em] ${augInvToTex(aug, n)}`
        });
      }
    }
  }

  // Extract A^(-1)
  const invA = aug.map(row => row.slice(n));

  // Determine if A^(-1) contains fractions and find common denominator to give integer representation
  let invLcm = 1n;
  let hasFractions = false;
  for (const row of invA) {
    for (const val of row) {
      if (val.d !== 1n) {
        hasFractions = true;
        // gcd-based lcm
        let a = invLcm, b = val.d;
        while (b !== 0n) { const t = b; b = a % b; a = t; }
        invLcm = (invLcm / a) * val.d;
      }
    }
  }

  // Integer matrix = invA * invLcm
  const intMatrixAInv = invA.map(row => row.map(val => val.mul(new Fraction(invLcm, 1n))));

  steps.push({
    title: 'Paso 2: Obtención de la Matriz Inversa A⁻¹ mediante Gauss-Jordan',
    description: 'Se realizaron las operaciones sobre la matriz ampliada [A | I] hasta llegar a [I | A⁻¹]. En cada paso se observa la nueva matriz resultante.',
    latex: hasFractions && invLcm > 1n
      ? `A^{-1} = ${matrixToTex(invA)} = \\dfrac{1}{${invLcm.toString()}}\\, ${matrixToTex(intMatrixAInv)}`
      : `A^{-1} = ${matrixToTex(invA)}`,
    matrix: cloneMatrix(invA),
    substeps: invSteps
  });

  // Step 3: Multiply X = A^(-1) * B
  const bVectorTex = `\\left(\\begin{array}{c}\n${B.map(b => b.toTex()).join(' \\\\ \n')}\n\\end{array}\\right)`;
  const multSteps = [];
  const solution = [];

  for (let i = 0; i < n; i++) {
    let sum = Fraction.zero();
    const productTerms = [];

    for (let j = 0; j < n; j++) {
      const aVal = invA[i][j];
      const bVal = B[j];
      const prod = aVal.mul(bVal);
      sum = sum.add(prod);
      productTerms.push(`\\left(${aVal.toTex()}\\right)\\!\\left(${bVal.toTex()}\\right)`);
    }

    solution.push({
      variable: varNames[i],
      fraction: sum,
      tex: sum.toTex(),
      decimal: sum.toDecimalString()
    });

    multSteps.push({
      variable: varNames[i],
      latex: `${varNames[i]} = ${productTerms.join(' + ')} = \\boxed{${sum.toTex()}}`
    });
  }

  // Check if solution has fractions to compute scaled integer solution
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
    title: 'Paso 3: Producto X = A⁻¹ · B (Solución del sistema)',
    description: 'Se multiplica la matriz inversa obtenida por el vector de términos independientes B.',
    latex: `\\begin{pmatrix} ${varNames.join(' \\\\ ')} \\end{pmatrix} = ${matrixToTex(invA)} \\cdot ${bVectorTex}`,
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
    summary: `La matriz inversa existe (\\det(A) = ${detA.toTex()} \\neq 0) calculada por ${detMethodLabel}. Al multiplicar A^{-1} \\cdot B se obtiene la solución única.`
  };
}
