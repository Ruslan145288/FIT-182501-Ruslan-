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

        return div;
    }

    getBlockClass(type) {
        const classes = {
            [BlockTypes.VARIABLE]: 'variable-decl',
            [BlockTypes.ASSIGNMENT]: 'assignment',
            [BlockTypes.IF]: 'if-block'
        };
        return classes[type] || '';
    }

    getBlockTitle(type) {
        const titles = {
            [BlockTypes.VARIABLE]: '📦 Объявление переменной',
            [BlockTypes.ASSIGNMENT]: '📝 Присваивание',
            [BlockTypes.IF]: '🔀 Условный оператор If'
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
        }
        
        return container;
    }

    updateBlockData(blockId, field, value) {
        this.blockManager.updateBlock(blockId, { [field]: value });
    }

    deleteBlock(blockId) {
        this.blockManager.deleteBlock(blockId);
        this.renderBlocks();
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
                item.textContent = `${name} = ${value}`;
                variablesList.appendChild(item);
            });
        }
    }
}
