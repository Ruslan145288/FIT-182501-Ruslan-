Interpreter.prototype.executeBlock = function(block, context = {}) {
    const variables = context.variables || this.variables;
    
    switch (block.type) {
        case BlockTypes.VARIABLE:
            this.executeVariableDeclaration(block, variables);
            break;
        case BlockTypes.ASSIGNMENT:
            this.executeAssignment(block, variables);
            break;
        case BlockTypes.IF:
            this.executeIf(block, variables);
            break;
    }
};

Interpreter.prototype.executeVariableDeclaration = function(block, variables) {
    const varNames = block.data.names.split(',').map(name => name.trim());
    varNames.forEach(name => {
        if (name) {
            variables.set(name, 0);
            this.output.push(`> Объявлена переменная: ${name} = 0`);
        }
    });
};

Interpreter.prototype.executeAssignment = function(block, variables) {
    const varName = block.data.variable;
    if (!variables.has(varName)) {
        throw new Error(`Переменная ${varName} не объявлена`);
    }
    const value = this.evaluateExpression(block.data.expression, variables);
    variables.set(varName, value);
    this.output.push(`> ${varName} = ${value}`);
};

Interpreter.prototype.executeIf = function(block, variables) {
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
};