// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

function getRandomInt(max) {
  'Функция рандомного значения. На вход принимает 1 параметр - максимальное значение (то есть диапозон функции от 0 до этого параметра). C помощью функции Math.random()'
  'Получаем случайное дробное значение в пределах от 0 до 1 и умножаем его на максимальное значение, а затем округляем с помощью Math.floor()'
  return Math.floor(Math.random() * max);
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    'Функция принимает на вход переменную context, которая является рабочим пространством для взаимодействия с расширениями VScode'
    'Здесь сначала фильтруются все расширения VScode по наличию тем, затем из каждого нужного расширения записывается название конкретной темы'
    '(x.id или x.label) - айди названия нужной темы; запись ведется в массив AllThemes. После, используя ранее описанную функцию рандома,'
    'мы выбираем из списка случайную тему и изменяем пользовательские настройки VSCode, заменяя исходную тему, на случайно выбранную'
    const themes = vscode.extensions.all.filter(e => e.packageJSON.contributes?.themes)
    
    const AllThemes = []
    themes.forEach(e => {
        const list = e.packageJSON.contributes.themes
        list.forEach(x => {
            const listIdentify = x.id || x.label
            if (listIdentify) {
                AllThemes.push(listIdentify)
            }
        })
    })
    console.log(AllThemes)

    const disposable = vscode.commands.registerCommand('theme-randomizer.random', 
        async function() {
            'Используем асинхронную функцию, в которой сначала получаем рандомную тему'
            'После получаем доступ к изменениям настроек VSCode и далее выводим новую случайную тему, изменяя настройки и уведомляя пользователя о смене темы (с названием новой темы)'
            const RandomTheme = AllThemes[getRandomInt(AllThemes.length)]
            const setting = vscode.workspace.getConfiguration()
            
            console.log(RandomTheme)
            await setting.update('workbench.colorTheme', RandomTheme, true)
            vscode.window.showInformationMessage(
                `Theme ${RandomTheme} is activated`
            )
        }
    );

    const OpenUI = vscode.commands.registerCommand('theme-randomizer.openSettings', () => {
        'Команда для работы с пользовательским интерфейсом, создаем вкладку внутри VS Code, куда будем передавать HTML окно, с которым будет взаимодействовать пользователь'
        'считываем нынешние настройки шрифтов, а затем передаем их в наш HTML файл, который отображаем в созданной плагином вкладке.'
        'Затем идет обработчик действий пользователя в нашей вкладке. Это асинхронная функция, так как запись новых настроек происходит не мгновенно'
        'Чтобы пользователь не видел зависаний используем await, а для этого обязательна асинхронная функция. Считываем изменения и записываем в настройки VS Code'
        const panel = vscode.window.createWebviewPanel('themeSettingsUI', 'Кастомизация VS Code', vscode.ViewColumn.One, { enableScripts: true });

        'Считываем текущие настройки шрифта и его размера, если они не установлены, то используем дефолтные значения'
        const currentFont = vscode.workspace.getConfiguration('editor').get('fontFamily') || 'Consolas';
        const currentFontSize = vscode.workspace.getConfiguration('editor').get('fontSize') || 14;
        
        'Считываем текущие настройки кастомизации цветов темы'
        const currentColorCustomizations = vscode.workspace.getConfiguration('workbench').get('colorCustomizations') || {};
        const currentEditorBg = currentColorCustomizations['editor.background'] || '#130f26';
        const currentSideBarBg = currentColorCustomizations['sideBar.background'] || '#0c0919';
        const currentOuterBarsBg = currentColorCustomizations['activityBar.background'] || '#080612';
        const currentBorderColor = currentColorCustomizations['editorGroup.border'] || '#ff007f';

        panel.webview.html = getWebviewContent(currentFont, currentFontSize, currentEditorBg, currentSideBarBg, currentOuterBarsBg, currentBorderColor);
            panel.webview.onDidReceiveMessage(
            async (message) => {
                const setting = vscode.workspace.getConfiguration();
                
                switch (message.command) {
                    case 'updateFont':
                        'Изменение шрифта'
                        await setting.update('editor.fontFamily', message.fontName, true);
                        vscode.window.showInformationMessage(`Шрифт изменен на: ${message.fontName}`);
                        break;
                        
                    case 'updateFontSize':
                        'Изменение размера шрифта'
                        await setting.update('editor.fontSize', Number(message.fontSize), true);
                        break;

                    case 'updateColor': {
                        const colors = { ...(setting.get('workbench.colorCustomizations') || {}) };
                        'Получаем текущие цвета и обновляем выбранный'
                        if (message.target === 'editorBg') {
                            colors['editor.background'] = message.color;
                            colors['editorGroupHeader.tabsBackground'] = message.color;
                            colors['editorGroupHeader.tabsContainerBackground'] = message.color;
                            colors['tab.activeBackground'] = message.color;
                            colors['tab.inactiveBackground'] = message.color;
                        } else if (message.target === 'sideBarBg') {
                            colors['sideBar.background'] = message.color;
                            colors['sideBarSectionHeader.background'] = message.color;
                        } else if (message.target === 'outerBarsBg') {
                            colors['activityBar.background'] = message.color;
                            colors['titleBar.activeBackground'] = message.color;
                            colors['titleBar.inactiveBackground'] = message.color;
                            colors['statusBar.background'] = message.color;
                            colors['statusBar.noFolderBackground'] = message.color;
                            colors['statusBar.debuggingBackground'] = message.color;
                        } else if (message.target === 'borderColor') {
                            colors['editorGroup.border'] = message.color;
                            colors['sideBar.border'] = message.color;
                            colors['panel.border'] = message.color;
                            colors['activityBar.border'] = message.color;
                            colors['titleBar.border'] = message.color;
                            colors['statusBar.border'] = message.color;
                        }

                        await setting.update('workbench.colorCustomizations', colors, true);
                        break;
                    }
                    
                    case 'resetColors':
                        'Сброс кастомных цветов к дефолтным цветам активной темы'
                        await setting.update('workbench.colorCustomizations', undefined, true);
                        vscode.window.showInformationMessage('Пользовательские цвета сброшены');
                        break;

                    case 'randomTheme':
                        'Запуск зарегистрированной команды рандомайзера'
                        await vscode.commands.executeCommand('theme-randomizer.random');
                        break;
                }
            },
            undefined, 
            context.subscriptions
        );

    })

    'Создаем статусбар, который будет отображаться внизу редактора и при нажатии на него открывать нашу панель кастомизации'
    const StatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    StatusBar.command = 'theme-randomizer.openSettings'; 
    StatusBar.text = `$(gear) Настройки плагина`;
    StatusBar.tooltip = 'Открыть панель кастомизации';
    StatusBar.show();

    context.subscriptions.push(disposable, OpenUI, StatusBar);
    console.log('Congratulations, your extension "theme-randomizer" is now active!');
}

function getWebviewContent(currentFont, currentFontSize, currentEditorBg, currentSideBarBg, currentOuterBarsBg, currentBorderColor) {
    return `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: sans-serif;
                    padding: 24px;
                    color: var(--vscode-foreground);
                    max-width: 820px;
                    margin: 0 auto;
                    box-sizing: border-box;
                }
                h2 {
                    color: var(--vscode-textLink-foreground);
                    margin-bottom: 24px;
                    font-size: 20px;
                }
                .section {
                    margin-bottom: 24px;
                    padding: 20px;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.02);
                }
                .section h3 {
                    margin-top: 0;
                    margin-bottom: 18px;
                    font-size: 16px;
                }
                .row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    margin-bottom: 16px;
                }
                .row:last-child {
                    margin-bottom: 0;
                }
                label {
                    font-weight: 500;
                    flex-shrink: 0;
                }
                .controls {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 320px;
                    justify-content: flex-end;
                }
                input[type="text"] {
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    padding: 8px 12px;
                    border-radius: 4px;
                    width: 100%;
                    box-sizing: border-box;
                }
                input[type="range"] {
                    flex-grow: 1;
                    accent-color: var(--vscode-textLink-foreground);
                }
                input[type="color"] {
                    -webkit-appearance: none;
                    border: none;
                    width: 44px;
                    height: 34px;
                    border-radius: 6px;
                    cursor: pointer;
                    background: transparent;
                    padding: 0;
                }
                input[type="color"]::-webkit-color-swatch-wrapper {
                    padding: 0;
                }
                input[type="color"]::-webkit-color-swatch {
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 6px;
                }
                .value-display {
                    font-size: 14px;
                    min-width: 45px;
                    text-align: right;
                    opacity: 0.85;
                }
                .buttons-group {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-top: 18px;
                }
                .btn {
                    padding: 9px 18px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 500;
                }
                .btn:hover {
                    background: var(--vscode-button-hoverBackground);
                }
            </style>
        </head>
        <body>
            <h2>Панель управления визуалом</h2>
            
            <div class="section">
                <h3>1. Настройка шрифта</h3>
                
                <div class="row">
                    <label for="fontFamily">Шрифт редактора:</label>
                    <div class="controls">
                        <input type="text" id="fontFamily" list="fontsData" value="${currentFont}" onchange="changeFont(this.value)">
                        <datalist id="fontsData">
                            <option value="'Fira Code', monospace"></option>
                            <option value="'JetBrains Mono', monospace"></option>
                            <option value="'Courier New', Courier, monospace"></option>
                            <option value="Consolas, 'Courier New', monospace"></option>
                        </datalist>
                    </div>
                </div>

                <div class="row">
                    <label for="fontSize">Размер шрифта:</label>
                    <div class="controls">
                        <input type="range" id="fontSize" min="10" max="30" value="${currentFontSize}" oninput="changeFontSize(this.value)">
                        <span id="fontSizeValue" class="value-display">${currentFontSize}px</span>
                    </div>
                </div>
            </div>

            <div class="section">
                <h3>2. Кастомизация темы (Цвета и рамки)</h3>
                
                <div class="row">
                    <label for="editorBg">Фон редактора и вкладок:</label>
                    <div class="controls">
                        <input type="color" id="editorBg" value="${currentEditorBg}" onchange="changeColor('editorBg', this.value)">
                    </div>
                </div>

                <div class="row">
                    <label for="sideBarBg">Фон боковой панели:</label>
                    <div class="controls">
                        <input type="color" id="sideBarBg" value="${currentSideBarBg}" onchange="changeColor('sideBarBg', this.value)">
                    </div>
                </div>

                <div class="row">
                    <label for="outerBarsBg">Внешние края (верх, низ, меню):</label>
                    <div class="controls">
                        <input type="color" id="outerBarsBg" value="${currentOuterBarsBg}" onchange="changeColor('outerBarsBg', this.value)">
                    </div>
                </div>

                <div class="row">
                    <label for="borderColor">Цвет рамок и линий:</label>
                    <div class="controls">
                        <input type="color" id="borderColor" value="${currentBorderColor}" onchange="changeColor('borderColor', this.value)">
                    </div>
                </div>

                <div class="buttons-group">
                    <button class="btn" onclick="resetColors()">Сбросить цвета темы</button>
                    <button class="btn" onclick="randomTheme()">Выбрать случайную тему</button>
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();

                function changeFont(fontName) {
                    vscode.postMessage({
                        command: 'updateFont',
                        fontName: fontName
                    });
                }

                function changeFontSize(size) {
                    document.getElementById('fontSizeValue').innerText = size + 'px';
                    vscode.postMessage({
                        command: 'updateFontSize',
                        fontSize: size
                    });
                }

                function changeColor(target, color) {
                    vscode.postMessage({
                        command: 'updateColor',
                        target: target,
                        color: color
                    });
                }

                function resetColors() {
                    vscode.postMessage({
                        command: 'resetColors'
                    });
                }

                function randomTheme() {
                    vscode.postMessage({
                        command: 'randomTheme'
                    });
                }
            </script>
        </body>
        </html>
    `;
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate
}