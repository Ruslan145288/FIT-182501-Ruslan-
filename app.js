// Глобальные переменные объявляем ОДИН РАЗ в начале файла
let blockManager;
let interpreter;
let uiManager;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Инициализация...');
    
    // Создаем экземпляры классов
    blockManager = new BlockManager();
    interpreter = new Interpreter();
    uiManager = new UIManager(blockManager, interpreter);
    
    // Сохраняем в window для доступа из onclick
    window.blockManager = blockManager;
    window.interpreter = interpreter;
    window.uiManager = uiManager;
    
    // Инициализируем Drag & Drop
    initDragAndDrop();
    
    // Начальная отрисовка
    uiManager.renderBlocks();
    uiManager.updateVariablesDisplay();
});

// Функции Drag & Drop
function initDragAndDrop() {
    document.querySelectorAll('.block-item').forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
    });

    const programArea = document.getElementById('programArea');
    programArea.addEventListener('dragover', (e) => e.preventDefault());
    programArea.addEventListener('drop', handleDrop);
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
        case 'if':
            newBlock = blockManager.createBlock(BlockTypes.IF, { 
                leftExpr: '', 
                operator: '>', 
                rightExpr: '' 
            }, []);
            break;
    }
    
    uiManager.renderBlocks();
}

// Глобальные функции для кнопок
window.executeProgram = function() {
    interpreter.reset();
    const consoleOutput = document.getElementById('consoleOutput');
    consoleOutput.innerHTML = '<span class="prompt">$</span> Выполнение...<br>';

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
        document.getElementById('consoleOutput').innerHTML = '<span class="prompt">$</span> Рабочая область очищена';
    }
}

window.clearOutput = function() {
    document.getElementById('consoleOutput').innerHTML = '<span class="prompt">$</span> Готов к выполнению...';
}