import React, { useRef } from 'react';
import {
  Plus,
  Minus,
  Trash2,
  Shuffle,
  FileText,
  Grid,
  Copy,
  Check,
  X,
  Sparkles,
  Zap,
  ArrowDownRight,
  Layers,
  RefreshCw,
  Divide
} from 'lucide-react';
import MathView from './MathView';

export default function MatrixInput({
  rows,
  cols,
  matrixA,
  vectorB,
  onCellChange,
  onBChange,
  onSetDimensions,
  onClear,
  onRandom,
  varNames,
  inputMode,
  setInputMode,
  onRemoveColumn,
  onAddColumn,
  onRemoveRow,
  onAddRow,
  onLoadUserSystem,
  onSolve,
  activeMethod,
  isSquare
}) {
  const [copied, setCopied] = React.useState(false);
  const inputRefs = useRef({});

  const handleKeyDown = (e, r, c, isB = false) => {
    const key = e.key;

    if (key === 'ArrowRight') {
      if (isB) {
        if (r < rows - 1) {
          inputRefs.current[`${r + 1}-0`]?.focus();
        }
      } else if (c < cols - 1) {
        inputRefs.current[`${r}-${c + 1}`]?.focus();
      } else {
        inputRefs.current[`b-${r}`]?.focus();
      }
    } else if (key === 'ArrowLeft') {
      if (isB) {
        inputRefs.current[`${r}-${cols - 1}`]?.focus();
      } else if (c > 0) {
        inputRefs.current[`${r}-${c - 1}`]?.focus();
      } else if (r > 0) {
        inputRefs.current[`b-${r - 1}`]?.focus();
      }
    } else if (key === 'ArrowDown') {
      if (isB) {
        if (r < rows - 1) inputRefs.current[`b-${r + 1}`]?.focus();
      } else if (r < rows - 1) {
        inputRefs.current[`${r + 1}-${c}`]?.focus();
      }
    } else if (key === 'ArrowUp') {
      if (isB) {
        if (r > 0) inputRefs.current[`b-${r - 1}`]?.focus();
      } else if (r > 0) {
        inputRefs.current[`${r - 1}-${c}`]?.focus();
      }
    } else if (key === 'Enter') {
      e.preventDefault();
      if (isB) {
        if (r < rows - 1) {
          inputRefs.current[`${r + 1}-0`]?.focus();
        } else {
          // Last cell Enter triggers calculation!
          onSolve?.(activeMethod || 'gauss');
        }
      } else if (c < cols - 1) {
        inputRefs.current[`${r}-${c + 1}`]?.focus();
      } else {
        inputRefs.current[`b-${r}`]?.focus();
      }
    }
  };

  const copyAsText = () => {
    const lines = [];
    for (let r = 0; r < rows; r++) {
      const rowVals = matrixA[r].map((v) => (v === '' ? '0' : v));
      rowVals.push(vectorB[r] === '' ? '0' : vectorB[r]);
      lines.push(rowVals.join(' '));
    }
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const presets = [
    { label: '3×2 (Tu sistema)', r: 3, c: 2, highlight: true },
    { label: '2×2', r: 2, c: 2 },
    { label: '3×3', r: 3, c: 3 },
    { label: '2×3', r: 2, c: 3 },
    { label: '4×3', r: 4, c: 3 },
    { label: '4×4', r: 4, c: 4 }
  ];

  const currentMethodName = () => {
    switch (activeMethod) {
      case 'gaussJordan':
        return 'Gauss - Jordan';
      case 'inverse':
        return 'Matriz Inversa';
      case 'cramer':
        return 'Regla de Cramer';
      default:
        return 'Eliminación de Gauss';
    }
  };

  return (
    <div className="matrix-card">
      {/* Quick helper for the user's specific case */}
      <div className="quick-help-banner">
        <div className="quick-help-left">
          <Sparkles size={16} className="quick-help-icon" />
          <span className="quick-help-text">
            ¿Tienes 3 ecuaciones y solo 2 variables (como en tu imagen: <strong>x</strong> e <strong>y</strong>, sin <strong>z</strong>)?
          </span>
        </div>
        <div className="quick-help-right">
          <button
            type="button"
            className="load-user-system-pill"
            onClick={onLoadUserSystem}
            title="Cargar automáticamente el sistema 3x2: 2x+3y=3, x-2y=5, 3x+2y=7"
          >
            Cargar tu sistema (3 ec., x e y)
          </button>
        </div>
      </div>

      <div className="matrix-toolbar">
        <div className="dimension-controls">
          <div className="dim-group">
            <span className="dim-label">Ecuaciones (Filas):</span>
            <div className="stepper">
              <button
                type="button"
                className="step-btn"
                disabled={rows <= 2}
                onClick={() => onSetDimensions(rows - 1, cols)}
                title="Quitar ecuación (fila)"
              >
                <Minus size={14} />
              </button>
              <span className="dim-value">{rows}</span>
              <button
                type="button"
                className="step-btn"
                disabled={rows >= 8}
                onClick={() => onSetDimensions(rows + 1, cols)}
                title="Añadir ecuación (fila)"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="dim-separator">×</div>

          <div className="dim-group">
            <span className="dim-label">Incógnitas (Variables):</span>
            <div className="stepper">
              <button
                type="button"
                className="step-btn"
                disabled={cols <= 2}
                onClick={() => onSetDimensions(rows, cols - 1)}
                title="Quitar variable / columna (ej: quitar z)"
              >
                <Minus size={14} />
              </button>
              <span className="dim-value">{cols}</span>
              <button
                type="button"
                className="step-btn"
                disabled={cols >= 8}
                onClick={() => onSetDimensions(rows, cols + 1)}
                title="Añadir variable / columna"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="preset-buttons">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                className={`preset-pill ${rows === p.r && cols === p.c ? 'active' : ''} ${p.highlight ? 'preset-highlight' : ''}`}
                onClick={() => onSetDimensions(p.r, p.c)}
                title={`Cambiar tamaño a ${p.r} ecuaciones y ${p.c} incógnitas`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="matrix-mode-toggle">
          <button
            type="button"
            className={`mode-btn ${inputMode === 'cells' ? 'active' : ''}`}
            onClick={() => setInputMode('cells')}
            title="Ingreso visual celda por celda"
          >
            <Grid size={15} />
            <span>Celdas</span>
          </button>
          <button
            type="button"
            className={`mode-btn ${inputMode === 'text' ? 'active' : ''}`}
            onClick={() => setInputMode('text')}
            title="Pegar texto o ecuaciones"
          >
            <FileText size={15} />
            <span>Texto</span>
          </button>
        </div>
      </div>

      {inputMode === 'cells' ? (
        <div className="matrix-grid-wrapper">
          <div className="matrix-bracket-left"></div>
          <div className="matrix-table-container">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th className="th-action-col"></th>
                  <th colSpan={cols} className="th-matrix-a">
                    Matriz de Coeficientes (A)
                  </th>
                  {cols < 8 && <th className="th-add-col-head"></th>}
                  <th className="th-divider"></th>
                  <th className="th-vector-b">Términos Indep. (B)</th>
                </tr>
                <tr className="subheaders">
                  <th className="th-action-col"></th>
                  {varNames.map((name, c) => (
                    <th key={c} className="th-var">
                      <div className="var-header-box">
                        <MathView math={name} />
                        {cols > 2 && (
                          <button
                            type="button"
                            className="var-delete-btn"
                            onClick={() => onRemoveColumn(c)}
                            title={`Eliminar incógnita ${name} (quitar columna)`}
                          >
                            <X size={11} />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                  {cols < 8 && (
                    <th className="th-add-col">
                      <button
                        type="button"
                        className="add-var-btn"
                        onClick={onAddColumn}
                        title="Añadir una variable más (columna)"
                      >
                        <Plus size={12} />
                        <span>Var</span>
                      </button>
                    </th>
                  )}
                  <th className="th-divider"></th>
                  <th className="th-b-header">
                    <MathView math="b_i" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: rows }).map((_, r) => (
                  <tr key={r} className="matrix-row">
                    <td className="row-action-cell">
                      {rows > 2 && (
                        <button
                          type="button"
                          className="row-delete-btn"
                          onClick={() => onRemoveRow(r)}
                          title={`Eliminar ecuación ${r + 1} (quitar fila)`}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </td>
                    {Array.from({ length: cols }).map((_, c) => (
                      <td key={c} className="matrix-cell">
                        <input
                          ref={(el) => (inputRefs.current[`${r}-${c}`] = el)}
                          type="text"
                          inputMode="text"
                          className="matrix-cell-input"
                          value={matrixA[r]?.[c] ?? ''}
                          placeholder="0"
                          onChange={(e) => onCellChange(r, c, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, r, c, false)}
                          aria-label={`Fila ${r + 1}, Columna ${c + 1}`}
                        />
                      </td>
                    ))}
                    {cols < 8 && <td className="empty-add-col-spacer"></td>}
                    <td className="matrix-divider-cell">
                      <div className="augmented-separator"></div>
                    </td>
                    <td className="matrix-cell b-cell">
                      <input
                        ref={(el) => (inputRefs.current[`b-${r}`] = el)}
                        type="text"
                        inputMode="text"
                        className="matrix-cell-input b-input"
                        value={vectorB[r] ?? ''}
                        placeholder="0"
                        onChange={(e) => onBChange(r, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, r, cols - 1, true)}
                        aria-label={`Término independiente fila ${r + 1}`}
                      />
                    </td>
                  </tr>
                ))}
                {rows < 8 && (
                  <tr className="add-row-tr">
                    <td colSpan={cols + 4} className="add-row-td">
                      <button
                        type="button"
                        className="add-row-btn"
                        onClick={onAddRow}
                        title="Añadir una ecuación más (fila)"
                      >
                        <Plus size={13} />
                        <span>Añadir ecuación (+ fila)</span>
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="matrix-bracket-right"></div>
        </div>
      ) : null}

      {/* Main Calculate Command Center - IMPOSSIBLE TO MISS */}
      <div className="matrix-calculate-section">
        <div className="calculate-main-bar">
          <button
            type="button"
            className="btn-primary-calculate"
            onClick={() => onSolve(activeMethod || 'gauss')}
            title="Calcular el sistema de ecuaciones con el método seleccionado"
          >
            <div className="btn-calc-glow"></div>
            <Zap size={22} className="calc-icon-pulse" />
            <div className="btn-calc-text-group">
              <span className="btn-calc-main-title">CALCULAR MATRIZ</span>
              <span className="btn-calc-sub-title">
                Resolver por {currentMethodName()} paso a paso
              </span>
            </div>
          </button>
        </div>

        <div className="calculate-direct-methods-container">
          <span className="direct-methods-title">
            O haz clic directo en el método que deseas calcular:
          </span>
          <div className="direct-methods-grid">
            <button
              type="button"
              className={`direct-calc-pill btn-gauss ${activeMethod === 'gauss' ? 'active' : ''}`}
              onClick={() => onSolve('gauss')}
              title="Calcular por Eliminación de Gauss"
            >
              <ArrowDownRight size={17} />
              <div className="pill-text-col">
                <span className="pill-title">Eliminación de Gauss</span>
                <span className="pill-sub">Triangularización</span>
              </div>
            </button>

            <button
              type="button"
              className={`direct-calc-pill btn-gaussjordan ${activeMethod === 'gaussJordan' ? 'active' : ''}`}
              onClick={() => onSolve('gaussJordan')}
              title="Calcular por Gauss-Jordan"
            >
              <Layers size={17} />
              <div className="pill-text-col">
                <span className="pill-title">Gauss - Jordan</span>
                <span className="pill-sub">Forma escalonada RREF</span>
              </div>
            </button>

            <button
              type="button"
              className={`direct-calc-pill btn-inverse ${activeMethod === 'inverse' ? 'active' : ''} ${!isSquare ? 'disabled' : ''}`}
              onClick={() => onSolve('inverse')}
              disabled={!isSquare}
              title={
                !isSquare
                  ? 'La matriz inversa requiere que la matriz sea cuadrada (m = n)'
                  : 'Calcular por Matriz Inversa X = A⁻¹·B'
              }
            >
              <RefreshCw size={17} />
              <div className="pill-text-col">
                <span className="pill-title">Matriz Inversa</span>
                <span className="pill-sub">{isSquare ? 'X = A⁻¹ · B' : '(Solo cuadradas)'}</span>
              </div>
            </button>

            <button
              type="button"
              className={`direct-calc-pill btn-cramer ${activeMethod === 'cramer' ? 'active' : ''} ${!isSquare ? 'disabled' : ''}`}
              onClick={() => onSolve('cramer')}
              disabled={!isSquare}
              title={
                !isSquare
                  ? 'La Regla de Cramer requiere que la matriz sea cuadrada (m = n)'
                  : 'Calcular por Regla de Cramer'
              }
            >
              <Divide size={17} />
              <div className="pill-text-col">
                <span className="pill-title">Regla de Cramer</span>
                <span className="pill-sub">{isSquare ? 'xᵢ = Δᵢ / Δ' : '(Solo cuadradas)'}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="matrix-footer-actions">
        <div className="input-tip">
          💡 Puedes pulsar el gran botón <strong>CALCULAR MATRIZ</strong> o presionar <strong>Enter</strong> en el último campo para resolver.
        </div>

        <div className="action-buttons-group">
          <button
            type="button"
            className="secondary-btn"
            onClick={copyAsText}
            title="Copiar matriz al portapapeles"
          >
            {copied ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={onRandom}
            title="Generar coeficientes aleatorios enteros"
          >
            <Shuffle size={15} />
            <span>Aleatorio</span>
          </button>
          <button
            type="button"
            className="secondary-btn danger-hover"
            onClick={onClear}
            title="Limpiar todas las celdas"
          >
            <Trash2 size={15} />
            <span>Limpiar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
