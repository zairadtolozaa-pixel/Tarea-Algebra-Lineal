import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import MatrixInput from './components/MatrixInput';
import TextMatrixInput from './components/TextMatrixInput';
import SolverControls from './components/SolverControls';
import ResultsView from './components/ResultsView';
import ExamplesModal from './components/ExamplesModal';
import { getVariableNames, createEmptyMatrix } from './math/matrixUtils';
import { solveGauss } from './math/solvers/gauss';
import { solveGaussJordan } from './math/solvers/gaussJordan';
import { solveInverseMatrix } from './math/solvers/inverse';
import { solveCramer } from './math/solvers/cramer';
import './App.css';

export default function App() {
  // Dimensions
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  // Matrix values
  const [matrixA, setMatrixA] = useState([
    ['2', '1', '-1'],
    ['-3', '-1', '2'],
    ['-2', '1', '2']
  ]);
  const [vectorB, setVectorB] = useState(['8', '-11', '-3']);

  // Configuration options
  const [varStyle, setVarStyle] = useState('letters'); // 'letters' (x, y, z) or 'subscript' (x1, x2, x3)
  const [numFormat, setNumFormat] = useState('fraction'); // 'fraction' or 'decimal'
  const [decimalPlaces, setDecimalPlaces] = useState(4);
  const [inputMode, setInputMode] = useState('cells'); // 'cells' or 'text'
  const [isExamplesOpen, setIsExamplesOpen] = useState(false);

  // Resolution state
  const [activeMethod, setActiveMethod] = useState(null);
  const [result, setResult] = useState(null);
  const [detMethod, setDetMethod] = useState('sarrus'); // 'sarrus' or 'cofactors'
  const [problemContext, setProblemContext] = useState(null); // 'vehicular' or 'quimico'

  // Variable names computed from count and style
  const varNames = useMemo(() => {
    return getVariableNames(cols, varStyle);
  }, [cols, varStyle]);

  const isSquare = rows === cols;

  // Handlers
  const handleCellChange = (r, c, val) => {
    setMatrixA((prev) => {
      const copy = prev.map((row) => [...row]);
      if (!copy[r]) copy[r] = [];
      copy[r][c] = val;
      return copy;
    });
  };

  const handleBChange = (r, val) => {
    setVectorB((prev) => {
      const copy = [...prev];
      copy[r] = val;
      return copy;
    });
  };

  const handleSetDimensions = (newRows, newCols) => {
    const clampedRows = Math.max(2, Math.min(8, newRows));
    const clampedCols = Math.max(2, Math.min(8, newCols));

    setMatrixA((prev) => {
      const nextA = [];
      for (let r = 0; r < clampedRows; r++) {
        const row = [];
        for (let c = 0; c < clampedCols; c++) {
          row.push(prev[r]?.[c] !== undefined ? prev[r][c] : '0');
        }
        nextA.push(row);
      }
      return nextA;
    });

    setVectorB((prev) => {
      const nextB = [];
      for (let r = 0; r < clampedRows; r++) {
        nextB.push(prev[r] !== undefined ? prev[r] : '0');
      }
      return nextB;
    });

    setRows(clampedRows);
    setCols(clampedCols);
    setResult(null);
    setActiveMethod(null);
    setProblemContext(null);
  };

  const handleRemoveColumn = (colIndex) => {
    if (cols <= 2) return;
    const newCols = cols - 1;
    setMatrixA((prev) => prev.map((row) => row.filter((_, idx) => idx !== colIndex)));
    setCols(newCols);
    setResult(null);
    setActiveMethod(null);
    setProblemContext(null);
  };

  const handleAddColumn = () => {
    if (cols >= 8) return;
    const newCols = cols + 1;
    setMatrixA((prev) => prev.map((row) => [...row, '0']));
    setCols(newCols);
    setResult(null);
    setActiveMethod(null);
    setProblemContext(null);
  };

  const handleRemoveRow = (rowIndex) => {
    if (rows <= 2) return;
    const newRows = rows - 1;
    setMatrixA((prev) => prev.filter((_, idx) => idx !== rowIndex));
    setVectorB((prev) => prev.filter((_, idx) => idx !== rowIndex));
    setRows(newRows);
    setResult(null);
    setActiveMethod(null);
    setProblemContext(null);
  };

  const handleAddRow = () => {
    if (rows >= 8) return;
    const newRows = rows + 1;
    setMatrixA((prev) => [...prev, Array.from({ length: cols }, () => '0')]);
    setVectorB((prev) => [...prev, '0']);
    setRows(newRows);
    setResult(null);
    setActiveMethod(null);
    setProblemContext(null);
  };

  const handleLoadUserSystem = () => {
    setRows(3);
    setCols(2);
    setMatrixA([
      ['2', '3'],
      ['1', '-2'],
      ['3', '2']
    ]);
    setVectorB(['3', '5', '7']);
    setResult(null);
    setActiveMethod(null);
    setProblemContext(null);
  };

  const handleClear = () => {
    setMatrixA(createEmptyMatrix(rows, cols, ''));
    setVectorB(Array.from({ length: rows }, () => ''));
    setResult(null);
    setActiveMethod(null);
    setProblemContext(null);
  };

  const handleRandom = () => {
    const newA = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => {
        const val = Math.floor(Math.random() * 11) - 5; // -5 to 5
        return val.toString();
      })
    );
    const newB = Array.from({ length: rows }, () => {
      const val = Math.floor(Math.random() * 19) - 9; // -9 to 9
      return val.toString();
    });

    setMatrixA(newA);
    setVectorB(newB);
    setResult(null);
    setActiveMethod(null);
    setProblemContext(null);
  };

  const handleApplyMatrix = (newA, newB) => {
    const r = newA.length;
    const c = newA[0].length;
    setRows(r);
    setCols(c);
    setMatrixA(newA);
    setVectorB(newB);
    setInputMode('cells');
    setResult(null);
    setActiveMethod(null);
    setProblemContext(null);
  };

  const handleSelectExample = (newA, newB) => {
    const r = newA.length;
    const c = newA[0].length;
    setRows(r);
    setCols(c);
    setMatrixA(newA);
    setVectorB(newB);
    setResult(null);
    setActiveMethod(null);
    setProblemContext(null);
  };

  const handleSolve = (methodId, overrideContext = undefined, overrideDetMethod = undefined) => {
    const targetMethod = methodId || activeMethod || 'gauss';
    setActiveMethod(targetMethod);

    const isGaussFamily = targetMethod === 'gauss' || targetMethod === 'gaussJordan';
    // Only Gauss and Gauss-Jordan allow application contexts (Flujo vehicular & Balance químico)
    const activeCtx = isGaussFamily
      ? (overrideContext !== undefined ? overrideContext : problemContext)
      : null;
    if (!isGaussFamily && problemContext) {
      setProblemContext(null);
    }

    const activeDet = overrideDetMethod !== undefined ? overrideDetMethod : detMethod;

    const options = {
      variableNames: varNames,
      useDecimal: numFormat === 'decimal',
      decimals: decimalPlaces,
      detMethod: activeDet,
      context: activeCtx
    };

    let solveOutput = null;

    try {
      switch (targetMethod) {
        case 'gauss':
          solveOutput = solveGauss(matrixA, vectorB, options);
          break;
        case 'gaussJordan':
          solveOutput = solveGaussJordan(matrixA, vectorB, options);
          break;
        case 'inverse':
          solveOutput = solveInverseMatrix(matrixA, vectorB, options);
          break;
        case 'cramer':
          solveOutput = solveCramer(matrixA, vectorB, options);
          break;
        default:
          break;
      }
      setResult(solveOutput);

      // Smooth scroll to results
      setTimeout(() => {
        const resultsEl = document.getElementById('results-section');
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err) {
      console.error('Error during solve:', err);
      setResult({
        status: 'error',
        statusText: 'Error en el cálculo',
        summary: `Ocurrió un error al procesar el sistema: ${err.message}`,
        steps: []
      });
    }
  };

  const handleContextChange = (newContext) => {
    setProblemContext(newContext);
    handleSolve(activeMethod, newContext);
  };

  const handleDetMethodChange = (newDetMethod) => {
    setDetMethod(newDetMethod);
    handleSolve(activeMethod, undefined, newDetMethod);
  };

  const getMethodDisplayName = (id) => {
    switch (id) {
      case 'gauss':
        return 'Eliminación de Gauss';
      case 'gaussJordan':
        return 'Método de Gauss-Jordan';
      case 'inverse':
        return 'Método de la Matriz Inversa (X = A⁻¹ · B)';
      case 'cramer':
        return 'Regla de Cramer';
      default:
        return 'Método Seleccionado';
    }
  };

  return (
    <div className="app-layout">
      <Header
        varStyle={varStyle}
        setVarStyle={setVarStyle}
        numFormat={numFormat}
        setNumFormat={setNumFormat}
        decimalPlaces={decimalPlaces}
        setDecimalPlaces={setDecimalPlaces}
        onOpenExamples={() => setIsExamplesOpen(true)}
      />

      <main className="main-content">
        <section className="input-section">
          <MatrixInput
            rows={rows}
            cols={cols}
            matrixA={matrixA}
            vectorB={vectorB}
            onCellChange={handleCellChange}
            onBChange={handleBChange}
            onSetDimensions={handleSetDimensions}
            onClear={handleClear}
            onRandom={handleRandom}
            varNames={varNames}
            inputMode={inputMode}
            setInputMode={setInputMode}
            onRemoveColumn={handleRemoveColumn}
            onAddColumn={handleAddColumn}
            onRemoveRow={handleRemoveRow}
            onAddRow={handleAddRow}
            onLoadUserSystem={handleLoadUserSystem}
            onSolve={handleSolve}
            activeMethod={activeMethod}
            isSquare={isSquare}
          />

          {inputMode === 'text' && (
            <TextMatrixInput
              currentA={matrixA}
              currentB={vectorB}
              onApplyMatrix={handleApplyMatrix}
            />
          )}
        </section>

        <section className="controls-section">
          <SolverControls
            onSolve={handleSolve}
            activeMethod={activeMethod}
            isSquare={isSquare}
            rows={rows}
            cols={cols}
            detMethod={detMethod}
            onDetMethodChange={handleDetMethodChange}
          />
        </section>

        <section id="results-section" className="results-wrapper">
          <ResultsView
            result={result}
            activeMethod={activeMethod}
            methodName={getMethodDisplayName(activeMethod)}
            numFormat={numFormat}
            decimalPlaces={decimalPlaces}
            varNames={varNames}
            onContextChange={handleContextChange}
          />
        </section>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p>
            Calculadora de Sistemas de Ecuaciones Lineales • Inspirada en MatrixCalc • Métodos: Gauss, Gauss-Jordan, Matriz Inversa, Regla de Cramer.
          </p>
          <p className="footer-sub">
            Aritmética fraccionaria exacta con precisión matemática garantizada.
          </p>
        </div>
      </footer>

      <ExamplesModal
        isOpen={isExamplesOpen}
        onClose={() => setIsExamplesOpen(false)}
        onSelectExample={handleSelectExample}
      />
    </div>
  );
}
