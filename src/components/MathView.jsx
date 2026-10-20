import React, { useMemo } from 'react';
import katex from 'katex';

export default function MathView({ math, block = false, className = '' }) {
  const html = useMemo(() => {
    if (!math) return '';
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
        strict: false
      });
    } catch (err) {
      console.error('KaTeX rendering error:', err);
      return `<span class="math-error">${math}</span>`;
    }
  }, [math, block]);

  return (
    <span
      className={`math-render ${block ? 'math-block' : 'math-inline'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
