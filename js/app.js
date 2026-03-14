let blockManager;   
let interpreter;     
let uiManager;      

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Инициализация...');
    
    blockManager = new BlockManager();     
    interpreter = new Interpreter();       
    uiManager = new UIManager(blockManager, interpreter); 
    
    
    window.blockManager = blockManager;
    window.interpreter = interpreter;
    window.uiManager = uiManager;
    
    initDragAndDrop();
    
    uiManager.renderBlocks();           
    uiManager.updateVariablesDisplay();    
});


function initDragAndDrop() {
    // 1.  ПАЛИТРА БЛОКОВ (левую панель)
    document.querySelectorAll('.block-item').forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('drag', (e) => e.preventDefault());
    });

    // 2.  РАБОЧУЮ ОБЛАСТЬ (куда тащим)
    const programArea = document.getElementById('programArea');
    
    programArea.addEventListener('dragover', (e) => {
        e.preventDefault();  
        programArea.classList.add('drag-over'); 
    });
    
    programArea.addEventListener('dragleave', () => {
        programArea.classList.remove('drag-over'); 
    });
    
    programArea.addEventListener('drop', handleDrop);
    
    // 3.  ПЕРЕТАСКИВАНИЕ ВНУТРИ РАБОЧЕЙ ОБЛАСТИ
    programArea.addEventListener('dragover', handleDragOver);
    programArea.addEventListener('drop', handleInternalDrop);
    
    // 4.  ЗОНА УДАЛЕНИЯ 
    createDeleteZone();
}

function handleDragStart(e) {
    if (e.target.classList.contains('block-item')) {
        e.dataTransfer.setData('text/plain', e.target.dataset.type);
        e.dataTransfer.effectAllowed = 'copy';
    }
    
}


//  СБРОСА ИЗ ПАЛ

function handleDrop(e) {
    e.preventDefault(); 
    const programArea = document.getElementById('programArea');
    programArea.classList.remove('drag-over'); 
    
    const blockType = e.dataTransfer.getData('text/plain');
    if (!blockType) return;  
    
    // НОВЫЙ БЛОК в зависимости от типа
    let newBlock;
    switch(blockType) {
        case 'variable-decl':  
            newBlock = blockManager.createBlock(BlockTypes.VARIABLE, { names: '' });
            console.log('✅ Создан блок переменных:', newBlock);
            break;
            
        case 'assignment':     
            newBlock = blockManager.createBlock(BlockTypes.ASSIGNMENT, { variable: '', expression: '' });
            console.log('✅ Создан блок присваивания:', newBlock);
            break;

        case 'array-decl':
            newBlock = blockManager.createBlock(BlockTypes.ARRAY_DECL, { 
                name: '', 
                size: '5',
                initValue: '0' 
            });
            console.log('✅ Создан блок массива:', newBlock);
            break;
    
        case 'array-assign':
            newBlock = blockManager.createBlock(BlockTypes.ARRAY_ASSIGN, { 
                arrayName: '', 
                index: '0', 
                value: '' 
            });
            console.log('✅ Создан блок присваивания массиву:', newBlock);
            break;
            
        case 'if':             
            newBlock = blockManager.createBlock(BlockTypes.IF, { 
                leftExpr: '', 
                operator: '>', 
                rightExpr: '' 
            }, []);
            console.log('✅ Создан блок if:', newBlock);
            break;
            
        case 'arithmetic':      
            newBlock = blockManager.createBlock(BlockTypes.ARITHMETIC, { 
                varName: '',
                leftExpr: '',
                operator: '+',
                rightExpr: ''
            });
            console.log('✅ Создан арифметический блок:', newBlock);
            break;
        case 'while':
            newBlock = blockManager.createBlock(BlockTypes.WHILE, { 
                leftExpr: '', 
                operator: '>', 
                rightExpr: '' 
            }, []); // пустой массив для вложенных блоков
            console.log('✅ Создан блок while:', newBlock);
            break;
    }
    
   
    uiManager.renderBlocks();
}


//  ПЕРЕТАСКИВАНИЯ ВНУТРИ РАБОЧЕЙ ОБЛАСТИ

function handleDragOver(e) {
    e.preventDefault();
    const programArea = document.getElementById('programArea');
    
    const blockId = e.dataTransfer.getData('text/plain');
    if (blockId && !isNaN(parseInt(blockId))) {
        programArea.classList.add('drag-over'); 
    }
}


//  СБРОСА РАБОЧЕЙ ОБЛАСТИ

function handleInternalDrop(e) {
    e.preventDefault();
    const programArea = document.getElementById('programArea');
    programArea.classList.remove('drag-over');
    
    const blockId = e.dataTransfer.getData('text/plain');
    if (!blockId || isNaN(parseInt(blockId))) return;
    
    const draggedBlock = document.querySelector(`[data-block-id="${blockId}"]`);
    if (!draggedBlock) return;
    
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
    
    if (insertBefore) {
        programArea.insertBefore(draggedBlock, insertBefore); 
    } else {
        programArea.appendChild(draggedBlock); 
    }
    
    const newOrder = [];
    programArea.querySelectorAll('.program-block').forEach(block => {
        newOrder.push(parseInt(block.dataset.blockId));
    });
    
    const blocksMap = new Map();
    blockManager.blocks.forEach(b => blocksMap.set(b.id, b));
    
    blockManager.blocks = newOrder.map(id => blocksMap.get(id)).filter(b => b);
    console.log('📋 Новый порядок блоков:', blockManager.blocks);
}


//  ЗОНА УДАЛЕНИЯ

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
        if (blockId && !isNaN(parseInt(blockId)) && blockManager) {
        
            blockManager.deleteBlock(parseInt(blockId));
            
            uiManager.renderBlocks();
            uiManager.updateVariablesDisplay();
            console.log('🗑️ Блок удален');
        }
    });
}


//  кнопка "Запустить"
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
        uiManager.highlightError();  // Подсвечиваем проблемный блок
    }
}


// ОЧИСТКА РАБОЧЕЙ 

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


// ОЧИСТКА ВЫВОДА

window.clearOutput = function() {
    document.getElementById('consoleOutput').innerHTML = '<span class="prompt">$</span> Готов к выполнению...';
}
