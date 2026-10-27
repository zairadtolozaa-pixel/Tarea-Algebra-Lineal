import { Fraction } from '../fraction';
import { cloneMatrix, matrixToTex, determinantToTex, calculateDeterminantWithSteps } from '../matrixUtils';

/**
 * Solves a linear system using Cramer's Rule.
 * Uses Sarrus for 3×3 matrices, Cofactor expansion for n≥4.
 */
export function solveCramer(matrixA, vectorB, options = {}) {
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
      summary: `La Regla de Cramer requiere un sistema cuadrado con el mismo número de ecuaciones que de incógnitas (${m} \\times ${n}).`,
      steps: []
    };
  }

  const steps = [];

  // Convert A and B to Fractions
  const A = matrixA.map(row => row.map(c => (c instanceof Fraction ? c : Fraction.fromString(String(c)))));
  const B = vectorB.map(b => (b instanceof Fraction ? b : Fraction.fromString(String(b))));

  // Determine and display the determinant method
  const chosen = options.detMethod || (n === 3 ? 'sarrus' : 'cofactors');
  const detMethodLabel = chosen === 'sarrus'
    ? '📐 Método de Sarrus'
    : chosen === 'cofactors'
    ? '🔢 Método de Cofactores (Laplace)'
    : 'Fórmula directa';

  // Step 1: Principal determinant Delta = det(A)
  const detResult = calculateDeterminantWithSteps(A, { ...options, detMethod: chosen });
  const delta = detResult.value;

  steps.push({
    title: `Paso 1: Determinante del sistema (Δ) — ${detMethodLabel}`,
    description: 'Se calcula el determinante de la matriz de coeficientes A. Si Δ ≠ 0, el sistema tiene solución única.',
    latex: `\\Delta = ${determinantToTex(A)} = ${delta.toTex()}`,
    substeps: detResult.steps
  });

  // Calculate Delta_i for each variable
  const cramerVariables = [];
  let anyNonZeroDeltaI = false;

  for (let i = 0; i < n; i++) {
    // Replace column i with vector B
    const Ai = A.map((row, r) => {
      const newRow = [...row];
      newRow[i] = B[r];
      return newRow;
    });

    const detAiResult = calculateDeterminantWithSteps(Ai, { ...options, detMethod: chosen });
    const deltaI = detAiResult.value;
    if (!deltaI.isZero()) anyNonZeroDeltaI = true;

    cramerVariables.push({
      varName: varNames[i],
      matrix: cloneMatrix(Ai),
      deltaI,
      substeps: detAiResult.steps
    });

    steps.push({
      title: `Paso ${i + 2}: Δ_{${varNames[i]}} — columna ${i + 1} reemplazada por B`,
      description: `Se reemplaza la columna ${i + 1} de la matriz A por el vector B para calcular Δ_{${varNames[i]}}.`,
      latex: `\\Delta_{${varNames[i]}} = ${determinantToTex(Ai)} = ${deltaI.toTex()}`,
      substeps: detAiResult.steps
    });
  }

  // Handle Delta = 0
  if (delta.isZero()) {
    if (anyNonZeroDeltaI) {
      return {
        status: 'incompatible',
        statusText: 'Sistema Incompatible (Sin Solución)',
        delta,
        steps,
        cramerVariables,
        summary: `Como \\Delta = 0 y al menos uno de los determinantes \\Delta_i \\neq 0, el sistema es incompatible y no posee solución.`
      };
    } else {
      return {
        status: 'indeterminado',
        statusText: 'Sistema Compatible Indeterminado (o Incompatible)',
        delta,
        steps,
        cramerVariables,
        summary: `Como \\Delta = 0 y todos los \\Delta_i = 0, el sistema no tiene solución única (infinitas soluciones o incompatible). Se recomienda aplicar el Método de Gauss para analizarlo.`
      };
    }
  }

  // Calculate solutions x_i = Delta_i / Delta
  const solution = [];
  const finalCalculations = [];

  for (let i = 0; i < n; i++) {
    const deltaI = cramerVariables[i].deltaI;
    const xi = deltaI.div(delta);

    solution.push({
      variable: varNames[i],
      fraction: xi,
      tex: xi.toTex(),
      decimal: xi.toDecimalString()
    });

    finalCalculations.push({
      variable: varNames[i],
      latex: `${varNames[i]} = \\dfrac{\\Delta_{${varNames[i]}}}{\\Delta} = \\dfrac{${deltaI.toTex()}}{${delta.toTex()}} = \\boxed{${xi.toTex()}}`
    });
  }

  steps.push({
    title: `Paso final: Solución — ${varNames.join(', ')}`,
    description: 'Se divide cada Δᵢ entre el determinante del sistema Δ para obtener el valor de cada incógnita.',
    latex: finalCalculations.map(c => c.latex).join(' \\\\\\\\ \n')
  });

  return {
    status: 'determinado',
    statusText: 'Sistema Compatible Determinado (Solución Única)',
    delta,
    detMethod: detMethodLabel,
    solution,
    cramerVariables,
    steps,
    summary: `Determinante calculado por ${detMethodLabel}: \\Delta = ${delta.toTex()} \\neq 0. Aplicando Cramer se obtiene la solución única.`
  };
}
