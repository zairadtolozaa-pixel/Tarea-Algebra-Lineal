import { Fraction } from '../fraction';
import { cloneMatrix, matrixToTex, determinantToTex, calculateDeterminantWithSteps } from '../matrixUtils';

/**
 * Solves a linear system using Cramer's Rule
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

  // Step 1: Principal determinant Delta = det(A)
  const detResult = calculateDeterminantWithSteps(A, options);
  const delta = detResult.value;

  steps.push({
    title: 'Paso 1: Cálculo del determinante del sistema (\\Delta)',
    description: 'Se calcula el determinante de la matriz de coeficientes A.',
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

    const detAiResult = calculateDeterminantWithSteps(Ai, options);
    const deltaI = detAiResult.value;
    if (!deltaI.isZero()) anyNonZeroDeltaI = true;

    cramerVariables.push({
      varName: varNames[i],
      matrix: cloneMatrix(Ai),
      deltaI,
      substeps: detAiResult.steps
    });

    steps.push({
      title: `Paso ${i + 2}: Cálculo de \\Delta_{${varNames[i]}}`,
      description: `Se reemplaza la columna ${i + 1} de la matriz A por el vector de términos independientes B.`,
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
        summary: `Como \\Delta = 0 y al menos uno de los determinantes de las incógnitas \\Delta_i \\neq 0, según la Regla de Cramer el sistema es incompatible y no posee solución.`
      };
    } else {
      return {
        status: 'indeterminado',
        statusText: 'Sistema Compatible Indeterminado (o Incompatible)',
        delta,
        steps,
        cramerVariables,
        summary: `Como \\Delta = 0 y todos los \\Delta_i = 0, el sistema no tiene solución única (es compatible indeterminado con infinitas soluciones o incompatible si las ecuaciones son contradictorias). Se recomienda aplicar el Método de Gauss para analizar su grado de libertad.`
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
      latex: `${varNames[i]} = \\frac{\\Delta_{${varNames[i]}}}{\\Delta} = \\frac{${deltaI.toTex()}}{${delta.toTex()}} = ${xi.toTex()}`
    });
  }

  steps.push({
    title: `Paso final: Cálculo de las incógnitas (${varNames.join(', ')})`,
    description: 'Se divide cada determinante \\Delta_i entre el determinante del sistema \\Delta.',
    latex: finalCalculations.map(c => c.latex).join(' \\\\ \n')
  });

  return {
    status: 'determinado',
    statusText: 'Sistema Compatible Determinado (Solución Única)',
    delta,
    solution,
    cramerVariables,
    steps,
    summary: `El determinante del sistema es diferente de cero (\\Delta = ${delta.toTex()} \\neq 0). Aplicando la Regla de Cramer se determinan los valores de todas las incógnitas.`
  };
}
