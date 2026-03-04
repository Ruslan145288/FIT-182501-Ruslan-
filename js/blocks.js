const BlockTypes = {
    VARIABLE: 'variable',
    ASSIGNMENT: 'assignment',
    IF: 'if',
    WHILE: 'while',
    ARRAY_DECL: 'array-decl',
    ARRAY_ASSIGN: 'array-assign',
    LOGICAL: 'logical',
    ARITHMETIC: 'arithmetic' // Новый тип для арифметики
};

class BlockManager {
    constructor() {
        this.blocks = [];
        this.blockId = 0;
    }

    createBlock(type, data = {}, nestedBlocks = []) {
        const block = {
            id: this.blockId++,
            type: type,
            data: data,
            nestedBlocks: nestedBlocks
        };
        this.blocks.push(block);
        return block;
    }

    insertBlockAt(type, data, index, nestedBlocks = []) {
        const block = {
            id: this.blockId++,
            type: type,
            data: data,
            nestedBlocks: nestedBlocks
        };
        this.blocks.splice(index, 0, block);
        return block;
    }

    validateBlock(block) {
        switch(block.type) {
            case BlockTypes.VARIABLE:
                // Проверяем только при выполнении, а не при создании
                // Разрешаем пустые поля для ввода
                break;
                
            case BlockTypes.ASSIGNMENT:
                if (!block.data.variable || !block.data.expression) {
                    throw new Error('Неполный блок присваивания');
                }
                break;
                
            case BlockTypes.IF:
                if (!block.data.leftExpr || !block.data.rightExpr || !block.data.operator) {
                    throw new Error('Неполный блок If');
                }
                break;
                
            case BlockTypes.WHILE:
                if (!block.data.leftExpr || !block.data.rightExpr || !block.data.operator) {
                    throw new Error('Неполный блок While');
                }
                break;
                
            case BlockTypes.ARRAY_DECL:
                if (!block.data.name) throw new Error('Не указано имя массива');
                if (!block.data.size || isNaN(block.data.size)) throw new Error('Некорректный размер массива');
                break;
                
            case BlockTypes.ARRAY_ASSIGN:
                if (!block.data.arrayName || !block.data.index || block.data.value === undefined) {
                    throw new Error('Неполный блок присваивания массиву');
                }
                break;
                
            case BlockTypes.LOGICAL:
                if (!block.data.leftExpr || !block.data.rightExpr || !block.data.logicalOp) {
                    throw new Error('Неполный логический блок');
                }
                break;
                
            case BlockTypes.ARITHMETIC:
                if (!block.data.varName) {
                    throw new Error('Не указана переменная для результата');
                }
                if (!block.data.leftExpr) {
                    throw new Error('Не указано левое выражение');
                }
                if (!block.data.rightExpr && block.data.operator !== '') {
                    throw new Error('Не указано правое выражение');
                }
                if (!block.data.operator) {
                    throw new Error('Не выбран оператор');
                }
                break;
        }
    }

    deleteBlock(blockId) {
        this.blocks = this.blocks.filter(b => b.id !== blockId);
        this.blocks.forEach(block => {
            if (block.nestedBlocks) {
                block.nestedBlocks = block.nestedBlocks.filter(b => b.id !== blockId);
            }
        });
    }

    getBlockIndex(blockId) {
        return this.blocks.findIndex(b => b.id === blockId);
    }   

    updateBlock(id, newData) {
        const block = this.getBlock(id);
        if (block) {
            block.data = { ...block.data, ...newData };
            return true;
        }
        return false;
    }

    getBlock(id) {
        return this.blocks.find(b => b.id === id);
    }
}
