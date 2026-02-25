const BlockTypes = {
    VARIABLE: 'variable',
    ASSIGNMENT: 'assignment',
    IF: 'if'
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

    validateBlock(block) {
        switch(block.type) {
            case BlockTypes.VARIABLE:
                if (!block.data.names || block.data.names.trim() === '') {
                    throw new Error('Не указаны имена переменных');
                }
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
}