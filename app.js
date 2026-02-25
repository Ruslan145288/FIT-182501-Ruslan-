const blockManager = new BlockManager();
const interpreter = new Interpreter();
const uiManager = new UIManager(blockManager, interpreter);

window.uiManager = uiManager;

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.block-item').forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
    });

    document.getElementById('programArea').addEventListener('dragover', (e) => e.preventDefault());
    document.getElementById('programArea').addEventListener('drop', handleDrop);
});

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.type);
}

function handleDrop(e) {
    e.preventDefault();
    const blockType = e.dataTransfer.getData('text/plain');
    blockManager.createBlock(blockType);
    uiManager.renderBlocks();
}

window.executeProgram = function() {
    interpreter.reset();
    const consoleOutput = document.getElementById('consoleOutput');
    consoleOutput.innerHTML = '';

    try {
        blockManager.blocks.forEach(block => {
            blockManager.validateBlock(block);
            interpreter.executeBlock(block);
        });

        interpreter.output.forEach(line => {
            consoleOutput.innerHTML += line + '<br>';
        });

        uiManager.updateVariablesDisplay();
        consoleOutput.innerHTML += '<br>✅ Выполнение завершено успешно!';
    } catch (error) {
        consoleOutput.innerHTML += `❌ Ошибка: ${error.message}`;
        uiManager.highlightError();
    }
}

window.clearProgram = function() {
    blockManager.blocks = [];
    blockManager.blockId = 0;
    interpreter.reset();
    uiManager.renderBlocks();
    uiManager.updateVariablesDisplay();
    document.getElementById('consoleOutput').innerHTML = '> Программа очищена';
}