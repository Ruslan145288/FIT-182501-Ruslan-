const BlockTypes = {
    VARIABLE: 'variable',
    ASSIGNMENT: 'assignment',
    IF: 'if',
    ARITHMETIC: 'arithmetic'
};

class BlockManager {
    constructor() {
        this.blocks = [];
        this.blockId = 0;
    }

    createBlock(type, data = {}) {
        const block = {
            id: this.blockId++,
            type: type,
            data: data,
            nestedBlocks: [],
            error: null
        };
        this.blocks.push(block);
        return block;
    }

    deleteBlock(blockId) {
        this.blocks = this.blocks.filter(b => b.id !== blockId);
        
        // Удаляем из вложенных блоков
        this.blocks.forEach(block => {
            if (block.nestedBlocks) {
                block.nestedBlocks = block.nestedBlocks.filter(b => b.id !== blockId);
            }
        });
    }

    getBlock(id) {
        for (let block of this.blocks) {
            if (block.id === id) return block;
            if (block.nestedBlocks) {
                const found = block.nestedBlocks.find(b => b.id === id);
                if (found) return found;
            }
        }
        return null;
    }

    updateBlock(id, newData) {
        const block = this.getBlock(id);
        if (block) {
            block.data = { ...block.data, ...newData };
            block.error = null;
            return true;
        }
        return false;
    }

    moveBlockToParent(blockId, parentId) {
        const block = this.getBlock(blockId);
        const parent = this.getBlock(parentId);
        
        if (!block || !parent || block.id === parent.id) return false;
        if (parent.type !== 'if') return false;
        
        // Удаляем блок из текущего места
        this.blocks = this.blocks.filter(b => b.id !== blockId);
        
        // Удаляем из других родителей если был там
        this.blocks.forEach(p => {
            if (p.nestedBlocks) {
                p.nestedBlocks = p.nestedBlocks.filter(b => b.id !== blockId);
            }
        });
        
        // Добавляем в нового родителя
        if (!parent.nestedBlocks) parent.nestedBlocks = [];
        parent.nestedBlocks.push(block);
        
        return true;
    }

    moveBlockToMain(blockId, index = -1) {
        const block = this.getBlock(blockId);
        if (!block) return false;
        
        // Сохраняем родителя если блок был вложенным
        let oldParent = null;
        for (let parent of this.blocks) {
            if (parent.nestedBlocks) {
                const foundIndex = parent.nestedBlocks.findIndex(b => b.id === blockId);
                if (foundIndex !== -1) {
                    oldParent = parent;
                    parent.nestedBlocks.splice(foundIndex, 1);
                    break;
                }
            }
        }
        
        // Если блок не был вложенным, удаляем из основного списка
        if (!oldParent) {
            const mainIndex = this.blocks.findIndex(b => b.id === blockId);
            if (mainIndex !== -1) {
                this.blocks.splice(mainIndex, 1);
            }
        }
        
        // Добавляем в основное место
        if (index >= 0 && index <= this.blocks.length) {
            this.blocks.splice(index, 0, block);
        } else {
            this.blocks.push(block);
        }
        
        return true;
    }

    validateAllBlocks() {
        let hasErrors = false;
        
        const validate = (block) => {
            try {
                switch(block.type) {
                    case 'variable':
                        if (!block.data.names || !block.data.names.trim()) {
                            throw new Error('Укажите имена переменных');
                        }
                        const names = block.data.names.split(',').map(s => s.trim());
                        names.forEach(name => {
                            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
                                throw new Error(`Некорректное имя переменной: ${name}`);
                            }
                        });
                        break;
                        
                    case 'assignment':
                        if (!block.data.variable || !block.data.variable.trim()) {
                            throw new Error('Укажите переменную');
                        }
                        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(block.data.variable)) {
                            throw new Error(`Некорректное имя переменной: ${block.data.variable}`);
                        }
                        if (!block.data.expression || !block.data.expression.trim()) {
                            throw new Error('Укажите выражение');
                        }
                        break;
                        
                    case 'if':
                        if (!block.data.condition || !block.data.condition.trim()) {
                            throw new Error('Укажите условие');
                        }
                        break;
                        
                    case 'arithmetic':
                        if (!block.data.expression || !block.data.expression.trim()) {
                            throw new Error('Укажите выражение');
                        }
                        const parts = block.data.expression.split('=').map(s => s.trim());
                        if (parts.length !== 2) {
                            throw new Error('Формат: переменная = выражение');
                        }
                        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(parts[0])) {
                            throw new Error(`Некорректное имя переменной: ${parts[0]}`);
                        }
                        break;
                }
                block.error = null;
            } catch (e) {
                block.error = e.message;
                hasErrors = true;
            }
            
            if (block.nestedBlocks) {
                block.nestedBlocks.forEach(validate);
            }
        };
        
        this.blocks.forEach(validate);
        return !hasErrors;
    }
}
