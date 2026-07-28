/**
 * Integral Calculator - Advanced Refactored Version
 * Architecture: Modules (MathEngine, GraphEngine, AppController)
 */

// 1. MATH ENGINE
const MathEngine = {
    compile(expr) {
        // Option A: Use math.js if loaded (Standard CAS Parsing)
        if (window.math) {
            try {
                const compiled = math.compile(expr);
                return (x) => compiled.evaluate({ x });
            } catch (e) {
                throw new Error("سینتکس تابع از نظر ریاضی نامعتبر است.");
            }
        }
        
        // Option B: Hardened Fallback (Guard Clauses instead of naive replaces)
        // Strictly block characters that are not math-related
        if (/[^x\d\s\+\-\*\/\^\(\)\.eptsincotaqrlg]/.test(expr.toLowerCase())) {
            throw new Error("کاراکترهای غیرمجاز در تابع شناسایی شد.");
        }
        
        const safeExpr = expr.toLowerCase()
            .replace(/\^/g, '**')
            .replace(/pi/g, 'Math.PI')
            .replace(/e/g, 'Math.E')
            .replace(/(sin|cos|tan|log|sqrt)/g, 'Math.$1');
            
        try {
            return new Function('x', `return ${safeExpr}`);
        } catch (e) {
            throw new Error("خطا در کامپایل تابع. سینتکس را بررسی کنید.");
        }
    },

    integrate(f, a, b, method, param) {
        if (a === b) return 0;
        const start = performance.now();
        let result = 0;

        try {
            switch(method) {
                case 'adaptive': result = this.adaptiveSimpson(f, a, b, 1e-6); break;
                case 'romberg': result = this.romberg(f, a, b, Math.min(10, param)); break;
                case 'simpson': result = this.simpson(f, a, b, param); break;
                default: result = this.trapezoidal(f, a, b, param);
            }
        } catch(e) {
            throw new Error("خطای محاسباتی. احتمالاً تابع در این بازه تعریف نشده یا مجانب قائم دارد.");
        }

        return {
            value: Number.isFinite(result) ? result : NaN,
            time: (performance.now() - start).toFixed(2)
        };
    },

    trapezoidal(f, a, b, n) {
        let h = (b - a) / n, sum = 0.5 * (f(a) + f(b));
        for (let i = 1; i < n; i++) sum += f(a + i * h);
        return sum * h;
    },

    simpson(f, a, b, n) {
        if (n % 2 !== 0) n++; // Guard: n must be even
        let h = (b - a) / n, sum = f(a) + f(b);
        for (let i = 1; i < n; i++) sum += f(a + i * h) * (i % 2 === 0 ? 2 : 4);
        return (h / 3) * sum;
    },

    romberg(f, a, b, maxSteps) {
        let R = Array.from({ length: maxSteps }, () => new Float64Array(maxSteps));
        R[0][0] = 0.5 * (b - a) * (f(a) + f(b));
        for (let i = 1; i < maxSteps; i++) {
            let h = (b - a) / Math.pow(2, i);
            let sum = 0;
            for (let k = 1; k <= Math.pow(2, i - 1); k++) sum += f(a + (2 * k - 1) * h);
            R[i][0] = 0.5 * R[i - 1][0] + sum * h;
            // Richardson Extrapolation
            for (let j = 1; j <= i; j++) {
                R[i][j] = R[i][j - 1] + (R[i][j - 1] - R[i - 1][j - 1]) / (Math.pow(4, j) - 1);
            }
            if (Math.abs(R[i][i] - R[i - 1][i - 1]) < 1e-8) return R[i][i]; // Early Return on precision
        }
        return R[maxSteps - 1][maxSteps - 1];
    },

    adaptiveSimpson(f, a, b, epsilon, maxDepth = 20) {
        const c = (a + b) / 2;
        const S = ((b - a) / 6) * (f(a) + 4 * f(c) + f(b));
        return this._recursiveAdaptive(f, a, b, epsilon, S, f(a), f(b), f(c), maxDepth);
    },

    _recursiveAdaptive(f, a, b, eps, S, fa, fb, fc, depth) {
        const c = (a + b) / 2;
        const fd = f((a + c) / 2), fe = f((c + b) / 2);
        const Sleft = ((c - a) / 6) * (fa + 4 * fd + fc);
        const Sright = ((b - c) / 6) * (fc + 4 * fe + fb);
        
        if (depth <= 0 || Math.abs(Sleft + Sright - S) <= 15 * eps) {
            return Sleft + Sright + (Sleft + Sright - S) / 15;
        }
        return this._recursiveAdaptive(f, a, c, eps / 2, Sleft, fa, fc, fd, depth - 1) + 
               this._recursiveAdaptive(f, c, b, eps / 2, Sright, fc, fb, fe, depth - 1);
    },

    explainSymbolicLimits() {
        return "برای حل دقیق $\\int f(x)dx$ نیاز به یک سیستم جبر کامپیوتری (CAS) پیشرفته مانند SymPy یا پیاده‌سازی کامل الگوریتم Risch است. در محیط مرورگر، ما به محاسبات عددی متکی هستیم.";
    }
};

// 2. GRAPH ENGINE
class GraphEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { alpha: false }); // Performance tweak
        this.f = null;
        this.bounds = null;
        this.scale = { x: 1, y: 1 };
        this.offset = { x: 0, y: 0 };
        this.isDragging = false;
        
        this._setupEvents();
        this.resize();
    }

    _setupEvents() {
        // Throttling resize to prevent Repaint storms
        window.addEventListener('resize', () => {
            clearTimeout(this._resizeTimer);
            this._resizeTimer = setTimeout(() => this.resize(), 100);
        });
        
        // Panning Logic
        this.canvas.addEventListener('mousedown', e => { this.isDragging = true; this.lastMouse = { x: e.offsetX, y: e.offsetY }; });
        window.addEventListener('mouseup', () => this.isDragging = false);
        window.addEventListener('mouseleave', () => this.isDragging = false);
        this.canvas.addEventListener('mousemove', e => {
            if (!this.isDragging || !this.f) return;
            this.offset.x += e.offsetX - this.lastMouse.x;
            this.offset.y += e.offsetY - this.lastMouse.y;
            this.lastMouse = { x: e.offsetX, y: e.offsetY };
            requestAnimationFrame(() => this.render());
        });

        // Zooming Logic
        this.canvas.addEventListener('wheel', e => {
            e.preventDefault();
            if (!this.f) return;
            const zoom = e.deltaY > 0 ? 0.85 : 1.15;
            this.scale.x *= zoom;
            this.scale.y *= zoom;
            requestAnimationFrame(() => this.render());
        }, { passive: false });
    }

    resize() {
        const parent = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1; // High DPI support
        this.width = parent.clientWidth;
        this.height = 450;
        
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
        
        if (this.f) this.render();
    }

    setFunction(f, a = null, b = null) {
        this.f = f;
        this.bounds = (a !== null && b !== null) ? { a, b } : null;
        this.resetView();
    }

    resetView() {
        this.scale = { x: this.width / 20, y: this.height / 20 }; // 20 units wide by default
        this.offset = { x: this.width / 2, y: this.height / 2 };
        if (this.bounds) {
            const cx = (this.bounds.a + this.bounds.b) / 2;
            this.offset.x = (this.width / 2) - (cx * this.scale.x);
        }
        this.render();
    }

    render() {
        if (!this.f) return;
        const { ctx, width, height, scale, offset, bounds } = this;
        
        // Colors from CSS Variables
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const colors = {
            bg: isDark ? '#1a1a24' : '#ffffff',
            axis: isDark ? '#444' : '#ccc',
            func: isDark ? '#8d6eeb' : '#573eed',
            fill: isDark ? 'rgba(141, 110, 235, 0.25)' : 'rgba(87, 62, 237, 0.2)'
        };

        // Clear Background (fastest way)
        ctx.fillStyle = colors.bg;
        ctx.fillRect(0, 0, width, height);

        // Axes
        ctx.strokeStyle = colors.axis;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, offset.y); ctx.lineTo(width, offset.y); // X
        ctx.moveTo(offset.x, 0); ctx.lineTo(offset.x, height); // Y
        ctx.stroke();

        // Optimized Path rendering
        const path = new Path2D();
        const fillPath = new Path2D();
        let hasFill = false;

        const pxToX = (px) => (px - offset.x) / scale.x;
        const yToPx = (y) => offset.y - y * scale.y;

        let firstPoint = true;
        for (let px = 0; px <= width; px += 2) {
            const x = pxToX(px);
            try {
                const y = this.f(x);
                if (!Number.isFinite(y)) { firstPoint = true; continue; }
                const py = yToPx(y);
                
                if (firstPoint) { path.moveTo(px, py); firstPoint = false; } 
                else { path.lineTo(px, py); }

                // Record Area Fill
                if (bounds && x >= bounds.a && x <= bounds.b) {
                    if (!hasFill) {
                        fillPath.moveTo(px, offset.y);
                        fillPath.lineTo(px, py);
                        hasFill = true;
                    }
                    fillPath.lineTo(px, py);
                }
            } catch(e) {}
        }

        // Draw Area Fill
        if (hasFill && bounds) {
            const endPx = offset.x + bounds.b * scale.x;
            fillPath.lineTo(endPx, yToPx(this.f(bounds.b)));
            fillPath.lineTo(endPx, offset.y);
            fillPath.closePath();
            ctx.fillStyle = colors.fill;
            ctx.fill(fillPath);
        }

        // Draw Function Line
        ctx.strokeStyle = colors.func;
        ctx.lineWidth = 2.5;
        ctx.stroke(path);
    }

    exportImage() {
        const link = document.createElement('a');
        link.download = `integral_graph_${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }
}

// 3. APP CONTROLLER
class App {
    constructor() {
        this.graph = new GraphEngine('graphCanvas');
        this.cacheDOM();
        this.bindEvents();
        this.loadPreferences();
    }

    cacheDOM() {
        this.dom = {
            input: document.getElementById('functionInput'),
            typeRadios: document.querySelectorAll('input[name="calcType"]'),
            defParams: document.getElementById('definiteParams'),
            lowerBound: document.getElementById('lowerBound'),
            upperBound: document.getElementById('upperBound'),
            method: document.getElementById('methodSelect'),
            precision: document.getElementById('precisionInput'),
            calcBtn: document.getElementById('calculateBtn'),
            clearBtn: document.getElementById('clearBtn'),
            errorBox: document.getElementById('errorMessage'),
            resultCard: document.getElementById('resultCard'),
            formulaOut: document.getElementById('formulaDisplay'),
            resultOut: document.getElementById('resultDisplay'),
            perfOut: document.getElementById('performanceDisplay'),
            themeBtn: document.getElementById('themeToggle')
        };
    }

    bindEvents() {
        this.dom.themeBtn.addEventListener('click', () => this.toggleTheme());
        this.dom.clearBtn.addEventListener('click', () => this.clear());
        this.dom.calcBtn.addEventListener('click', () => this.calculate());
        document.getElementById('resetZoomBtn').addEventListener('click', () => this.graph.resetView());
        document.getElementById('exportGraphBtn').addEventListener('click', () => this.graph.exportImage());
        
        this.dom.typeRadios.forEach(r => r.addEventListener('change', e => {
            this.dom.defParams.classList.toggle('hidden', e.target.value !== 'definite');
        }));

        document.addEventListener('keydown', e => {
            if (e.key === 'Enter' && document.activeElement !== this.dom.calcBtn) this.calculate();
        });
    }

    showError(msg) {
        this.dom.errorBox.textContent = msg;
        this.dom.errorBox.classList.remove('hidden');
        this.dom.resultCard.classList.add('hidden');
    }

    setLoading(isLoading) {
        this.dom.calcBtn.disabled = isLoading;
        this.dom.calcBtn.textContent = isLoading ? 'در حال پردازش...' : 'محاسبه و رسم';
    }

    calculate() {
        this.dom.errorBox.classList.add('hidden');
        const funcStr = this.dom.input.value.trim();
        if (!funcStr) return this.showError('حداقل یک تابع برای محاسبه بنویسید.');

        const isDefinite = document.querySelector('input[name="calcType"]:checked').value === 'definite';
        this.setLoading(true);
        
        // setTimeout ensures UI rendering thread is freed to show Loading state
        setTimeout(() => {
            try {
                const f = MathEngine.compile(funcStr);
                localStorage.setItem('lastFunc', funcStr);
                
                if (isDefinite) {
                    const a = parseFloat(this.dom.lowerBound.value);
                    const b = parseFloat(this.dom.upperBound.value);
                    const method = this.dom.method.value;
                    const steps = parseInt(this.dom.precision.value);

                    if (isNaN(a) || isNaN(b)) throw new Error('کران‌ها باید عدد باشند.');
                    if (a >= b) throw new Error('کران پایین $(a)$ باید کوچکتر از کران بالا $(b)$ باشد.');

                    const res = MathEngine.integrate(f, a, b, method, steps);
                    if (isNaN(res.value)) throw new Error('نتیجه $(NaN)$ نامعتبر است.');

                    this.renderResult(`∫ ${funcStr} dx`, res.value.toPrecision(8), `بازه [${a}, ${b}] | زمان: ${res.time}ms`);
                    this.graph.setFunction(f, a, b);
                } else {
                    this.renderResult(`∫ ${funcStr} dx`, 'نمادین ⚠️', MathEngine.explainSymbolicLimits());
                    this.graph.setFunction(f, null, null);
                }
            } catch (err) {
                this.showError(err.message);
            } finally {
                this.setLoading(false);
            }
        }, 15);
    }

    renderResult(formula, value, meta) {
        this.dom.formulaOut.textContent = formula;
        this.dom.resultOut.textContent = value;
        this.dom.perfOut.textContent = meta;
        this.dom.resultCard.classList.remove('hidden');
    }

    clear() {
        this.dom.input.value = '';
        this.dom.errorBox.classList.add('hidden');
        this.dom.resultCard.classList.add('hidden');
        this.graph.setFunction(null);
        this.graph.render();
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        this.graph.render(); // Repaint canvas instantly without recalculating integration
    }

    loadPreferences() {
        const theme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
        const lastFunc = localStorage.getItem('lastFunc');
        if (lastFunc) this.dom.input.value = lastFunc;
    }
}

document.addEventListener('DOMContentLoaded', () => window.app = new App());
