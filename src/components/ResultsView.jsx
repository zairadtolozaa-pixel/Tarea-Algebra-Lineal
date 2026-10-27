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
  activeMethod,
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
  const isGaussMethod = activeMethod === 'gauss' || activeMethod === 'gaussJordan';

  const renderContextBox = (isBottom = false) => {
    if (!isGaussMethod) return null;

    return (
      <div className={`context-selection-box ${isBottom ? 'bottom-context-box' : 'post-solution-context-box'}`}>
        <div className="context-selection-header-row">
          <span className="context-selection-label">
            🎯 Opciones adicionales del problema:
          </span>
          {result.context && (
            <span className="current-context-tag">
              Contexto activo: {result.context === 'vehicular' ? '🚗 Flujo vehicular' : '⚗️ Balance químico'}
            </span>
          )}
        </div>
        <p className="context-selection-help">
          {result.context === 'vehicular'
            ? 'Modelo de Flujo Vehicular: En redes de tránsito e intersecciones, cada incógnita representa el flujo de vehículos por unidad de tiempo. El sistema se escaló a enteros positivos para garantizar cantidades físicas coherentes (> 0).'
            : result.context === 'quimico'
            ? 'Modelo de Balance Químico: En reacciones químicas, los coeficientes estequiométricos representan la menor proporción entera de moléculas que conservan la materia.'
            : 'Tras completar la solución por este método, puedes seleccionar una de las siguientes opciones para iniciar el procedimiento matemático aplicado correspondiente:'}
        </p>
        <div className="context-buttons-row">
          <button
            type="button"
            className={`context-btn btn-traffic ${result.context === 'vehicular' ? 'active' : ''}`}
            onClick={() => onContextChange?.('vehicular')}
            title="Ajustar solución al contexto de Flujo Vehicular (números naturales/enteros positivos)"
          >
            <span className="context-emoji">🚗</span>
            <div className="context-btn-text">
              <strong>Flujo vehicular</strong>
              <small>Tránsito y flujos en redes (enteros &gt; 0)</small>
            </div>
          </button>
          <button
            type="button"
            className={`context-btn btn-chemical ${result.context === 'quimico' ? 'active' : ''}`}
            onClick={() => onContextChange?.('quimico')}
            title="Ajustar solución al contexto de Balance Químico (coeficientes estequiométricos naturales)"
          >
            <span className="context-emoji">⚗️</span>
            <div className="context-btn-text">
              <strong>Balance químico</strong>
              <small>Reacciones estequiométricas (enteros mínimos)</small>
            </div>
          </button>
          {result.context && (
            <button
              type="button"
              className="context-btn btn-reset-context"
              onClick={() => onContextChange?.(null)}
              title="Restablecer solución matemática original"
            >
              <span>Restablecer solución original</span>
            </button>
          )}
        </div>
      </div>
    );
  };

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
              <div className="solution-boxed-inline-summary">
                <MathView
                  block
                  math={`\\boxed{${result.solution
                    .map((s) => `${s.variable} = ${isDec ? s.fraction.toTex(true, decimalPlaces) : s.fraction.toTex(false)}`)
                    .join(', \\quad ')}}`}
                />
              </div>
            </div>

            {/* Context Application Banner if active */}
            {result.context === 'vehicular' && (
              <div className="applied-context-showcase vehicular-showcase">
                <div className="applied-header">
                  <span className="applied-badge">🚗 Procedimiento Matemático: Modelo de Flujo Vehicular en Red Vial</span>
                </div>
                <p className="applied-desc">
                  En ingeniería de tránsito y redes viales (calles e intersecciones), las incógnitas representan el caudal vehicular (vehículos/hora). Dado que los vehículos son unidades enteras indivisibles y respetan el sentido de circulación, se desarrolla el procedimiento físico y estequiométrico del modelo:
                </p>

                {/* Sub-pasos matemáticos del modelo vial */}
                <div className="applied-steps-flow">
                  <div className="applied-substep">
                    <div className="applied-substep-header">
                      <span className="substep-badge">Paso 1</span>
                      <strong>Principio de Conservación de Flujo en Intersecciones (Nodos)</strong>
                    </div>
                    <p className="substep-text">
                      En cada intersección vial, el volumen total de vehículos que ingresa debe ser igual al volumen que sale (Ley de conservación de caudales):
                    </p>
                    <div className="substep-formula">
                      <MathView block math={`\\sum q_{\\text{entrante}} = \\sum q_{\\text{saliente}} \\implies A \\cdot \\vec{X} = \\vec{B}`} />
                    </div>
                  </div>

                  <div className="applied-substep">
                    <div className="applied-substep-header">
                      <span className="substep-badge">Paso 2</span>
                      <strong>Solución Matemática Inicial del Sistema</strong>
                    </div>
                    <p className="substep-text">
                      A partir de la eliminación del método seleccionado se obtuvo el vector numérico:
                    </p>
                    <div className="substep-formula">
                      <MathView block math={`\\vec{X} = \\begin{pmatrix} ${result.solution.map(s => `${s.variable} = ${s.fraction.toTex(false)}`).join(' \\\\ ')} \\end{pmatrix}`} />
                    </div>
                  </div>

                  {result.solution.some(s => s.fraction.isNegative()) && (
                    <div className="applied-substep highlight-step">
                      <div className="applied-substep-header">
                        <span className="substep-badge alert">Paso 3</span>
                        <strong>Análisis Físico de Signos y Sentido de Circulación</strong>
                      </div>
                      <p className="substep-text">
                        En ingeniería de tráfico, un caudal negativo indica que los vehículos circulan en <strong>sentido opuesto</strong> al sentido asignado arbitrariamente en la flecha de la calle. Para expresar la magnitud física real en sentido de avance, se toma el valor absoluto $|q_i|$:
                      </p>
                      <div className="substep-formula">
                        <MathView block math={`\\forall q_i < 0: \\quad q_{i,\\text{real}} = |q_i| \\implies \\text{Inversión de flecha en el tramo vial}`} />
                      </div>
                    </div>
                  )}

                  <div className="applied-substep">
                    <div className="applied-substep-header">
                      <span className="substep-badge">Paso {result.solution.some(s => s.fraction.isNegative()) ? '4' : '3'}</span>
                      <strong>Caudal Vehicular Físico Final (Enteros / Unidades Reales)</strong>
                    </div>
                    <p className="substep-text">
                      Cada tramo de la red queda determinado con su capacidad y flujo vehicular por hora:
                    </p>
                    <div className="applied-vars-grid">
                      {result.solution.map((item, idx) => (
                        <div key={idx} className="applied-var-card">
                          <span className="app-var-name"><MathView math={item.variable} /></span>
                          <span className="app-var-eq">=</span>
                          <span className="app-var-num">{item.fraction.abs().toTex(false)}</span>
                          <span className="app-var-unit">vehículos / hora</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result.context === 'quimico' && (
              <div className="applied-context-showcase chemical-showcase">
                <div className="applied-header">
                  <span className="applied-badge">⚗️ Procedimiento Matemático: Balance de Reacción Química (Estequiometría)</span>
                </div>
                <p className="applied-desc">
                  En química general, los coeficientes estequiométricos indican el número exacto de moléculas o moles que participan en la reacción. Deben cumplir la ley de conservación de la materia (Lavoisier) expresada en <strong>enteros naturales mínimos (&gt; 0)</strong>:
                </p>

                {/* Sub-pasos matemáticos del balance químico */}
                <div className="applied-steps-flow">
                  <div className="applied-substep">
                    <div className="applied-substep-header">
                      <span className="substep-badge">Paso 1</span>
                      <strong>Conservación Atómica de la Materia (Ley de Lavoisier)</strong>
                    </div>
                    <p className="substep-text">
                      El número total de átomos de cada elemento presente en los reactivos debe ser idéntico al presente en los productos:
                    </p>
                    <div className="substep-formula">
                      <MathView block math={`\\sum \\text{átomos}_{\\text{reactivos}} = \\sum \\text{átomos}_{\\text{productos}} \\implies \\sum a_i X_i = 0`} />
                    </div>
                  </div>

                  <div className="applied-substep">
                    <div className="applied-substep-header">
                      <span className="substep-badge">Paso 2</span>
                      <strong>Solución Matemática Inicial del Sistema</strong>
                    </div>
                    <p className="substep-text">
                      A partir de la resolución del sistema lineal se obtuvieron los valores de las incógnitas:
                    </p>
                    <div className="substep-formula">
                      <MathView block math={`\\vec{X} = \\begin{pmatrix} ${result.solution.map(s => `${s.variable} = ${s.fraction.toTex(false)}`).join(' \\\\ ')} \\end{pmatrix}`} />
                    </div>
                  </div>

                  <div className="applied-substep highlight-step">
                    <div className="applied-substep-header">
                      <span className="substep-badge">Paso 3</span>
                      <strong>Normalización Estequiométrica (Números Naturales &gt; 0)</strong>
                    </div>
                    <p className="substep-text">
                      Las moléculas no pueden existir en cantidades fraccionarias o negativas en una ecuación balanceada. Se toman los valores positivos mínimos enteros:
                    </p>
                    <div className="applied-vars-grid">
                      {result.solution.map((item, idx) => (
                        <div key={idx} className="applied-var-card">
                          <span className="app-var-name"><MathView math={item.variable} /></span>
                          <span className="app-var-eq">=</span>
                          <span className="app-var-num">{item.fraction.abs().toTex(false)}</span>
                          <span className="app-var-unit">moles / moléculas</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
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
            <div>
              <h3 className="steps-main-title">
                Resolución Paso a Paso ({result.steps.length} pasos)
              </h3>
              {result.context && (
                <span className="steps-context-indicator">
                  Incluye pasos específicos del modelo de {result.context === 'vehicular' ? '🚗 Flujo Vehicular' : '⚗️ Balance Químico'}
                </span>
              )}
            </div>
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

      {/* Opción de Flujo vehicular / Balance químico ABAJO de toda la resolución del método */}
      {(result.solution || result.particularSolution) && (
        <div className="bottom-context-section">
          {renderContextBox(true)}
        </div>
      )}
    </div>
  );
}
