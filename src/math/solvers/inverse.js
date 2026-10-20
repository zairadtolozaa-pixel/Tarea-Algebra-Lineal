import { Fraction } from '../fraction';
import { cloneMatrix, matrixToTex, calculateDeterminantWithSteps } from '../matrixUtils';

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

  steps.push({
    title: 'Paso 1: Cálculo del determinante \\det(A)',
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

  // Step 2: Compute Inverse A^(-1) using augmented [A | I_n]
  const invSteps = [];
  const aug = Array.from({ length: n }, (_, r) => {
    const row = [...A[r]];
    for (let c = 0; c < n; c++) {
      row.push(r === c ? Fraction.one() : Fraction.zero());
    }
    return row;
  });

  invSteps.push({
    title: 'Matriz ampliada [A | I_n]',
    description: 'Se coloca la matriz identidad I a la derecha de A.',
    latex: matrixToTex(aug, { isAugmented: false }),
    matrix: cloneMatrix(aug)
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

      invSteps.push({
        title: `Intercambiar Fila ${col + 1} y Fila ${pivotRow + 1}`,
        latex: `F_{${col + 1}} \\leftrightarrow F_{${pivotRow + 1}}`,
        matrix: cloneMatrix(aug)
      });
    }

    const pivot = aug[col][col];

    // Scale pivot row to 1
    if (!pivot.isOne()) {
      const invPivot = pivot.inv();
      for (let c = 0; c < 2 * n; c++) {
        aug[col][c] = aug[col][c].mul(invPivot);
      }

      invSteps.push({
        title: `Hacer pivote = 1 en Fila ${col + 1}`,
        latex: `F_{${col + 1}} \\to \\frac{1}{${pivot.toTex()}} \\cdot F_{${col + 1}}`,
        matrix: cloneMatrix(aug)
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
          ? `F_{${r + 1}} \\to F_{${r + 1}} + (${factorTex}) \\cdot F_{${col + 1}}`
          : `F_{${r + 1}} \\to F_{${r + 1}} - (${factorTex}) \\cdot F_{${col + 1}}`;

        invSteps.push({
          title: `Hacer cero en (${r + 1}, ${col + 1})`,
          latex: opTex,
          matrix: cloneMatrix(aug)
        });
      }
    }
  }

  // Extract A^(-1)
  const invA = aug.map(row => row.slice(n));

  steps.push({
    title: 'Paso 2: Cálculo de la matriz inversa A^{-1}',
    description: 'Transformación de [A | I] a [I | A^{-1}] mediante operaciones elementales de Gauss-Jordan.',
    latex: `A^{-1} = ${matrixToTex(invA)}`,
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
      productTerms.push(`(${aVal.toTex()}) \\cdot (${bVal.toTex()})`);
    }

    solution.push({
      variable: varNames[i],
      fraction: sum,
      tex: sum.toTex(),
      decimal: sum.toDecimalString()
    });

    multSteps.push({
      variable: varNames[i],
      latex: `${varNames[i]} = ${productTerms.join(' + ')} = ${sum.toTex()}`
    });
  }

  steps.push({
    title: 'Paso 3: Producto matricial X = A^{-1} \\cdot B',
    description: 'Se multiplica la matriz inversa obtenida por el vector de términos independientes.',
    latex: `\\begin{pmatrix} ${varNames.join(' \\\\ ')} \\end{pmatrix} = ${matrixToTex(invA)} \\cdot ${bVectorTex}`,
    multiplicationDetails: multSteps
  });

  return {
    status: 'determinado',
    statusText: 'Sistema Compatible Determinado (Solución Única)',
    detA,
    invA,
    solution,
    steps,
    summary: `La matriz inversa existe (\\det(A) = ${detA.toTex()} \\neq 0). Multiplicando A^{-1} \\cdot B se obtiene la solución única.`
  };
}
