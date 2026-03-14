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
        this.makeBlocksDraggable(); // ← ВАЖНО: добавляем эту строку
        this.highlightErrors();
    }

    makeBlocksDraggable() {
        document.querySelectorAll('.program-block').forEach(block => {
            block.setAttribute('draggable', 'true');
            
            // Удаляем старые обработчики перед добавлением новых
            block.removeEventListener('dragstart', this.handleDragStart);
            block.removeEventListener('dragend', this.handleDragEnd);
            
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
            
            console.log('Drop в основную область:', data);
            
            if (data && isNaN(parseInt(data))) {
                this.createBlockFromPalette(data);
                return;
            }
            
            if (data && !isNaN(parseInt(data))) {
                const blockId = parseInt(data);
                const slot = e.target.closest('.nested-slot');
                
                if (slot) {
                    const parentId = parseInt(slot.dataset.parentId);
                    if (!isNaN(parentId)) {
                        this.moveBlockToParent(blockId, parentId);
                        return;
                    }
                }
                
                this.moveBlock(blockId, e.clientY);
            }
        });

        // Слоты для вложенных блоков
        document.addEventListener('dragover', (e) => {
            const slot = e.target.closest('.nested-slot');
            if (slot) {
                e.preventDefault();
                slot.classList.add('drag-over');
            }
        });

        document.addEventListener('dragleave', (e) => {
            const slot = e.target.closest('.nested-slot');
            if (slot) {
                slot.classList.remove('drag-over');
            }
        });
    }

    moveBlockToParent(blockId, parentId) {
        console.log('Перемещение в родителя:', blockId, '->', parentId);
        const success = this.blockManager.moveBlockToParent(blockId, parentId);
        if (success) {
            this.renderBlocks();
        }
    }

    moveBlock(blockId, mouseY) {
        console.log('Перемещение блока:', blockId, 'позиция Y:', mouseY);
        
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
        
        console.log('Индекс вставки:', index);
        
        const currentIndex = this.blockManager.blocks.findIndex(b => b.id === blockId);
        if (currentIndex !== -1) {
            if (index === currentIndex || index === currentIndex + 1) {
                console.log('Позиция не изменилась, пропускаем');
                return;
            }
        }
        
        const success = this.blockManager.moveBlockToMain(blockId, index);
        if (success) {
            this.renderBlocks();
        }
    }

    createBlockFromPalette(type) {
        console.log('Создание блока из палитры:', type);
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
                conditionInput.style.marginBottom = '10px';
                conditionInput.style.padding = '8px';
                conditionInput.style.border = '2px solid #9c27b0';
                conditionInput.style.borderRadius = '6px';
                conditionInput.onchange = (e) => this.updateBlockData(block.id, 'condition', e.target.value);
                
                const hintDiv = document.createElement('div');
                hintDiv.style.fontSize = '11px';
                hintDiv.style.color = '#666';
                hintDiv.style.marginBottom = '8px';
                hintDiv.innerHTML = 'Операторы: <, >, <=, >=, ==, !=';
                
                const slot = document.createElement('div');
                slot.className = 'nested-slot';
                slot.dataset.parentId = block.id;
                slot.style.marginLeft = '20px';
                slot.style.padding = '10px';
                slot.style.borderLeft = '3px solid #4caf50';
                slot.style.background = '#f0f9f0';
                slot.style.minHeight = '50px';
                slot.style.borderRadius = '0 8px 8px 0';
                
                if (block.nestedBlocks && block.nestedBlocks.length > 0) {
                    block.nestedBlocks.forEach(nested => {
                        slot.appendChild(this.createBlockElement(nested));
                    });
                }
                
                ifDiv.appendChild(conditionInput);
                ifDiv.appendChild(hintDiv);
                ifDiv.appendChild(slot);
                container.appendChild(ifDiv);
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
