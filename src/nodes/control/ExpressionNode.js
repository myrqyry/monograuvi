import BaseControlNode from './BaseControlNode.js';

class ExpressionNode extends BaseControlNode {
    constructor(options = {}) {
        super('Control Expression', { size: [200, 160], ...options });

        this.setupExpression();
    }

    setupExpression() {
        this.addInput('A', 'number', { description: 'Input A' });
        this.addInput('B', 'number', { description: 'Input B' });
        this.addInput('C', 'number', { description: 'Input C' });
        this.addInput('D', 'number', { description: 'Input D' });
        this.addOutput('Result', 'number', { description: 'Expression result' });

        this.addProperty('expression', 'A * B + C', {
            type: 'string',
            description: 'Mathematical expression',
            category: 'Expression'
        });
        this.addProperty('clampMin', -100, {
            min: -100, max: 100, step: 0.1,
            description: 'Minimum output value',
            category: 'Output'
        });
        this.addProperty('clampMax', 100, {
            min: -100, max: 100, step: 0.1,
            description: 'Maximum output value',
            category: 'Output'
        });
        this.addProperty('time', false, {
            type: 'boolean',
            description: 'Include time variable (t)',
            category: 'Variables'
        });
    }

    async onProcess(inputs) {
        return this.processExpression(inputs);
    }

    processExpression(inputs) {
        const A = inputs.A || 0;
        const B = inputs.B || 0;
        const C = inputs.C || 0;
        const D = inputs.D || 0;
        const t = this.getProperty('time') ? performance.now() / 1000 : 0;

        try {
            const expression = this.getProperty('expression');
            const clampMin = this.getProperty('clampMin');
            const clampMax = this.getProperty('clampMax');

            // Use a safer evaluation method
            let result = this.safeEvaluateExpression(expression, { A, B, C, D, t });

            // Apply clamping
            if (clampMin !== -Infinity) result = Math.max(result, clampMin);
            if (clampMax !== Infinity) result = Math.min(result, clampMax);

            return { Result: result };
        } catch (error) {
            console.error("Expression evaluation error:", error);
            return { Result: 0 };
        }
    }

    safeEvaluateExpression(expression, variables) {
        // Define allowed functions and constants
        const allowedMath = ['sin', 'cos', 'tan', 'abs', 'floor', 'ceil', 'round', 'PI', 'min', 'max', 'pow', 'sqrt', 'log', 'exp'];

        // Build a regex for allowed function calls and constants
        const mathFunctionRegex = new RegExp(`\\b(?:${allowedMath.join('|')})\\b`, 'g');

        // Sanitize the expression to only allow numbers, basic operators, variables, and Math functions/constants
        // This regex ensures no arbitrary code can be injected.
        // It allows: numbers, +, -, *, /, %, (, ), variables A, B, C, D, t, and whitelisted Math. functions/constants.
        const sanitizedExpression = expression.replace(/[^-()\d/*+%.\sABCDEt]/g, function(match){
            if (!match.match(mathFunctionRegex)) {
                throw new Error(`Disallowed character or function found in expression: "${match}"`);
            }
            return match;
        });

        // Replace variable names with their values
        let evalString = sanitizedExpression;
        for (const key in variables) {
            evalString = evalString.replace(new RegExp(`\\b${key}\\b`, 'g'), `(${variables[key]})`);
        }

        // Add Math. prefix to allowed Math functions and constants
        // This is done after variable replacement to avoid accidentally matching variable names with Math functions
        evalString = evalString.replace(mathFunctionRegex, 'Math.$&');

        // Evaluate the sanitized string
        // Using eval is generally unsafe, but after strict sanitization, it's safer.
        // For production-grade security, consider a dedicated expression parser library.
        try {
            // eslint-disable-next-line no-eval
            return eval(evalString);
        } catch (e) {
            throw new Error(`Failed to evaluate expression: ${expression}. Error: ${e.message}`);
        }
    }
}

export default ExpressionNode;
