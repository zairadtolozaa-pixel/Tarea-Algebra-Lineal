import React, { useState } from 'react';
import { parseSystemText } from '../math/matrixUtils';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function TextMatrixInput({ onApplyMatrix, currentA, currentB }) {
  // Generate default text representation of current matrix
  const initialText = currentA
    .map((row, i) => [...row, currentB[i] || '0'].join(' '))
    .join('\n');

  const [text, setText] = useState(initialText);
  const [error, setError] = useState(null);

  const handleApply = () => {
    setError(null);
    try {
      const parsed = parseSystemText(text);
      if (!parsed) {
        setError('No se pudieron detectar filas o ecuaciones válidas. Por favor verifique el formato.');
        return;
      }
      onApplyMatrix(parsed.A, parsed.b);
    } catch (err) {
      setError(err.message || 'Error al procesar el texto.');
    }
  };

  const handleLoadSampleEquations = () => {
    const sample = `2x + y - z = 8\n-3x - y + 2z = -11\n-2x + y + 2z = -3`;
    setText(sample);
  };

  const handleLoadSampleRaw = () => {
    const sample = `1 2 -1 4\n2 1 1 7\n1 -1 2 2`;
    setText(sample);
  };

  return (
    <div className="text-input-card">
      <div className="text-input-header">
        <p className="text-input-desc">
          Pega los coeficientes como números separados por espacios (última columna = término independiente) o como un sistema de ecuaciones algebraicas:
        </p>
        <div className="text-input-presets">
          <button type="button" className="text-preset-btn" onClick={handleLoadSampleEquations}>
            Ejemplo Ecuaciones (x, y, z)
          </button>
          <button type="button" className="text-preset-btn" onClick={handleLoadSampleRaw}>
            Ejemplo Matriz Numérica
          </button>
        </div>
      </div>

      <textarea
        className="text-input-area"
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ejemplo:&#10;2x + y - z = 8&#10;-3x - y + 2z = -11&#10;-2x + y + 2z = -3&#10;&#10;o números:&#10;2 1 -1 8&#10;-3 -1 2 -11&#10;-2 1 2 -3"
      />

      {error && (
        <div className="text-input-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="text-input-actions">
        <button type="button" className="apply-btn" onClick={handleApply}>
          <CheckCircle2 size={16} />
          <span>Insertar en la Matriz</span>
        </button>
      </div>
    </div>
  );
}
