import React from 'react';
import { X, Check } from 'lucide-react';
import MathView from './MathView';

export default function ExamplesModal({ isOpen, onClose, onSelectExample }) {
  if (!isOpen) return null;

  const examples = [
    {
      id: 'ex-3x2-user',
      title: 'Sistema 3×2 (3 Ecuaciones, 2 Incógnitas)',
      desc: 'Solución única entera: x = 3, y = -1 (solo variables x e y, sin z)',
      badge: '3×2 Rectangular',
      color: 'blue',
      A: [
        ['2', '3'],
        ['1', '-2'],
        ['3', '2']
      ],
      b: ['3', '5', '7'],
      systemTex: '\\begin{cases} 2x + 3y = 3 \\\\ x - 2y = 5 \\\\ 3x + 2y = 7 \\end{cases}'
    },
    {
      id: 'ex-3x3-clean',
      title: 'Sistema 3×3 Solución Entera',
      desc: 'Solución única entera: x = 2, y = -1, z = 3',
      badge: 'Solución Única',
      color: 'green',
      A: [
        ['2', '1', '-1'],
        ['-3', '-1', '2'],
        ['-2', '1', '2']
      ],
      b: ['0', '-11', '-3'],
      systemTex: '\\begin{cases} 2x + y - z = 0 \\\\ -3x - y + 2z = -11 \\\\ -2x + y + 2z = -3 \\end{cases}'
    },
    {
      id: 'ex-3x3-fractions',
      title: 'Sistema 3×3 con Fracciones',
      desc: 'Ideal para probar la precisión exacta de fracciones',
      badge: 'Fracciones',
      color: 'blue',
      A: [
        ['3', '2', '-1'],
        ['2', '-2', '4'],
        ['-1', '1/2', '-1']
      ],
      b: ['1', '-2', '0'],
      systemTex: '\\begin{cases} 3x + 2y - z = 1 \\\\ 2x - 2y + 4z = -2 \\\\ -x + \\frac{1}{2}y - z = 0 \\end{cases}'
    },
    {
      id: 'ex-2x2-simple',
      title: 'Sistema 2×2 Clásico',
      desc: 'Solución directa: x = 3, y = 2',
      badge: '2×2 Básico',
      color: 'indigo',
      A: [
        ['2', '3'],
        ['1', '-1']
      ],
      b: ['12', '1'],
      systemTex: '\\begin{cases} 2x + 3y = 12 \\\\ x - y = 1 \\end{cases}'
    },
    {
      id: 'ex-4x4-complete',
      title: 'Sistema 4×4 de 4 Incógnitas',
      desc: 'Sistema de orden 4 para probar eliminación extendida',
      badge: '4×4 Avanzado',
      color: 'purple',
      A: [
        ['1', '1', '1', '1'],
        ['2', '-1', '3', '0'],
        ['0', '2', '-1', '1'],
        ['3', '0', '1', '-2']
      ],
      b: ['4', '7', '1', '1'],
      systemTex: '\\begin{cases} x + y + z + w = 4 \\\\ 2x - y + 3z = 7 \\\\ 2y - z + w = 1 \\\\ 3x + z - 2w = 1 \\end{cases}'
    },
    {
      id: 'ex-incompatible',
      title: 'Sistema Incompatible (Sin Solución)',
      desc: 'Filas paralelas contradictorias que generan 0 = k (k ≠ 0)',
      badge: 'Sin Solución',
      color: 'red',
      A: [
        ['1', '2', '-1'],
        ['2', '4', '-2'],
        ['1', '-1', '3']
      ],
      b: ['3', '5', '4'],
      systemTex: '\\begin{cases} x + 2y - z = 3 \\\\ 2x + 4y - 2z = 5 \\\\ x - y + 3z = 4 \\end{cases}'
    },
    {
      id: 'ex-indeterminado',
      title: 'Sistema Compatible Indeterminado',
      desc: 'Rango menor que número de incógnitas (infinitas soluciones)',
      badge: 'Infinitas Sol.',
      color: 'amber',
      A: [
        ['1', '1', '1'],
        ['2', '2', '2'],
        ['1', '-1', '2']
      ],
      b: ['3', '6', '2'],
      systemTex: '\\begin{cases} x + y + z = 3 \\\\ 2x + 2y + 2z = 6 \\\\ x - y + 2z = 2 \\end{cases}'
    }
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Ejemplos y Casos de Estudio</h3>
            <p className="modal-subtitle">
              Haz clic en cualquiera de los siguientes sistemas para cargarlo en la calculadora:
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="examples-grid">
          {examples.map((ex) => (
            <div
              key={ex.id}
              className={`example-card border-${ex.color}`}
              onClick={() => {
                onSelectExample(ex.A, ex.b);
                onClose();
              }}
              role="button"
              tabIndex={0}
            >
              <div className="example-header">
                <span className={`example-badge badge-${ex.color}`}>{ex.badge}</span>
                <span className="example-dim">
                  {ex.A.length}×{ex.A[0].length}
                </span>
              </div>
              <h4 className="example-name">{ex.title}</h4>
              <p className="example-desc">{ex.desc}</p>
              <div className="example-math">
                <MathView block math={ex.systemTex} />
              </div>
              <button type="button" className="load-example-btn">
                <Check size={14} /> Cargar este sistema
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
