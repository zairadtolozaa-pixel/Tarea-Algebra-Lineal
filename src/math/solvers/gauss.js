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

    const contextSteps = [];
    if (context) {
      const isVehicular = context === 'vehicular';
      const ctxName = isVehicular ? 'Flujo Vehicular' : 'Balance Químico';
      const ctxEmoji = isVehicular ? '🚗' : '⚗️';
      const unitName = isVehicular ? '\\text{vehículos/hora}' : '\\text{moles / moléculas}';

      contextSteps.push({
        title: `${ctxEmoji} Ajuste de Variables Libres (${ctxName})`,
        description: isVehicular
          ? `En una red vial con infinitas soluciones, las variables libres (${freeVarNames.join(', ')}) controlan el flujo del circuito cerrado. Para garantizar que no existan tramos bloqueados ni flujo nulo o negativo, se asigna un caudal positivo no nulo (t = 1) a las variables libres:`
          : `En una reacción química con infinitas soluciones, se asigna t = 1 a la variable libre para obtener la reacción base y luego se escala a los enteros mínimos de reacción:`,
        latex: `\\text{Variables libres: } ${freeVarNames.map(v => `${v} = 1`).join(', ')}`,
        highlightRows: []
      });

      contextSteps.push({
        title: `${ctxEmoji} Solución Particular Escalada a Enteros (${ctxName})`,
        description: `Sustituyendo hacia atrás y multiplicando por el m.c.m. de los denominadores para eliminar fracciones, se obtiene el vector solución exacto para ${ctxName}:`,
        latex: `\\vec{X}_{\\text{${isVehicular ? 'vial' : 'reacción'}}} = \\begin{pmatrix} ${partSolFormatted.map(s => `${s.variable} = ${s.tex} \\text{ } ${unitName}`).join(' \\\\ ')} \\end{pmatrix}`,
        highlightRows: []
      });
    }

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
      steps: [...steps, ...contextSteps],
      contextSteps,
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

  // Check if original solution contains fractions or decimals
  const hasFractionSolution = solution.some(v => v.d !== 1n);

  // If a context was chosen (vehicular o quimico), scale solution to positive integers/natural numbers!
  let finalSolution = solution;
  const contextSteps = [];

  if (options.context) {
    const isVehicular = options.context === 'vehicular';
    const ctxName = isVehicular ? 'Flujo Vehicular' : 'Balance Químico';
    const ctxEmoji = isVehicular ? '🚗' : '⚗️';
    const unitName = isVehicular ? '\\text{vehículos/hora}' : '\\text{moles / moléculas}';

    let solLcm = 1n;
    for (const v of solution) {
      if (v.d !== 0n) {
        let a = solLcm, b = v.d;
        while (b !== 0n) { const t = b; b = a % b; a = t; }
        solLcm = (solLcm / a) * v.d;
      }
    }

    if (solLcm > 1n) {
      finalSolution = solution.map(v => v.mul(new Fraction(solLcm, 1n)));
      contextSteps.push({
        title: `${ctxEmoji} Paso de Ajuste (${ctxName}): Multiplicación por m.c.m. = ${solLcm}`,
        description: `En el contexto de ${ctxName}, los resultados deben ser números enteros exactos (los vehículos o las moléculas son unidades indivisibles). Se multiplican todas las variables por el mínimo común múltiplo de los denominadores (${solLcm}) para eliminar las fracciones:`,
        latex: `\\vec{X}_{\\text{enteros}} = (${solLcm}) \\cdot \\begin{pmatrix} ${solution.map(s => s.toTex()).join(' \\\\ ')} \\end{pmatrix} = \\begin{pmatrix} ${finalSolution.map(s => s.toTex()).join(' \\\\ ')} \\end{pmatrix}`,
        highlightRows: []
      });
    }

    // Ensure positive natural numbers
    const anyNeg = finalSolution.some(v => v.isNegative());
    const allNeg = finalSolution.every(v => v.isNegative() || v.isZero());

    if (allNeg) {
      finalSolution = finalSolution.map(v => v.neg());
      contextSteps.push({
        title: `${ctxEmoji} Normalización de Sentido (${ctxName}): Inversión de signo`,
        description: isVehicular
          ? 'En redes de flujo vehicular, los caudales no pueden ser negativos. Al resultar todas las ramas con signo negativo, se invierte la orientación de referencia de las vías para obtener flujos positivos en el sentido real de circulación:'
          : 'En reacciones químicas, los coeficientes de balance estequiométrico deben ser cantidades positivas naturales (> 0). Se multiplican por -1:',
        latex: `\\vec{X}_{\\text{positivo}} = (-1) \\cdot \\vec{X} = \\begin{pmatrix} ${finalSolution.map(s => s.toTex()).join(' \\\\ ')} \\end{pmatrix}`,
        highlightRows: []
      });
    } else if (anyNeg && isVehicular) {
      contextSteps.push({
        title: `${ctxEmoji} Análisis Físico del Sentido de Circulación (${ctxName})`,
        description: 'En el modelado vial, los valores negativos indican que el flujo vehicular real circula en sentido opuesto al asignado arbitrariamente en la flecha de la calle.',
        latex: `\\vec{X}_{\\text{flujo}} = \\begin{pmatrix} ${finalSolution.map((s, idx) => `${varNames[idx]} = ${s.abs().toTex()} \\text{ } ${unitName} \\text{ (${s.isNegative() ? 'sentido opuesto' : 'sentido asignado'})}`).join(' \\\\ ')} \\end{pmatrix}`,
        highlightRows: []
      });
    } else {
      contextSteps.push({
        title: `${ctxEmoji} Interpretación Final del Procedimiento (${ctxName})`,
        description: isVehicular
          ? 'Cada valor obtenido representa el caudal de vehículos por unidad de tiempo en cada tramo de la red de tránsito:'
          : 'Cada valor obtenido representa el número entero mínimo de moléculas en la reacción balanceada:',
        latex: `\\begin{cases} ${finalSolution.map((s, idx) => `${varNames[idx]} = ${s.toTex()} \\text{ } ${unitName}`).join(' \\\\ ')} \\end{cases}`,
        highlightRows: []
      });
    }
  }

  // Reverse so it's shown in order x_n up to x_1
  return {
    status: 'determinado',
    statusText: 'Sistema Compatible Determinado (Solución Única)',
    rankA,
    rankM,
    hasFractionSolution,
    context: options.context || null,
    solution: finalSolution.map((val, idx) => ({
      variable: varNames[idx],
      fraction: val,
      tex: val.toTex(),
      decimal: val.toDecimalString()
    })),
    steps: [...steps, ...contextSteps],
    contextSteps,
    backSubstitutionSteps,
    summary: options.context
      ? `Solución resuelta por Eliminación de Gauss y reorientada para ${options.context === 'vehicular' ? 'Flujo Vehicular' : 'Balance Químico'}. Se ajustó el sistema para entregar valores enteros / naturales exactos.`
      : `El rango de la matriz es igual al número de incógnitas (${rankA} = ${n}). El sistema tiene solución única hallada mediante sustitución regresiva.`
  };
}
