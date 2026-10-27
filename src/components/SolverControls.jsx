import React from 'react';
import { ArrowDownRight, Layers, RefreshCw, Divide } from 'lucide-react';
import MathView from './MathView';

export default function SolverControls({
  onSolve,
  activeMethod,
  isSquare,
  rows,
  cols,
  detMethod = 'sarrus',
  onDetMethodChange
}) {
  const methods = [
    {
      id: 'gauss',
      name: 'Eliminación Gaussiana',
      subtitle: 'Triangularización + Sustitución hacia atrás',
      icon: ArrowDownRight,
      color: 'blue',
      badge: 'Gauss'
    },
    {
      id: 'gaussJordan',
      name: 'Método de Gauss - Jordan',
      subtitle: 'Forma escalonada reducida (RREF)',
      icon: Layers,
      color: 'indigo',
      badge: 'Gauss-Jordan'
    },
    {
      id: 'inverse',
      name: 'Matriz Inversa',
      subtitle: 'X = A⁻¹ · B',
      mathSubtitle: 'X = A^{-1} \\cdot B',
      icon: RefreshCw,
      color: 'emerald',
      badge: 'A⁻¹ · B',
      requiresSquare: true
    },
    {
      id: 'cramer',
      name: 'Regla de Cramer',
      subtitle: 'xᵢ = Δᵢ / Δ',
      mathSubtitle: 'x_i = \\frac{\\Delta_i}{\\Delta}',
      icon: Divide,
      color: 'amber',
      badge: 'Cramer',
      requiresSquare: true
    }
  ];

  return (
    <div className="solver-section">
      <div className="solver-title-row">
        <h2 className="section-title">Elige el Método de Resolución:</h2>
        {!isSquare && (
          <span className="non-square-warning">
            ℹ️ Inversa y Cramer requieren matrices cuadradas (n = m). El sistema actual es {rows}×{cols}.
          </span>
        )}
      </div>

      <div className="solver-buttons-grid">
        {methods.map((method) => {
          const Icon = method.icon;
          const isActive = activeMethod === method.id;
          const isDisabled = method.requiresSquare && !isSquare;

          return (
            <button
              key={method.id}
              type="button"
              className={`solver-card-btn method-${method.color} ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
              onClick={() => onSolve(method.id)}
              disabled={isDisabled}
              title={
                isDisabled
                  ? 'Este método solo funciona para sistemas con el mismo número de ecuaciones que de incógnitas'
                  : `Resolver sistema usando ${method.name}`
              }
            >
              <div className="btn-glow-layer"></div>
              <div className="btn-content">
                <div className="btn-top">
                  <div className="method-icon-box">
                    <Icon size={20} />
                  </div>
                  <span className="method-badge">{method.badge}</span>
                </div>
                <div className="method-info">
                  <span className="method-name">{method.name}</span>
                  <span className="method-sub">
                    {method.mathSubtitle ? (
                      <MathView math={method.mathSubtitle} />
                    ) : (
                      method.subtitle
                    )}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Sub-selector for Determinant Method: Sarrus vs Cofactores */}
      {isSquare && (activeMethod === 'cramer' || activeMethod === 'inverse') && (
        <div className="det-method-selector-card">
          <span className="det-selector-title">
            Método para calcular los determinantes:
          </span>
          <div className="det-selector-pills">
            <button
              type="button"
              className={`det-pill ${detMethod === 'sarrus' ? 'active' : ''}`}
              onClick={() => onDetMethodChange?.('sarrus')}
              title="Calcular determinantes mediante la Regla de Sarrus (diagonales)"
            >
              <span className="det-pill-icon">📐</span>
              <span className="det-pill-name">Método de Sarrus</span>
            </button>
            <button
              type="button"
              className={`det-pill ${detMethod === 'cofactors' ? 'active' : ''}`}
              onClick={() => onDetMethodChange?.('cofactors')}
              title="Calcular determinantes mediante Expansión por Cofactores (Laplace)"
            >
              <span className="det-pill-icon">🔢</span>
              <span className="det-pill-name">Método de Cofactores</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
