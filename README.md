# Calculadora de Sistemas de Ecuaciones Lineales - Tarea de Álgebra Lineal

Aplicación web interactiva para la resolución paso a paso de sistemas de ecuaciones lineales (SEL) utilizando aritmética fraccionaria exacta. Inspirada en herramientas avanzadas de cálculo matricial como MatrixCalc.

## 🚀 Características
- **Métodos de resolución paso a paso:**
  - **Eliminación de Gauss:** Reducción a matriz triangular superior y sustitución regresiva detallada.
  - **Eliminación de Gauss-Jordan:** Reducción a forma escalonada reducida por filas (RREF).
  - **Matriz Inversa ($X = A^{-1} \cdot B$):** Cálculo de determinante, matriz de cofactores, adjunta e inversa.
  - **Regla de Cramer:** Determinante general del sistema y determinantes sustituidos para cada variable.
- **Visualización matemática enriquecida:** Fórmulas y matrices renderizadas con KaTeX.
- **Aritmética fraccionaria exacta:** Manejo de fracciones irreducibles para evitar pérdidas de precisión por redondeo.
- **Configuración flexible:**
  - Notación de variables: letras ($x, y, z, \dots$) o subíndices ($x_1, x_2, \dots$).
  - Formato numérico: Fracción exacta o decimal con número configurable de cifras decimales.
  - Dimensiones dinámicas: De $2 \times 2$ a $8 \times 8$.
- **Modos de entrada:** Ingreso por celdas individuales o edición en bloque de texto.
- **Banco de ejemplos:** Ejemplos predefinidos (solución única, infinitas soluciones, sin solución, etc.).

## 🛠️ Tecnologías
- [React 19](https://react.dev/)
- [Vite](https://vite.dev/)
- [KaTeX](https://katex.org/)
- [Lucide React](https://lucide.dev/)

## 📦 Instalación y Ejecución

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/zairadtolozaa-pixel/Tarea-Algebra-Lineal.git
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Iniciar el entorno de desarrollo:
   ```bash
   npm run dev
   ```
4. Construir para producción:
   ```bash
   npm run build
   ```

