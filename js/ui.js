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
        this.highlightErrors();
    }

    makeBlocksDraggable() {
        document.querySelectorAll('.program-block').forEach(block => {
            block.setAttribute('draggable', 'true');
            
            block.addEventListener('dragstart', (e) => {
                const blockId = block.dataset.blockId;
                e.dataTransfer.setData('text/plain', blockId);
                e.dataTransfer.effectAllowed = 'move';
                block.classList.add('dragging');
                
                const deleteZone = document.getElementById('deleteZone');
                if (deleteZone) deleteZone.classList.add('show');
                
                e.dataTransfer.setData('fromY', e.clientY.toString());
            });
            
            block.addEventListener('dragend', (e) => {
                block.classList.remove('dragging');
                
                const deleteZone = document.getElementById('deleteZone');
                if (deleteZone) deleteZone.classList.remove('show');
            });
        });
    }

    setupDropZones() {
        // Основная область
        this.programArea.addEventListener('dragover', (e) => e.preventDefault());
        
        this.programArea.addEventListener('drop', (e) => {
            e.preventDefault();
            const data = e.dataTransfer.getData('text/plain');
            
            if (data && isNaN(parseInt(data))) {
                this.createBlockFromPalette(data);
                return;
            }
            
            if (data && !isNaN(parseInt(data))) {
                const blockId = parseInt(data);
                
                // Проверяем слоты THEN и ELSE
                const thenSlot = e.target.closest('.then-slot');
                const elseSlot = e.target.closest('.else-slot');
                
                if (thenSlot) {
                    const parentId = parseInt(thenSlot.dataset.parentId);
                    if (!isNaN(parentId)) {
                        this.moveBlockToParent(blockId, parentId, 'then');
                        return;
                    }
                }
                
                if (elseSlot) {
                    const parentId = parseInt(elseSlot.dataset.parentId);
                    if (!isNaN(parentId)) {
                        this.moveBlockToParent(blockId, parentId, 'else');
                        return;
                    }
                }
                
                this.moveBlock(blockId, e.clientY);
            }
        });

        // Слоты для вложенных блоков
        document.addEventListener('dragover', (e) => {
            const thenSlot = e.target.closest('.then-slot');
            const elseSlot = e.target.closest('.else-slot');
            
            if (thenSlot) {
                e.preventDefault();
                thenSlot.classList.add('drag-over');
            }
            if (elseSlot) {
                e.preventDefault();
                elseSlot.classList.add('drag-over');
            }
        });

        document.addEventListener('dragleave', (e) => {
            const thenSlot = e.target.closest('.then-slot');
            const elseSlot = e.target.closest('.else-slot');
            
            if (thenSlot) {
                thenSlot.classList.remove('drag-over');
            }
            if (elseSlot) {
                elseSlot.classList.remove('drag-over');
            }
        });
    }

    moveBlockToParent(blockId, parentId, slotType) {
        const success = this.blockManager.moveBlockToParent(blockId, parentId, slotType);
        if (success) {
            this.renderBlocks();
        }
    }

    moveBlock(blockId, mouseY) {
        const block = this.blockManager.getBlock(blockId);
        if (!block) return;
        
        const allBlocks = [...this.programArea.querySelectorAll('.program-block')];
        const blocks = allBlocks.filter(b => parseInt(b.dataset.blockId) !== blockId);
        
        let index = blocks.length;
        
        for (let i = 0; i < blocks.length; i++) {
            const rect = blocks[i].getBoundingClientRect();
            if (mouseY < rect.top + rect.height / 2) {
                index = i;
                break;
            }
        }
        
        const currentIndex = this.blockManager.blocks.findIndex(b => b.id === blockId);
        if (currentIndex !== -1) {
            if (index === currentIndex || index === currentIndex + 1) {
                return;
            }
        }
        
        const success = this.blockManager.moveBlockToMain(blockId, index);
        if (success) {
            this.renderBlocks();
        }
    }

    createBlockFromPalette(type) {
        let newBlock;
        switch(type) {
            case 'variable-decl':
                newBlock = this.blockManager.createBlock('variable', { names: '' });
                break;
            case 'assignment':
                newBlock = this.blockManager.createBlock('assignment', { variable: '', expression: '' });
                break;
            case 'if':
                newBlock = this.blockManager.createBlock('if', { condition: '' });
                break;
            case 'ifelse':
                newBlock = this.blockManager.createBlock('ifelse', { condition: '' });
                break;
            case 'arithmetic':
                newBlock = this.blockManager.createBlock('arithmetic', { expression: '' });
                break;
        }
        if (newBlock) this.renderBlocks();
    }

    createBlockElement(block) {
        const div = document.createElement('div');
        div.className = `program-block ${block.type}-block`;
        if (block.error) div.classList.add('block-error');
        div.dataset.blockId = block.id;

        const header = document.createElement('div');
        header.className = 'block-header';
        header.innerHTML = `
            <span>${this.getBlockTitle(block.type)}</span>
            <div class="block-actions">
                <button onclick="uiManager.deleteBlock(${block.id})" title="Удалить">🗑️</button>
            </div>
        `;

        const content = document.createElement('div');
        content.className = 'block-content';
        content.appendChild(this.createBlockContent(block));

        div.appendChild(header);
        div.appendChild(content);
        
        if (block.error) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'block-error-message';
            errorDiv.textContent = '❌ ' + block.error;
            div.appendChild(errorDiv);
        }

        return div;
    }

    getBlockTitle(type) {
        const titles = {
            'variable': '📦 Объявление переменных',
            'assignment': '📝 Присваивание',
            'if': '🔀 Если',
            'ifelse': '🔀 Если-Иначе',
            'arithmetic': '🧮 Арифметика'
        };
        return titles[type] || 'Блок';
    }

    createBlockContent(block) {
        const container = document.createElement('div');
        container.style.width = '100%';
        
        switch(block.type) {
            case 'variable':
                container.innerHTML = `
                    <input type="text" value="${block.data.names || ''}" 
                           placeholder="x, y, z" 
                           onchange="uiManager.updateBlockData(${block.id}, 'names', this.value)">
                `;
                break;
                
            case 'assignment':
                container.innerHTML = `
                    <input type="text" value="${block.data.variable || ''}" 
                           placeholder="x" style="width:60px"
                           onchange="uiManager.updateBlockData(${block.id}, 'variable', this.value)">
                    <span style="margin:0 5px;">=</span>
                    <input type="text" value="${block.data.expression || ''}" 
                           placeholder="5 + 3" style="width:100px"
                           onchange="uiManager.updateBlockData(${block.id}, 'expression', this.value)">
                `;
                break;
                
            case 'if':
                const ifDiv = document.createElement('div');
                ifDiv.style.width = '100%';
                
                const conditionInput = document.createElement('input');
                conditionInput.type = 'text';
                conditionInput.value = block.data.condition || '';
                conditionInput.placeholder = 'x > 5';
                conditionInput.style.width = '100%';
                conditionInput.style.padding = '8px';
                conditionInput.style.marginBottom = '10px';
                conditionInput.style.border = '2px solid #9c27b0';
                conditionInput.style.borderRadius = '6px';
                conditionInput.onchange = (e) => this.updateBlockData(block.id, 'condition', e.target.value);
                
                const hintDiv = document.createElement('div');
                hintDiv.style.fontSize = '11px';
                hintDiv.style.color = '#666';
                hintDiv.style.marginBottom = '8px';
                hintDiv.innerHTML = 'Операторы: <, >, <=, >=, ==, !=';
                
                const thenSlot = document.createElement('div');
                thenSlot.className = 'then-slot nested-slot';
                thenSlot.dataset.parentId = block.id;
                thenSlot.style.marginLeft = '20px';
                thenSlot.style.padding = '10px';
                thenSlot.style.borderLeft = '3px solid #4caf50';
                thenSlot.style.background = '#f0f9f0';
                thenSlot.style.minHeight = '50px';
                
                const thenLabel = document.createElement('div');
                thenLabel.style.fontSize = '12px';
                thenLabel.style.fontWeight = 'bold';
                thenLabel.style.color = '#2e7d32';
                thenLabel.style.marginBottom = '5px';
                thenLabel.innerHTML = 'ТОГДА:';
                thenSlot.appendChild(thenLabel);
                
                if (block.nestedBlocks.then && block.nestedBlocks.then.length > 0) {
                    block.nestedBlocks.then.forEach(nested => {
                        thenSlot.appendChild(this.createBlockElement(nested));
                    });
                }
                
                ifDiv.appendChild(conditionInput);
                ifDiv.appendChild(hintDiv);
                ifDiv.appendChild(thenSlot);
                container.appendChild(ifDiv);
                break;
                
            case 'ifelse':
                const ifelseDiv = document.createElement('div');
                ifelseDiv.style.width = '100%';
                
                const conditionInput2 = document.createElement('input');
                conditionInput2.type = 'text';
                conditionInput2.value = block.data.condition || '';
                conditionInput2.placeholder = 'x > 5';
                conditionInput2.style.width = '100%';
                conditionInput2.style.padding = '8px';
                conditionInput2.style.marginBottom = '10px';
                conditionInput2.style.border = '2px solid #9c27b0';
                conditionInput2.style.borderRadius = '6px';
                conditionInput2.onchange = (e) => this.updateBlockData(block.id, 'condition', e.target.value);
                
                const hintDiv2 = document.createElement('div');
                hintDiv2.style.fontSize = '11px';
                hintDiv2.style.color = '#666';
                hintDiv2.style.marginBottom = '8px';
                hintDiv2.innerHTML = 'Операторы: <, >, <=, >=, ==, !=';
                
                // THEN слот
                const thenSlot2 = document.createElement('div');
                thenSlot2.className = 'then-slot nested-slot';
                thenSlot2.dataset.parentId = block.id;
                thenSlot2.style.marginLeft = '20px';
                thenSlot2.style.padding = '10px';
                thenSlot2.style.borderLeft = '3px solid #4caf50';
                thenSlot2.style.background = '#f0f9f0';
                thenSlot2.style.minHeight = '50px';
                thenSlot2.style.marginBottom = '10px';
                
                const thenLabel2 = document.createElement('div');
                thenLabel2.style.fontSize = '12px';
                thenLabel2.style.fontWeight = 'bold';
                thenLabel2.style.color = '#2e7d32';
                thenLabel2.style.marginBottom = '5px';
                thenLabel2.innerHTML = 'ТОГДА:';
                thenSlot2.appendChild(thenLabel2);
                
                if (block.nestedBlocks.then && block.nestedBlocks.then.length > 0) {
                    block.nestedBlocks.then.forEach(nested => {
                        thenSlot2.appendChild(this.createBlockElement(nested));
                    });
                }
                
                // ELSE слот
                const elseSlot = document.createElement('div');
                elseSlot.className = 'else-slot nested-slot';
                elseSlot.dataset.parentId = block.id;
                elseSlot.style.marginLeft = '20px';
                elseSlot.style.padding = '10px';
                elseSlot.style.borderLeft = '3px solid #f44336';
                elseSlot.style.background = '#ffebee';
                elseSlot.style.minHeight = '50px';
                
                const elseLabel = document.createElement('div');
                elseLabel.style.fontSize = '12px';
                elseLabel.style.fontWeight = 'bold';
                elseLabel.style.color = '#c62828';
                elseLabel.style.marginBottom = '5px';
                elseLabel.innerHTML = 'ИНАЧЕ:';
                elseSlot.appendChild(elseLabel);
                
                if (block.nestedBlocks.else && block.nestedBlocks.else.length > 0) {
                    block.nestedBlocks.else.forEach(nested => {
                        elseSlot.appendChild(this.createBlockElement(nested));
                    });
                }
                
                ifelseDiv.appendChild(conditionInput2);
                ifelseDiv.appendChild(hintDiv2);
                ifelseDiv.appendChild(thenSlot2);
                ifelseDiv.appendChild(elseSlot);
                container.appendChild(ifelseDiv);
                break;
                
            case 'arithmetic':
                container.innerHTML = `
                    <input type="text" value="${block.data.expression || ''}" 
                           placeholder="x = (y + 5) * 2" style="width:100%; padding:8px; font-family:monospace;"
                           onchange="uiManager.updateBlockData(${block.id}, 'expression', this.value)">
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
        this.updateVariablesDisplay();
    }

    highlightErrors() {
        this.blockManager.validateAllBlocks();
        
        document.querySelectorAll('.program-block').forEach(el => {
            const blockId = parseInt(el.dataset.blockId);
            const block = this.blockManager.getBlock(blockId);
            
            if (block && block.error) {
                el.classList.add('error-highlight');
                
                if (!el.querySelector('.block-error-message')) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'block-error-message';
                    errorDiv.textContent = '❌ ' + block.error;
                    el.appendChild(errorDiv);
                }
            } else {
                el.classList.remove('error-highlight');
                const errorMsg = el.querySelector('.block-error-message');
                if (errorMsg) errorMsg.remove();
            }
        });
    }

    updateVariablesDisplay() {
        const list = document.getElementById('variablesList');
        list.innerHTML = '';
        
        if (this.interpreter.variables.size === 0) {
            list.innerHTML = '<div class="empty-state">Нет переменных</div>';
        } else {
            this.interpreter.variables.forEach((value, name) => {
                const item = document.createElement('div');
                item.className = 'variable-item';
                item.textContent = `${name} = ${value}`;
                list.appendChild(item);
            });
        }
    }
}
