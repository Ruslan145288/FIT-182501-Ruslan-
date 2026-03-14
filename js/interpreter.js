class Interpreter {
    constructor() {
        this.variables = new Map();
        this.output = [];
    }

    reset() {
        this.variables.clear();
        this.output = [];
    }

    getVariableValue(name, variables) {
        const arrayAccess = name.match(/^([a-zA-Z_][a-zA-Z0-9_]*)(\[[^\]]+\])+$/);
        if (arrayAccess) {
            const arrayName = arrayAccess[1];
            const indices = [...name.matchAll(/\[([^\]]+)\]/g)].map(m => m[1]);
            
            if (!variables.has(arrayName)) {
                throw new Error(`Массив "${arrayName}" не объявлен`);
            }
            
            let value = variables.get(arrayName);
            for (let idx of indices) {
                const index = this.evaluateExpression(idx, variables);
                if (!Array.isArray(value)) {
                    throw new Error(`"${arrayName}" не является массивом`);
                }
                if (index < 0 || index >= value.length) {
                    throw new Error(`Индекс ${index} вне границ массива "${arrayName}"`);
                }
                value = value[index];
            }
            return value;
        }
        
        if (variables.has(name)) {
            return variables.get(name);
        }
        if (!isNaN(parseFloat(name))) {
            return parseFloat(name);
        }
        throw new Error(`Переменная "${name}" не объявлена`);
    }

    evaluateExpression(expr, variables) {
        expr = expr.trim();
        if (!expr) throw new Error('Пустое выражение');

        try {
            let exprWithValues = expr.replace(/[a-zA-Z_][a-zA-Z0-9_]*(\[[^\]]+\])*/g, (varName) => {
                return this.getVariableValue(varName, variables);
            });

            return Function('"use strict"; return (' + exprWithValues + ')')();
        } catch (error) {
            throw new Error(`Ошибка в выражении: ${error.message}`);
        }
    }

    evaluateLogical(left, right, operator) {
        switch(operator) {
            case '&&': return left && right;
            case '||': return left || right;
            case '!': return !left;
            default: throw new Error(`Неизвестный логический оператор: ${operator}`);
        }
    }

    executeArithmetic(block, variables) {
        const varName = block.data.varName;
    const expression = block.data.expression; 
    
    if (!variables.has(varName)) {
        throw new Error(`Переменная "${varName}" не объявлена`);
    }
    
    const result = this.evaluateExpression(expression, variables);
    variables.set(varName, result);
    this.output.push(`> ${varName} = ${expression} = ${result}`);
    
    return result;
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
            case 'while':
                this.executeWhile(block, variables);
                break;
            case 'array-decl':
                this.executeArrayDeclaration(block, variables);
                break;
            case 'array-assign':
                this.executeArrayAssignment(block, variables);
                break;
            case 'logical':
                return this.evaluateLogical(
                    this.evaluateExpression(block.data.leftExpr, variables),
                    this.evaluateExpression(block.data.rightExpr, variables),
                    block.data.logicalOp
                );
            case 'arithmetic': 
                return this.executeArithmetic(block, variables);
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
    let conditionResult;
    
    const leftValue = this.evaluateExpression(block.data.leftExpr, variables);
    const rightValue = this.evaluateExpression(block.data.rightExpr, variables);
    const operator = block.data.operator;

    switch (operator) {
        case '>': conditionResult = leftValue > rightValue; break;
        case '<': conditionResult = leftValue < rightValue; break;
        case '==': conditionResult = leftValue == rightValue; break;
        case '!=': conditionResult = leftValue != rightValue; break;
        case '>=': conditionResult = leftValue >= rightValue; break;
        case '<=': conditionResult = leftValue <= rightValue; break;
    }

    this.output.push(`> Проверка условия: ${leftValue} ${operator} ${rightValue} = ${conditionResult}`);

    if (conditionResult) {
        this.output.push(`> Условие ИСТИНА, выполняем блок then`);
        if (block.nestedBlocks && block.nestedBlocks.then) {
            block.nestedBlocks.then.forEach(nestedBlock => {
                this.executeBlock(nestedBlock, { variables });
            });
        }
    } else {
        this.output.push(`> Условие ЛОЖЬ, выполняем блок else`);
        if (block.nestedBlocks && block.nestedBlocks.else) {
            block.nestedBlocks.else.forEach(nestedBlock => {
                this.executeBlock(nestedBlock, { variables });
            });
        }
    }
}

    executeWhile(block, variables) {
        let iterations = 0;
        const maxIterations = 1000;
        
        while (iterations < maxIterations) {
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

            if (!conditionResult) break;
            
            if (block.nestedBlocks) {
                for (let nestedBlock of block.nestedBlocks) {
                    this.executeBlock(nestedBlock, { variables });
                }
            }
            iterations++;
        }
        
        if (iterations >= maxIterations) {
            this.output.push(`⚠️ Прерван цикл после ${maxIterations} итераций`);
        } else {
            this.output.push(`> Цикл завершён (${iterations} итераций)`);
        }
    }

    executeArrayDeclaration(block, variables) {
        const name = block.data.name.trim();
        const size = parseInt(block.data.size);
        const initValue = block.data.initValue !== undefined ? block.data.initValue : 0;
        
        const array = new Array(size).fill(initValue);
        variables.set(name, array);
        this.output.push(`> Объявлен массив: ${name}[${size}] = [${array.join(', ')}]`);
    }

    executeArrayAssignment(block, variables) {
        const arrayName = block.data.arrayName.trim();
        const indexExpr = block.data.index;
        const valueExpr = block.data.value;
        
        if (!variables.has(arrayName)) {
            throw new Error(`Массив "${arrayName}" не объявлен`);
        }
        
        const array = variables.get(arrayName);
        if (!Array.isArray(array)) {
            throw new Error(`"${arrayName}" не является массивом`);
        }
        
        const index = this.evaluateExpression(indexExpr, variables);
        if (index < 0 || index >= array.length) {
            throw new Error(`Индекс ${index} вне границ массива "${arrayName}"`);
        }
        
        const value = this.evaluateExpression(valueExpr, variables);
        array[index] = value;
        variables.set(arrayName, array);
        
        if (Array.isArray(value)) {
            this.output.push(`> ${arrayName}[${index}] = [${value.join(', ')}]`);
        } else {
            this.output.push(`> ${arrayName}[${index}] = ${value}`);
        }
    }
}
