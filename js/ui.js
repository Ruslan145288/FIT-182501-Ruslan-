class UIManager {
    constructor(blockManager, interpreter) {
        this.blockManager = blockManager;
        this.interpreter = interpreter;
        this.programArea = document.getElementById('programArea');
    }

    renderBlocks() {
        this.programArea.innerHTML = '';
        this.blockManager.blocks.forEach(block => {
            this.programArea.appendChild(this.createBlockElement(block));
        });
        
        // Делаем блоки перетаскиваемыми после отрисовки
        this.makeBlocksDraggable();
    }

    makeBlocksDraggable() {
        document.querySelectorAll('.program-block').forEach(block => {
            block.setAttribute('draggable', 'true');
            
            block.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', block.dataset.blockId);
                e.dataTransfer.effectAllowed = 'move';
                block.classList.add('dragging');
                
               
                const deleteZone = document.getElementById('deleteZone');
                if (deleteZone) deleteZone.classList.add('show');
            });
            
            block.addEventListener('dragend', (e) => {
                block.classList.remove('dragging');
                
              
                const deleteZone = document.getElementById('deleteZone');
                if (deleteZone) deleteZone.classList.remove('show');
            });
        });
    }

    createBlockElement(block) {
        const div = document.createElement('div');
        div.className = `program-block ${this.getBlockClass(block.type)}`;
        div.dataset.blockId = block.id;

        const header = document.createElement('div');
        header.className = 'block-header';
        header.innerHTML = `
            <span>${this.getBlockTitle(block.type)}</span>
            <div class="block-actions">
                <button onclick="uiManager.editBlock(${block.id})">✏️</button>
                <button onclick="uiManager.deleteBlock(${block.id})">🗑️</button>
            </div>
        `;

        const content = document.createElement('div');
        content.className = 'block-content';
        content.appendChild(this.createBlockContent(block));

        div.appendChild(header);
        div.appendChild(content);

if (block.type === BlockTypes.IF) {
    const thenContainer = document.createElement('div');
    thenContainer.className = 'nested-blocks then-blocks';
    thenContainer.innerHTML = '<div class="nested-label">✅ THEN:</div>';
    thenContainer.id = `then-${block.id}`;
    
    const elseContainer = document.createElement('div');
    elseContainer.className = 'nested-blocks else-blocks';
    elseContainer.innerHTML = '<div class="nested-label">❌ ELSE:</div>';
    elseContainer.id = `else-${block.id}`;
    
    if (block.nestedBlocks && block.nestedBlocks.then) {
        block.nestedBlocks.then.forEach(nestedBlock => {
            thenContainer.appendChild(this.createBlockElement(nestedBlock));
        });
    }
    
    if (block.nestedBlocks && block.nestedBlocks.else) {
        block.nestedBlocks.else.forEach(nestedBlock => {
            elseContainer.appendChild(this.createBlockElement(nestedBlock));
        });
    }
    
    div.appendChild(thenContainer);
    div.appendChild(elseContainer);
}

if (block.type === BlockTypes.WHILE) {
    const bodyContainer = document.createElement('div');
    bodyContainer.className = 'nested-blocks while-body';
    bodyContainer.innerHTML = '<div class="nested-label">🔄 Тело цикла:</div>';
    bodyContainer.id = `while-${block.id}`;
    
    if (block.nestedBlocks) {
        block.nestedBlocks.forEach(nestedBlock => {
            bodyContainer.appendChild(this.createBlockElement(nestedBlock));
        });
    }
    
    div.appendChild(bodyContainer);
}

        return div;
    }

    getBlockClass(type) {
        const classes = {
            [BlockTypes.VARIABLE]: 'variable-decl',
            [BlockTypes.ASSIGNMENT]: 'assignment',
            [BlockTypes.IF]: 'if-block',
            [BlockTypes.LOGICAL]: 'logical',
            [BlockTypes.WHILE]: 'while-block',
            [BlockTypes.ARITHMETIC]: 'arithmetic'
        };
        return classes[type] || '';
    }

    getBlockTitle(type) {
        const titles = {
            [BlockTypes.VARIABLE]: '📦 Объявление переменной',
            [BlockTypes.ASSIGNMENT]: '📝 Присваивание',
            [BlockTypes.IF]: '🔀 Условный оператор If',
            [BlockTypes.LOGICAL]: '🔣 Логический оператор',
            [BlockTypes.WHILE]: '🔄 Цикл While',
            [BlockTypes.ARITHMETIC]: '🧮 Арифметическая операция'
        };
        return titles[type] || 'Блок';
    }

    createBlockContent(block) {
        const container = document.createElement('div');
        
        switch(block.type) {
            case BlockTypes.VARIABLE:
                container.innerHTML = `
                    <input type="text" placeholder="имя1, имя2, ..." value="${block.data.names || ''}" 
                           onchange="uiManager.updateBlockData(${block.id}, 'names', this.value)">
                `;
                break;
                
            case BlockTypes.ASSIGNMENT:
                container.innerHTML = `
                    <input type="text" placeholder="переменная" value="${block.data.variable || ''}" 
                           onchange="uiManager.updateBlockData(${block.id}, 'variable', this.value)" style="width:100px">
                    <span>=</span>
                    <input type="text" placeholder="выражение" value="${block.data.expression || ''}" 
                           onchange="uiManager.updateBlockData(${block.id}, 'expression', this.value)" style="width:150px">
                `;
                break;
                
            case BlockTypes.IF:
                container.innerHTML = `
                    <span>if (</span>
                    <input type="text" placeholder="выражение" value="${block.data.leftExpr || ''}" 
                           onchange="uiManager.updateBlockData(${block.id}, 'leftExpr', this.value)" style="width:100px">
                    <select onchange="uiManager.updateBlockData(${block.id}, 'operator', this.value)">
                        <option value=">" ${block.data.operator === '>' ? 'selected' : ''}>></option>
                        <option value="<" ${block.data.operator === '<' ? 'selected' : ''}><</option>
                        <option value="==" ${block.data.operator === '==' ? 'selected' : ''}>==</option>
                        <option value="!=" ${block.data.operator === '!=' ? 'selected' : ''}>!=</option>
                    </select>
                    <input type="text" placeholder="выражение" value="${block.data.rightExpr || ''}" 
                           onchange="uiManager.updateBlockData(${block.id}, 'rightExpr', this.value)" style="width:100px">
                    <span>)</span>
                `;
                break;
                
            case BlockTypes.LOGICAL:
                if (block.data.logicalOp === '!') {
                    container.innerHTML = `
                        <div class="logical-expression">
                            <span class="logical-operator-badge">!</span>
                            <input type="text" placeholder="выражение" value="${block.data.expr || ''}" 
                                   onchange="uiManager.updateBlockData(${block.id}, 'expr', this.value)" style="width:150px">
                        </div>
                    `;
                } else {
                    container.innerHTML = `
                        <div class="logical-expression">
                            <input type="text" placeholder="выражение 1" value="${block.data.leftExpr || ''}" 
                                   onchange="uiManager.updateBlockData(${block.id}, 'leftExpr', this.value)" style="width:120px">
                            <span class="logical-operator-badge">${block.data.logicalOp || '&&'}</span>
                            <input type="text" placeholder="выражение 2" value="${block.data.rightExpr || ''}" 
                                   onchange="uiManager.updateBlockData(${block.id}, 'rightExpr', this.value)" style="width:120px">
                        </div>
                    `;
                }
                break;
                
            case BlockTypes.ARITHMETIC:
                const arithmeticDiv = document.createElement('div');
                arithmeticDiv.className = 'arithmetic-expression';
    
                const varInput = document.createElement('input');
                varInput.type = 'text';
                varInput.placeholder = 'переменная';
                varInput.value = block.data.varName || '';
                varInput.style.width = '90px';
                varInput.onchange = (e) => this.updateBlockData(block.id, 'varName', e.target.value);
    
                const equalsSpan = document.createElement('span');
                equalsSpan.textContent = '=';
                equalsSpan.style.fontWeight = 'bold';
    
                const exprInput = document.createElement('input');
                exprInput.type = 'text';
                exprInput.placeholder = 'выражение (например: x + 5 * 2)';
                exprInput.value = block.data.expression || '';
                exprInput.style.width = '200px';
                exprInput.className = 'arithmetic-input';
                exprInput.onchange = (e) => this.updateBlockData(block.id, 'expression', e.target.value);
    
                arithmeticDiv.appendChild(varInput);
                arithmeticDiv.appendChild(equalsSpan);
                arithmeticDiv.appendChild(exprInput);
                container.appendChild(arithmeticDiv);
    
                if (block.data.varName && block.data.expression) {
                    const preview = document.createElement('div');
                    preview.className = 'arithmetic-preview';
                    preview.innerHTML = `📊 ${block.data.varName} = ${block.data.expression}`;
                    container.appendChild(preview);
                }
                break;
        }
        
        return container;
    }

    updateBlockData(blockId, field, value) {
        this.blockManager.updateBlock(blockId, { [field]: value });
    }

    deleteBlock(blockId) {
        this.blockManager.deleteBlock(blockId);
        this.renderBlocks();
        this.updateVariablesDisplay();
    }

    editBlock(blockId) {
        const blockElement = document.querySelector(`[data-block-id="${blockId}"] input`);
        if (blockElement) blockElement.focus();
    }

    highlightError() {
        const firstBlock = document.querySelector('.program-block');
        if (firstBlock) {
            firstBlock.classList.add('error-highlight');
            setTimeout(() => {
                firstBlock.classList.remove('error-highlight');
            }, 2000);
        }
    }

    updateVariablesDisplay() {
        const variablesList = document.getElementById('variablesList');
        variablesList.innerHTML = '';

        if (this.interpreter.variables.size === 0) {
            variablesList.innerHTML = '<div class="variable-item">Нет объявленных переменных</div>';
        } else {
            this.interpreter.variables.forEach((value, name) => {
                const item = document.createElement('div');
                item.className = 'variable-item';
                
                // Если значение - массив, отображаем его красиво
                if (Array.isArray(value)) {
                    item.textContent = `${name} = [${value.join(', ')}]`;
                } else {
                    item.textContent = `${name} = ${value}`;
                }
                
                variablesList.appendChild(item);
            });
        }
    }
}
