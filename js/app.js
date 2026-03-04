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
    // Делаем блоки в палитре перетаскиваемыми
    document.querySelectorAll('.block-item').forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('drag', (e) => e.preventDefault());
    });

    const programArea = document.getElementById('programArea');
    
    // Разрешаем сбрасывать в рабочую область
    programArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        programArea.classList.add('drag-over');
    });
    
    programArea.addEventListener('dragleave', () => {
        programArea.classList.remove('drag-over');
    });
    
    programArea.addEventListener('drop', handleDrop);
    
    // Обработка перетаскивания внутри рабочей области
    programArea.addEventListener('dragover', handleDragOver);
    programArea.addEventListener('drop', handleInternalDrop);
    
    // Создаем зону удаления
    createDeleteZone();
}

function handleDragStart(e) {
    // Если это блок из палитры
    if (e.target.classList.contains('block-item')) {
        e.dataTransfer.setData('text/plain', e.target.dataset.type);
        e.dataTransfer.effectAllowed = 'copy';
    }
}

function handleDrop(e) {
    e.preventDefault();
    const programArea = document.getElementById('programArea');
    programArea.classList.remove('drag-over');
    
    // Получаем тип блока из палитры
    const blockType = e.dataTransfer.getData('text/plain');
    if (!blockType) return;
    
    // Создаем новый блок
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
    
    // Перерисовываем
    uiManager.renderBlocks();
}

function handleDragOver(e) {
    e.preventDefault();
    const programArea = document.getElementById('programArea');
    
    // Если это перетаскивание существующего блока
    const blockId = e.dataTransfer.getData('text/plain');
    if (blockId && !isNaN(parseInt(blockId))) {
        programArea.classList.add('drag-over');
    }
}

function handleInternalDrop(e) {
    e.preventDefault();
    const programArea = document.getElementById('programArea');
    programArea.classList.remove('drag-over');
    
    const blockId = e.dataTransfer.getData('text/plain');
    if (!blockId || isNaN(parseInt(blockId))) return;
    
    // Находим блок, который перетаскиваем
    const draggedBlock = document.querySelector(`[data-block-id="${blockId}"]`);
    if (!draggedBlock) return;
    
    // Находим позицию для вставки
    const blocks = [...programArea.querySelectorAll('.program-block')].filter(b => b !== draggedBlock);
    let insertBefore = null;
    
    for (let block of blocks) {
        const rect = block.getBoundingClientRect();
        const middle = rect.top + rect.height / 2;
        
        if (e.clientY < middle) {
            insertBefore = block;
            break;
        }
    }
    
    // Перемещаем в DOM
    if (insertBefore) {
        programArea.insertBefore(draggedBlock, insertBefore);
    } else {
        programArea.appendChild(draggedBlock);
    }
    
    // Обновляем порядок в данных
    const newOrder = [];
    programArea.querySelectorAll('.program-block').forEach(block => {
        newOrder.push(parseInt(block.dataset.blockId));
    });
    
    // Пересортировываем blocks
    const blocksMap = new Map();
    blockManager.blocks.forEach(b => blocksMap.set(b.id, b));
    
    blockManager.blocks = newOrder.map(id => blocksMap.get(id)).filter(b => b);
}

// Создание зоны удаления
function createDeleteZone() {
    // Удаляем старую зону если есть
    const oldZone = document.querySelector('.delete-zone');
    if (oldZone) oldZone.remove();
    
    // Создаем новую
    const zone = document.createElement('div');
    zone.className = 'delete-zone';
    zone.id = 'deleteZone';
    zone.innerHTML = '🗑️ Перетащите сюда для удаления';
    document.body.appendChild(zone);
    
    // Добавляем обработчики для зоны удаления
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('show');
    });
    
    zone.addEventListener('dragleave', () => {
        zone.classList.remove('show');
    });
    
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('show');
        
        const blockId = e.dataTransfer.getData('text/plain');
        if (blockId && !isNaN(parseInt(blockId)) && blockManager) {
            blockManager.deleteBlock(parseInt(blockId));
            uiManager.renderBlocks();
            uiManager.updateVariablesDisplay();
        }
    });
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
