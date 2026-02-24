class Interpreter {
    constructor() {
        this.variables = new Map();
        this.output = [];
    }

    reset() {
        this.variables.clear();
        this.output = [];
    }

    evaluateExpression(expr, variables) {
        try {
            let exprStr = expr.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (match) => {
                if (variables.has(match)) {
                    return variables.get(match);
                }
                throw new Error(`Переменная ${match} не объявлена`);
            });
            return Function('"use strict"; return (' + exprStr + ')')();
        } catch (error) {
            throw new Error(`Ошибка в выражении: ${error.message}`);
        }
    }
}