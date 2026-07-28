# ریاضی1

**Student:** [sina shiri ]  
**Course:** ریاضی1 (MATH 4041)  
**Submission Date:** [2/5/2026]

## 1. Project Overview
This application serves as an interactive demonstration of the core concepts of Calculus I. Rather than simply calculating answers, the software visualizes the relationship between algebraic definitions (formulas) and geometric interpretations (graphs).

## 2. Mathematical Coverage

### A. Complex Numbers & Polar Coordinates
* **Concept:** Demonstrates the bridge between Algebra and Geometry.
* **Implementation:** * Conversion between Cartesian ($a+bi$) and Polar ($re^{i\theta}$) forms.
    * Dynamic rendering of the Argand plane.
    * Visualization of Polar curves (e.g., cardioids, roses) to demonstrate periodicity.

### B. Limits & Continuity
* **Concept:** The foundational mechanism of Calculus.
* **Implementation:** * Numerical approach table (Left-hand vs Right-hand limits).
    * Visual demonstration of "hole" discontinuities vs continuous behavior.

### C. The Derivative
* **Concept:** Instantaneous Rate of Change.
* **Implementation:**
    * Symbolic differentiation engine.
    * Geometric visualization of the **Tangent Line**.
    * Interactive slider to observe how the slope changes along the curve $f(x)$.

### D. The Integral
* **Concept:** Accumulation and Area.
* **Implementation:**
    * Riemann Sum approximation logic.
    * Visualization of the Fundamental Theorem of Calculus by shading the area under $f(x)$ from $a$ to $b$.

## 3. Technical Implementation
* **Architecture:** Modular JavaScript Classes (`CalculusEngine` for logic, `Visualizer` for graphics).
* **Libraries:**
    * **Math.js:** For symbolic parsing and differentiation rules.
    * **Plotly.js:** For rendering vector fields and functions.
    * **KaTeX:** For academic-standard LaTeX equation rendering.

## 4. Conclusion
This project proves that the student has moved beyond rote memorization of algorithms and possesses the ability to synthesize mathematical theory into functional logical models.
