let blockManager;
let interpreter;
let uiManager;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Инициализация...');
    
    blockManager = new BlockManager();
    interpreter = new Interpreter();
    uiManager = new UIManager(blockManager, interpreter);

    window.uiManager = uiManager;
    window.blockManager = blockManager;
    window.interpreter = interpreter;
    
    initDragAndDrop();
    
    uiManager.renderBlocks();
    uiManager.updateVariablesDisplay();
});

function initDragAndDrop() {
    document.querySelectorAll('.block-item').forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
    });

    document.getElementById('programArea').addEventListener('dragover', (e) => e.preventDefault());
    document.getElementById('programArea').addEventListener('drop', handleDrop);
}

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.type);
}

function handleDrop(e) {
    e.preventDefault();
    const blockType = e.dataTransfer.getData('text/plain');
    
    let newBlock;
    switch(blockType) {
        case 'variable-decl':
            newBlock = blockManager.createBlock(BlockTypes.VARIABLE, { names: '' });
            break;
        case 'assignment':
            newBlock = blockManager.createBlock(BlockTypes.ASSIGNMENT, { variable: '', expression: '' });
            break;
        case 'if-statement':
            newBlock = blockManager.createBlock(BlockTypes.IF, { leftExpr: '', operator: '>', rightExpr: '' }, []);
            break;
    }
    
    uiManager.renderBlocks();
}
window.executeProgram = function() {
    interpreter.reset();
    const consoleOutput = document.getElementById('consoleOutput');
    consoleOutput.innerHTML = '<span class="prompt">$</span> Выполнение...\n';

    try {
        blockManager.blocks.forEach(block => {
            blockManager.validateBlock(block);
            interpreter.executeBlock(block);
        });

        interpreter.output.forEach(line => {
            consoleOutput.innerHTML += line + '<br>';
        });

        uiManager.updateVariablesDisplay();
        consoleOutput.innerHTML += '<br>✅ Выполнение завершено!';
    } catch (error) {
        consoleOutput.innerHTML += `❌ Ошибка: ${error.message}`;
        uiManager.highlightError();
    }
}

window.clearWorkspace = function() {
    if (confirm('Очистить рабочую область?')) {
        blockManager.blocks = [];
        blockManager.blockId = 0;
        interpreter.reset();
        uiManager.renderBlocks();
        uiManager.updateVariablesDisplay();
    }
}

window.clearOutput = function() {
    document.getElementById('consoleOutput').innerHTML = '<span class="prompt">$</span> Готов к выполнению...';
}