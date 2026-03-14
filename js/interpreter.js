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
        expr = expr.trim();
        if (!expr) return 0;

        try {
            let exprWithValues = expr.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (varName) => {
                if (variables.has(varName)) {
                    return variables.get(varName);
                }
                return varName;
            });

            return Function('"use strict"; return (' + exprWithValues + ')')();
        } catch (error) {
            throw new Error(`Ошибка в выражении: ${error.message}`);
        }
    }

    evaluateCondition(condition, variables) {
        condition = condition.trim();
        
        const operators = ['<=', '>=', '==', '!=', '<', '>'];
        
        for (let op of operators) {
            if (condition.includes(op)) {
                const parts = condition.split(op).map(s => s.trim());
                if (parts.length === 2) {
                    const left = this.evaluateExpression(parts[0], variables);
                    const right = this.evaluateExpression(parts[1], variables);
                    
                    switch(op) {
                        case '<': return left < right;
                        case '>': return left > right;
                        case '<=': return left <= right;
                        case '>=': return left >= right;
                        case '==': return left == right;
                        case '!=': return left != right;
                    }
                }
            }
        }
        
        return this.evaluateExpression(condition, variables);
    }

    executeBlock(block) {
        switch (block.type) {
            case 'variable':
                this.executeVariable(block);
                break;
            case 'assignment':
                this.executeAssignment(block);
                break;
            case 'if':
                this.executeIf(block);
                break;
            case 'ifelse':
                this.executeIfElse(block);
                break;
            case 'arithmetic':
                this.executeArithmetic(block);
                break;
        }
    }

    executeVariable(block) {
        const names = block.data.names.split(',').map(s => s.trim());
        names.forEach(name => {
            if (name) {
                this.variables.set(name, 0);
                this.output.push(`> Объявлена переменная: ${name} = 0`);
            }
        });
    }

    executeAssignment(block) {
        const varName = block.data.variable;
        if (!this.variables.has(varName)) {
            throw new Error(`Переменная ${varName} не объявлена`);
        }
        const value = this.evaluateExpression(block.data.expression, this.variables);
        this.variables.set(varName, value);
        this.output.push(`> ${varName} = ${value}`);
    }

    executeIf(block) {
        const condition = block.data.condition;
        if (!condition) return;
        
        const result = this.evaluateCondition(condition, this.variables);
        this.output.push(`> Проверка условия: ${condition} = ${result}`);

        if (result && block.nestedBlocks.then && block.nestedBlocks.then.length > 0) {
            this.output.push(`> Условие истинно, выполняем блок THEN:`);
            block.nestedBlocks.then.forEach(nestedBlock => {
                this.executeBlock(nestedBlock);
            });
        } else if (!result) {
            this.output.push(`> Условие ложно, пропускаем`);
        }
    }

    executeIfElse(block) {
        const condition = block.data.condition;
        if (!condition) return;
        
        const result = this.evaluateCondition(condition, this.variables);
        this.output.push(`> Проверка условия: ${condition} = ${result}`);

        if (result) {
            if (block.nestedBlocks.then && block.nestedBlocks.then.length > 0) {
                this.output.push(`> Условие истинно, выполняем блок THEN:`);
                block.nestedBlocks.then.forEach(nestedBlock => {
                    this.executeBlock(nestedBlock);
                });
            } else {
                this.output.push(`> Условие истинно, но блок THEN пуст`);
            }
        } else {
            if (block.nestedBlocks.else && block.nestedBlocks.else.length > 0) {
                this.output.push(`> Условие ложно, выполняем блок ELSE:`);
                block.nestedBlocks.else.forEach(nestedBlock => {
                    this.executeBlock(nestedBlock);
                });
            } else {
                this.output.push(`> Условие ложно, но блок ELSE пуст`);
            }
        }
    }

    executeArithmetic(block) {
        const expression = block.data.expression;
        if (!expression) return;
        
        const parts = expression.split('=').map(s => s.trim());
        if (parts.length !== 2) return;
        
        const varName = parts[0];
        const expr = parts[1];
        
        if (!this.variables.has(varName)) {
            throw new Error(`Переменная ${varName} не объявлена`);
        }
        
        const result = this.evaluateExpression(expr, this.variables);
        this.variables.set(varName, result);
        this.output.push(`> ${varName} = ${expr} = ${result}`);
    }
}
