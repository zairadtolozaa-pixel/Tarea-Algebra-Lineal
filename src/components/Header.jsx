import React from 'react';
import { Calculator, Settings, Hash, Sparkles } from 'lucide-react';

export default function Header({
  varStyle,
  setVarStyle,
  numFormat,
  setNumFormat,
  decimalPlaces,
  setDecimalPlaces,
  onOpenExamples
}) {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="brand-section">
          <div className="brand-icon-wrapper">
            <Calculator className="brand-icon" size={28} />
          </div>
          <div className="brand-text">
            <div className="brand-title-row">
              <h1 className="brand-title">MatrixCalc</h1>
              <span className="brand-badge">SLU</span>
            </div>
            <p className="brand-subtitle">
              Sistemas de Ecuaciones Lineales con 4 Métodos Paso a Paso
            </p>
          </div>
        </div>

        <div className="header-controls">
          <div className="control-group">
            <span className="control-label">
              <Hash size={14} /> Variables:
            </span>
            <div className="toggle-btn-group">
              <button
                type="button"
                className={`toggle-btn ${varStyle === 'letters' ? 'active' : ''}`}
                onClick={() => setVarStyle('letters')}
                title="Usar letras: x, y, z..."
              >
                x, y, z
              </button>
              <button
                type="button"
                className={`toggle-btn ${varStyle === 'subscript' ? 'active' : ''}`}
                onClick={() => setVarStyle('subscript')}
                title="Usar subíndices: x₁, x₂, x₃..."
              >
                x₁, x₂, x₃
              </button>
            </div>
          </div>

          <div className="control-group">
            <span className="control-label">
              <Settings size={14} /> Formato:
            </span>
            <div className="toggle-btn-group">
              <button
                type="button"
                className={`toggle-btn ${numFormat === 'fraction' ? 'active' : ''}`}
                onClick={() => setNumFormat('fraction')}
                title="Mostrar fracciones exactas (a/b)"
              >
                Fracciones
              </button>
              <button
                type="button"
                className={`toggle-btn ${numFormat === 'decimal' ? 'active' : ''}`}
                onClick={() => setNumFormat('decimal')}
                title="Mostrar decimales redondeados"
              >
                Decimales
              </button>
            </div>

            {numFormat === 'decimal' && (
              <select
                className="decimal-select"
                value={decimalPlaces}
                onChange={(e) => setDecimalPlaces(Number(e.target.value))}
                title="Número de decimales"
              >
                <option value={2}>2 dec</option>
                <option value={3}>3 dec</option>
                <option value={4}>4 dec</option>
                <option value={6}>6 dec</option>
              </select>
            )}
          </div>

          <button
            type="button"
            className="examples-quick-btn"
            onClick={onOpenExamples}
            title="Cargar ejercicios y ejemplos típicos"
          >
            <Sparkles size={16} />
            <span>Ejemplos</span>
          </button>
        </div>
      </div>
    </header>
  );
}
