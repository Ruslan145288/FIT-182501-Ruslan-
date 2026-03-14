let blockManager, interpreter, uiManager;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Инициализация...');
    
    blockManager = new BlockManager();
    interpreter = new Interpreter();
    uiManager = new UIManager(blockManager, interpreter);
    
    window.blockManager = blockManager;
    window.interpreter = interpreter;
    window.uiManager = uiManager;
    
    // Палитра блоков
    document.querySelectorAll('.block-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.target.dataset.type);
            e.dataTransfer.effectAllowed = 'copy';
            console.log('Drag start из палитры:', e.target.dataset.type);
        });
    });
    
    uiManager.setupDropZones();
    uiManager.renderBlocks();
    uiManager.updateVariablesDisplay();
    
    createDeleteZone();
});

function createDeleteZone() {
    const oldZone = document.querySelector('.delete-zone');
    if (oldZone) oldZone.remove();
    
    const zone = document.createElement('div');
    zone.className = 'delete-zone';
    zone.id = 'deleteZone';
    zone.innerHTML = '🗑️ Перетащите сюда для удаления';
    document.body.appendChild(zone);
    
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
        console.log('Удаление блока:', blockId);
        
        if (blockId && !isNaN(parseInt(blockId))) {
            blockManager.deleteBlock(parseInt(blockId));
            uiManager.renderBlocks();
            uiManager.updateVariablesDisplay();
        }
    });
}

window.executeProgram = function() {
    interpreter.reset();
    const output = document.getElementById('consoleOutput');
    output.innerHTML = '<span class="prompt">$</span> Выполнение...<br>';
    
    if (!blockManager.validateAllBlocks()) {
        output.innerHTML += '❌ Обнаружены ошибки в блоках. Исправьте их перед выполнением.<br>';
        uiManager.highlightErrors();
        return;
    }
    
    try {
        blockManager.blocks.forEach(block => {
            interpreter.executeBlock(block);
        });
        
        interpreter.output.forEach(line => {
            output.innerHTML += line + '<br>';
        });
        
        uiManager.updateVariablesDisplay();
        output.innerHTML += '<br>✅ Выполнение завершено!';
    } catch (error) {
        output.innerHTML += `❌ Ошибка: ${error.message}`;
    }
    
    uiManager.highlightErrors();
};

window.clearWorkspace = function() {
    if (confirm('Очистить рабочую область?')) {
        blockManager.blocks = [];
        blockManager.blockId = 0;
        interpreter.reset();
        uiManager.renderBlocks();
        uiManager.updateVariablesDisplay();
        document.getElementById('consoleOutput').innerHTML = '<span class="prompt">$</span> Рабочая область очищена';
    }
};

window.clearOutput = function() {
    document.getElementById('consoleOutput').innerHTML = '<span class="prompt">$</span> Готов к выполнению...';
};
