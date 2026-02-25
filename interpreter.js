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
        if (!expr) throw new Error('Пустое выражение');

        try {
            let exprWithValues = expr.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (varName) => {
                if (variables.has(varName)) {
                    return variables.get(varName);
                }
                throw new Error(`Переменная "${varName}" не объявлена`);
            });

            return Function('"use strict"; return (' + exprWithValues + ')')();
        } catch (error) {
            throw new Error(`Ошибка в выражении: ${error.message}`);
        }
    }

    executeBlock(block, context = {}) {
        const variables = context.variables || this.variables;
        
        switch (block.type) {
            case 'variable':
                this.executeVariableDeclaration(block, variables);
                break;
            case 'assignment':
                this.executeAssignment(block, variables);
                break;
            case 'if':
                this.executeIf(block, variables);
                break;
        }
    }

    executeVariableDeclaration(block, variables) {
        const varNames = block.data.names.split(',').map(name => name.trim());
        varNames.forEach(name => {
            if (name) {
                variables.set(name, 0);
                this.output.push(`> Объявлена переменная: ${name} = 0`);
            }
        });
    }

    executeAssignment(block, variables) {
        const varName = block.data.variable;
        if (!variables.has(varName)) {
            throw new Error(`Переменная ${varName} не объявлена`);
        }
        const value = this.evaluateExpression(block.data.expression, variables);
        variables.set(varName, value);
        this.output.push(`> ${varName} = ${value}`);
    }

    executeIf(block, variables) {
        const leftValue = this.evaluateExpression(block.data.leftExpr, variables);
        const rightValue = this.evaluateExpression(block.data.rightExpr, variables);
        const operator = block.data.operator;

        let conditionResult = false;
        switch (operator) {
            case '>': conditionResult = leftValue > rightValue; break;
            case '<': conditionResult = leftValue < rightValue; break;
            case '==': conditionResult = leftValue == rightValue; break;
            case '!=': conditionResult = leftValue != rightValue; break;
            case '>=': conditionResult = leftValue >= rightValue; break;
            case '<=': conditionResult = leftValue <= rightValue; break;
        }

        this.output.push(`> Проверка условия: ${leftValue} ${operator} ${rightValue} = ${conditionResult}`);

        if (conditionResult && block.nestedBlocks) {
            block.nestedBlocks.forEach(nestedBlock => {
                this.executeBlock(nestedBlock, { variables });
            });
        }
    }
}