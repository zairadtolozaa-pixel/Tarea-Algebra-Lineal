import React, { useState } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';
import MathView from './MathView';

export default function ResultsView({
  result,
  methodName,
  numFormat,
  decimalPlaces,
  varNames,
  onContextChange
}) {
  const [copied, setCopied] = useState(false);
  const [expandAll, setExpandAll] = useState(true);
  const [collapsedSteps, setCollapsedSteps] = useState({});

  if (!result) {
    return (
      <div className="empty-results-card">
        <div className="empty-icon-circle">💡</div>
        <h3 className="empty-title">Listo para calcular</h3>
        <p className="empty-desc">
          Introduce los coeficientes en la matriz superior y presiona cualquiera de los 4 métodos: <strong>Eliminación Gaussiana</strong>, <strong>Gauss-Jordan</strong>, <strong>Matriz Inversa</strong> o <strong>Regla de Cramer</strong>.
        </p>
      </div>
    );
  }

  const toggleStep = (index) => {
    setCollapsedSteps((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleToggleExpandAll = () => {
    const nextState = !expandAll;
    setExpandAll(nextState);
    if (nextState) {
      setCollapsedSteps({});
    } else {
      const all = {};
      (result.steps || []).forEach((_, i) => {
        all[i] = true;
      });
      setCollapsedSteps(all);
    }
  };

  const getStatusIcon = () => {
    switch (result.status) {
      case 'determinado':
        return <CheckCircle className="status-icon green" size={24} />;
      case 'indeterminado':
        return <AlertTriangle className="status-icon amber" size={24} />;
      case 'fraction_pause':
        return <AlertTriangle className="status-icon amber" size={24} />;
      case 'incompatible':
      case 'singular':
      case 'error':
        return <XCircle className="status-icon red" size={24} />;
      default:
        return null;
    }
  };

  const getStatusClass = () => {
    switch (result.status) {
      case 'determinado':
        return 'status-badge-determinado';
      case 'indeterminado':
        return 'status-badge-indeterminado';
      case 'fraction_pause':
        return 'status-badge-indeterminado';
      case 'incompatible':
      case 'singular':
      case 'error':
        return 'status-badge-incompatible';
      default:
        return 'status-badge-default';
    }
  };

  const copySolutionText = () => {
    if (!result.solution) return;
    const isDec = numFormat === 'decimal';
    const text = result.solution
      .map((s) => `${s.variable} = ${isDec ? s.decimal : s.tex}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDec = numFormat === 'decimal';

  return (
    <div className="results-container">
      {/* Result Summary Card */}
      <div className="result-summary-card">
        <div className="result-summary-header">
          <div className="status-header-left">
            {getStatusIcon()}
            <div>
              <span className={`status-pill ${getStatusClass()}`}>
                {result.statusText}
              </span>
              <h3 className="result-method-title">
                Resultado por {methodName}
              </h3>
            </div>
          </div>

          {result.solution && (
            <button
              type="button"
              className="copy-solution-btn"
              onClick={copySolutionText}
              title="Copiar vector solución"
            >
              {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
              <span>{copied ? 'Copiado!' : 'Copiar Solución'}</span>
            </button>
          )}
        </div>

        {/* Explanation / Summary text */}
        {result.summary && (
          <div className="result-explanation">
            <MathView math={result.summary} />
          </div>
        )}

        {/* Prompt Card when Fraction/Decimal was detected during resolution */}
        {result.status === 'fraction_pause' && (
          <div className="fraction-pause-card">
            <div className="fraction-pause-banner">
              <span className="fraction-pause-icon">⚠️</span>
              <div>
                <h4 className="fraction-pause-title">
                  Fracción detectada en el procedimiento
                </h4>
                <p className="fraction-pause-subtitle">
                  Para evitar mostrar fracciones o decimales y entregar exclusivamente números enteros / naturales, selecciona el flujo de aplicación:
                </p>
              </div>
            </div>

            <div className="fraction-pause-buttons">
              <button
                type="button"
                className="context-btn btn-traffic pause-choice-btn"
                onClick={() => onContextChange?.('vehicular')}
              >
                <span className="context-emoji">🚗</span>
                <div className="context-btn-text">
                  <strong>Flujo vehicular</strong>
                  <small>Continuar ajustando a enteros positivos de tránsito</small>
                </div>
              </button>

              <button
                type="button"
                className="context-btn btn-chemical pause-choice-btn"
                onClick={() => onContextChange?.('quimico')}
              >
                <span className="context-emoji">⚗️</span>
                <div className="context-btn-text">
                  <strong>Balance químico</strong>
                  <small>Continuar ajustando a coeficientes estequiométricos naturales</small>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Solution Box if Determinado */}
        {result.solution && (
          <div className="solution-values-card">
            <h4 className="solution-box-title">Vector Solución:</h4>
            <div className="solution-items-grid">
              {result.solution.map((item, idx) => (
                <div key={idx} className="solution-variable-card">
                  <div className="var-label">
                    <MathView math={item.variable} />
                  </div>
                  <div className="var-equals">=</div>
                  <div className="var-value">
                    <MathView
                      math={
                        isDec
                          ? item.fraction.toTex(true, decimalPlaces)
                          : item.fraction.toTex(false)
                      }
                    />
                  </div>
                  {item.fraction.d !== 1n && (
                    <div className="var-decimal-alt">
                      ≈ {item.fraction.toDecimalString(decimalPlaces)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="solution-vector-tex">
              <MathView
                block
                math={`\\vec{X} = \\begin{pmatrix} ${result.solution
                  .map((s) => s.variable)
                  .join(' \\\\ ')} \\end{pmatrix} = \\begin{pmatrix} ${result.solution
                  .map((s) =>
                    isDec
                      ? s.fraction.toTex(true, decimalPlaces)
                      : s.fraction.toTex(false)
                  )
                  .join(' \\\\ ')} \\end{pmatrix}`}
              />
            </div>
          </div>
        )}

        {/* Solution Box if Indeterminado (Particular solution in integers + Application context buttons) */}
        {result.status === 'indeterminado' && result.particularSolution && (
          <div className="particular-solution-card">
            <div className="particular-solution-header">
              <h4 className="solution-box-title">
                {result.context === 'vehicular'
                  ? '🚗 Solución Ajustada a Flujo Vehicular (Números Naturales > 0):'
                  : result.context === 'quimico'
                  ? '⚗️ Solución Ajustada a Balance Químico (Coeficientes Enteros Positivos):'
                  : 'Solución Particular (Enteros / Números Naturales):'}
              </h4>
              {result.freeVarNames && result.freeVarNames.length > 0 && (
                <span className="free-vars-badge">
                  Variables libres: {result.freeVarNames.join(', ')}
                </span>
              )}
            </div>

            <p className="particular-solution-desc">
              {result.context === 'vehicular'
                ? 'Para modelar el flujo de vehículos en intersecciones o calles, las cantidades deben ser valores enteros positivos. El algoritmo ajustó las variables libres para obtener un flujo físicamente consistente:'
                : result.context === 'quimico'
                ? 'En una reacción química, los coeficientes estequiométricos deben ser números naturales enteros mínimos (no fraccionarios ni negativos). Se escaló el sistema para balancear la ecuación:'
                : 'Al existir infinitas soluciones, se asignó un valor entero no fraccionario a las variables libres y se multiplicó por el m.c.m. de los denominadores para garantizar resultados en números enteros/naturales:'}
            </p>

            {/* Context selection buttons: Flujo vehicular / Balance químico */}
            <div className="context-selection-box">
              <span className="context-selection-label">
                🎯 Ajustar a contexto del problema:
              </span>
              <div className="context-buttons-row">
                <button
                  type="button"
                  className={`context-btn btn-traffic ${result.context === 'vehicular' ? 'active' : ''}`}
                  onClick={() => onContextChange?.('vehicular')}
                  title="Ajustar el sistema de infinitas soluciones al contexto de Flujo Vehicular (flujos enteros positivos)"
                >
                  <span className="context-emoji">🚗</span>
                  <div className="context-btn-text">
                    <strong>Flujo vehicular</strong>
                    <small>Tránsito y flujos en redes</small>
                  </div>
                </button>
                <button
                  type="button"
                  className={`context-btn btn-chemical ${result.context === 'quimico' ? 'active' : ''}`}
                  onClick={() => onContextChange?.('quimico')}
                  title="Ajustar el sistema de infinitas soluciones al contexto de Balance Químico (coeficientes estequiométricos enteros)"
                >
                  <span className="context-emoji">⚗️</span>
                  <div className="context-btn-text">
                    <strong>Balance químico</strong>
                    <small>Reacciones estequiométricas</small>
                  </div>
                </button>
                {result.context && (
                  <button
                    type="button"
                    className="context-btn btn-reset-context"
                    onClick={() => onContextChange?.(null)}
                    title="Restablecer a solución particular estándar"
                  >
                    <span>Restablecer estándar</span>
                  </button>
                )}
              </div>
            </div>

            <div className="solution-items-grid">
              {result.particularSolution.map((item, idx) => (
                <div key={idx} className="solution-variable-card">
                  <div className="var-label">
                    <MathView math={item.variable} />
                  </div>
                  <div className="var-equals">=</div>
                  <div className="var-value">
                    <MathView math={item.tex} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Integer scaling card for Inverse Matrix if fractions occurred */}
        {result.hasFractions && result.integerSolution && (
          <div className="inverse-integer-card">
            <div className="inv-int-header">
              <h4 className="solution-box-title">
                ✨ Solución escalada a Números Naturales / Enteros:
              </h4>
              <span className="lcm-badge">Factor común: × {result.solLcm}</span>
            </div>
            <p className="particular-solution-desc">
              Dado que la matriz inversa contiene fracciones, se multiplicó el sistema por el m.c.m. de los denominadores ({result.solLcm}) para expresar el vector solución en números enteros/naturales:
            </p>
            <div className="solution-items-grid">
              {result.integerSolution.map((item, idx) => (
                <div key={idx} className="solution-variable-card">
                  <div className="var-label">
                    <MathView math={item.variable} />
                  </div>
                  <div className="var-equals">=</div>
                  <div className="var-value">
                    <MathView math={item.tex} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Step by step section */}
      {result.steps && result.steps.length > 0 && (
        <div className="steps-accordion-container">
          <div className="steps-header-row">
            <h3 className="steps-main-title">
              Resolución Paso a Paso ({result.steps.length} pasos)
            </h3>
            <button
              type="button"
              className="toggle-all-steps-btn"
              onClick={handleToggleExpandAll}
            >
              {expandAll ? <EyeOff size={15} /> : <Eye size={15} />}
              <span>{expandAll ? 'Colapsar todo' : 'Expandir todo'}</span>
            </button>
          </div>

          <div className="steps-list">
            {result.steps.map((step, idx) => {
              const isCollapsed = collapsedSteps[idx] ?? !expandAll;

              return (
                <div
                  key={idx}
                  className={`step-card ${isCollapsed ? 'collapsed' : 'expanded'}`}
                >
                  <div
                    className="step-card-header"
                    onClick={() => toggleStep(idx)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="step-title-wrapper">
                      <span className="step-number-pill">{idx + 1}</span>
                      <span className="step-title-text">{step.title}</span>
                    </div>
                    <div className="step-header-actions">
                      {step.operation && (
                        <span className="step-op-badge">
                          <MathView math={step.operation} />
                        </span>
                      )}
                      <span className="chevron-toggle">
                        {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                      </span>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="step-card-body">
                      {step.description && (
                        <p className="step-description">{step.description}</p>
                      )}

                      {step.latex && (
                        <div className="step-math-block">
                          <MathView block math={step.latex} />
                        </div>
                      )}

                      {step.substeps && step.substeps.length > 0 && (
                        <div className="substeps-block">
                          <h5 className="substeps-title">
                            {step.substepsTitle || 'Detalles del procedimiento:'}
                          </h5>
                          {step.substeps.map((sub, sIdx) => (
                            <div key={sIdx} className="substep-item">
                              <span className="substep-title">{sub.title}</span>
                              <div className="substep-latex">
                                <MathView block math={sub.latex} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {step.multiplicationDetails && (
                        <div className="multiplication-details-block">
                          <h5 className="substeps-title">Desarrollo de cada incógnita:</h5>
                          {step.multiplicationDetails.map((det, dIdx) => (
                            <div key={dIdx} className="mult-detail-row">
                              <MathView block math={det.latex} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Backward substitution steps if Gauss */}
      {result.backSubstitutionSteps && result.backSubstitutionSteps.length > 0 && (
        <div className="back-substitution-container">
          <h4 className="back-substitution-title">
            Sustitución Regresiva (Despeje de incógnitas hacia atrás):
          </h4>
          <div className="back-sub-list">
            {result.backSubstitutionSteps.map((bs, bIdx) => (
              <div key={bIdx} className="back-sub-card">
                <span className="back-sub-var">
                  <MathView math={bs.variable} />
                </span>
                <div className="back-sub-math">
                  <MathView block math={bs.latex} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
