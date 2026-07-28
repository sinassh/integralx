// --- 1. Math Engine (Encapsulates Math.js logic) ---
class CalculusEngine {
    constructor() {
        this.parser = math.parser();
    }

    // Evaluate function f(x) at x
    evaluate(funcStr, x) {
        try {
            return math.evaluate(funcStr, { x: x });
        } catch (e) {
            return NaN;
        }
    }

    // Symbolic Derivative
    differentiate(funcStr) {
        try {
            const node = math.parse(funcStr);
            const derivative = math.derivative(node, 'x');
            return derivative.toString();
        } catch (e) {
            return "Error";
        }
    }

    // Symbolic Derivative to LaTeX
    differentiateLaTeX(funcStr) {
        try {
            const node = math.parse(funcStr);
            const derivative = math.derivative(node, 'x');
            return derivative.toTex();
        } catch (e) {
            return "";
        }
    }

    // Generate points for plotting
    generatePoints(funcStr, start, end, steps) {
        let xVals = [];
        let yVals = [];
        const step = (end - start) / steps;
        for (let x = start; x <= end; x += step) {
            xVals.push(x);
            yVals.push(this.evaluate(funcStr, x));
        }
        return { x: xVals, y: yVals };
    }
}

// --- 2. Visualization Engine (Encapsulates Plotly) ---
class Visualizer {
    constructor() {}

    plotComplex(real, imag, containerId) {
        const r = Math.sqrt(real*real + imag*imag);
        const theta = Math.atan2(imag, real);
        
        const traceVector = {
            x: [0, real],
            y: [0, imag],
            mode: 'lines+markers',
            name: 'Vector z',
            line: {color: '#3498db', width: 3},
            marker: {size: 8}
        };

        const layout = {
            title: 'Complex Plane (Argand Diagram)',
            xaxis: {title: 'Real Axis (Re)', range: [-10, 10], zeroline: true},
            yaxis: {title: 'Imaginary Axis (Im)', range: [-10, 10], zeroline: true},
            showlegend: false,
            margin: {t: 40, l: 40, r: 20, b: 40}
        };

        Plotly.newPlot(containerId, [traceVector], layout, {displayModeBar: false});
    }

    plotPolar(funcStr, containerId) {
        // Evaluate r = f(theta)
        const theta = [];
        const r = [];
        for (let t = 0; t <= 2 * Math.PI; t += 0.05) {
            theta.push(t * 180 / Math.PI); // Plotly uses degrees
            try {
                // we evaluate "funcStr" replacing 'theta' with the number
                let rVal = math.evaluate(funcStr, { theta: t });
                r.push(rVal);
            } catch(e) { r.push(0); }
        }

        const trace = {
            r: r,
            theta: theta,
            mode: 'lines',
            line: {color: '#e74c3c'},
            type: 'scatterpolar'
        };

        const layout = {
            polar: {
                radialaxis: {visible: true, range: [-5, 5]},
                angularaxis: {direction: "counterclockwise"}
            },
            showlegend: false,
            margin: {t: 20, b: 20}
        };

        Plotly.newPlot(containerId, [trace], layout, {displayModeBar: false});
    }

    plotFunctionWithLimit(funcStr, targetX, containerId) {
        const data = new CalculusEngine().generatePoints(funcStr, targetX - 5, targetX + 5, 200);
        const targetY = math.evaluate(funcStr, {x: targetX});

        const traceLine = {
            x: data.x, y: data.y, type: 'scatter', mode: 'lines', name: 'f(x)',
            line: {color: '#2c3e50'}
        };
        
        // Point approaching
        const tracePoint = {
            x: [targetX], y: [targetY], mode: 'markers', name: 'Limit',
            marker: {size: 10, color: '#e74c3c'}
        };

        const layout = {
            title: `Behavior near x = ${targetX}`,
            xaxis: {title: 'x'}, yaxis: {title: 'f(x)'},
            margin: {t: 40, l: 40, r: 20, b: 40}
        };

        Plotly.newPlot(containerId, [traceLine, tracePoint], layout, {displayModeBar: false});
    }

    plotDerivative(funcStr, derivStr, xVal, containerId) {
        const eng = new CalculusEngine();
        const range = 5;
        const dataF = eng.generatePoints(funcStr, xVal - range, xVal + range, 100);
        
        // Calculate tangent line: y = f'(a)(x-a) + f(a)
        const slope = eng.evaluate(derivStr, xVal);
        const yVal = eng.evaluate(funcStr, xVal);
        
        // Tangent line points
        const tanX = [xVal - 2, xVal + 2];
        const tanY = tanX.map(x => slope * (x - xVal) + yVal);

        const traceFunc = { x: dataF.x, y: dataF.y, name: 'f(x)' };
        const traceTan = { 
            x: tanX, y: tanY, name: 'Tangent', 
            line: {dash: 'dot', color: '#27ae60'} 
        };
        const tracePoint = {
            x: [xVal], y: [yVal], mode: 'markers', name: 'Point',
            marker: {size: 8, color: '#27ae60'}
        };

        Plotly.newPlot(containerId, [traceFunc, traceTan, tracePoint], {
            title: `Tangent Slope m = ${slope.toFixed(3)}`,
            xaxis: {range: [xVal-5, xVal+5]},
            yaxis: {range: [yVal-10, yVal+10]},
            margin: {t: 40, l: 40}
        }, {displayModeBar: false});
    }

    plotIntegral(funcStr, a, b, containerId) {
        const eng = new CalculusEngine();
        const fullData = eng.generatePoints(funcStr, a - 1, b + 1, 100);
        
        // Generate Area Fill
        const areaData = eng.generatePoints(funcStr, a, b, 50);
        
        const traceLine = { x: fullData.x, y: fullData.y, name: 'f(x)' };
        const traceArea = {
            x: areaData.x, y: areaData.y, fill: 'tozeroy', 
            mode: 'none', name: 'Area',
            fillcolor: 'rgba(52, 152, 219, 0.3)'
        };

        Plotly.newPlot(containerId, [traceArea, traceLine], {
            title: `Area from ${a} to ${b}`,
            margin: {t: 40, l: 40}
        }, {displayModeBar: false});
    }
}

// --- 3. Main App Controller ---
class App {
    constructor() {
        this.mathEngine = new CalculusEngine();
        this.visualizer = new Visualizer();
        this.initEventListeners();
        
        // Initial Render
        this.updateComplex();
    }

    initEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.switchTab(e.target));
        });

        // Complex Inputs
        ['complex-real', 'complex-imag'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => this.updateComplex());
        });

        // Polar Input
        document.getElementById('polar-func').addEventListener('change', () => this.updatePolar());

        // Limit Inputs
        ['limit-func', 'limit-target'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.updateLimits());
        });

        // Derivative Inputs
        document.getElementById('deriv-func').addEventListener('change', () => this.updateDerivatives());
        document.getElementById('deriv-x').addEventListener('input', (e) => {
            document.getElementById('deriv-x-val').innerText = e.target.value;
            this.updateDerivatives();
        });

        // Integral Inputs
        ['int-func', 'int-a', 'int-b'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.updateIntegrals());
        });
    }

    switchTab(target) {
        // UI Toggle
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        target.classList.add('active');
        
        document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
        const tabId = target.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');

        // Refresh Specific Views
        if(tabId === 'complex') this.updateComplex();
        if(tabId === 'polar') this.updatePolar();
        if(tabId === 'limits') this.updateLimits();
        if(tabId === 'derivatives') this.updateDerivatives();
        if(tabId === 'integrals') this.updateIntegrals();
    }

    // --- Module Logic ---

    updateComplex() {
        const a = parseFloat(document.getElementById('complex-real').value) || 0;
        const b = parseFloat(document.getElementById('complex-imag').value) || 0;
        
        // Calculations
        const r = Math.sqrt(a*a + b*b).toFixed(2);
        const theta = Math.atan2(b, a).toFixed(2);
        
        // LaTeX Output
        const latex = `
            \\text{Cartesian: } z = ${a} + ${b}i \\\\
            \\text{Modulus: } |z| = r = \\sqrt{${a}^2 + ${b}^2} = ${r} \\\\
            \\text{Argument: } \\theta = \\arctan(\\frac{${b}}{${a}}) \\approx ${theta} \\text{ rad} \\\\
            \\text{Polar: } z = ${r}(\\cos(${theta}) + i\\sin(${theta})) \\\\
            \\text{Euler: } z = ${r}e^{${theta}i}
        `;
        
        katex.render(latex, document.getElementById('complex-output'));
        this.visualizer.plotComplex(a, b, 'complex-plot');
    }

    updatePolar() {
        const funcStr = document.getElementById('polar-func').value;
        this.visualizer.plotPolar(funcStr, 'polar-plot');
        
        katex.render(`r(\\theta) = ${funcStr}`, document.getElementById('polar-output'));
    }

    updateLimits() {
        const funcStr = document.getElementById('limit-func').value;
        const target = parseFloat(document.getElementById('limit-target').value);
        
        // Table generation (Left and Right approach)
        const tableBody = document.querySelector('#limit-table tbody');
        tableBody.innerHTML = '';
        
        const offsets = [-0.1, -0.01, -0.001, 0.001, 0.01, 0.1];
        offsets.forEach(h => {
            const x = target + h;
            const y = this.mathEngine.evaluate(funcStr, x);
            const row = `<tr><td>${x.toFixed(4)}</td><td>${y.toFixed(4)}</td></tr>`;
            tableBody.insertAdjacentHTML('beforeend', row);
        });

        // Conclusion
        try {
            const limitVal = math.evaluate(funcStr, {x: target}); // Simple sub for now
            katex.render(`\\lim_{x \\to ${target}} f(x) \\approx ${limitVal ? limitVal.toFixed(4) : 'undefined'}`, document.getElementById('limit-result'));
        } catch(e) {
            document.getElementById('limit-result').innerText = "Indeterminate or Undefined";
        }

        this.visualizer.plotFunctionWithLimit(funcStr, target, 'limit-plot');
    }

    updateDerivatives() {
        const funcStr = document.getElementById('deriv-func').value;
        const xVal = parseFloat(document.getElementById('deriv-x').value);
        
        const derivStr = this.mathEngine.differentiate(funcStr);
        const derivLatex = this.mathEngine.differentiateLaTeX(funcStr);
        const slope = this.mathEngine.evaluate(derivStr, xVal);

        const explanation = `
            \\text{Function: } f(x) = ${funcStr} \\\\
            \\text{Derivative Rule: } f'(x) = ${derivLatex} \\\\
            \\text{Slope at } x=${xVal}: f'(${xVal}) = ${slope.toFixed(4)}
        `;
        
        katex.render(explanation, document.getElementById('deriv-output'));
        this.visualizer.plotDerivative(funcStr, derivStr, xVal, 'deriv-plot');
    }

    updateIntegrals() {
        const funcStr = document.getElementById('int-func').value;
        const a = parseFloat(document.getElementById('int-a').value);
        const b = parseFloat(document.getElementById('int-b').value);

        // Numerical Integration (Simpson's Rule or Riemann approximation)
        // Since math.js integral support is limited, we simulate simple sum
        let sum = 0;
        const n = 1000;
        const dx = (b - a) / n;
        for(let i=0; i<n; i++) {
            const x = a + i*dx;
            sum += this.mathEngine.evaluate(funcStr, x) * dx;
        }

        const explanation = `
            \\text{Integral: } \\int_{${a}}^{${b}} (${funcStr}) \\, dx \\\\
            \\text{Geometric Meaning: Signed Area under curve} \\\\
            \\text{Numerical Approximation: } \\approx ${sum.toFixed(4)}
        `;

        katex.render(explanation, document.getElementById('int-output'));
        this.visualizer.plotIntegral(funcStr, a, b, 'int-plot');
    }
}

// Initialize
window.onload = () => new App();
