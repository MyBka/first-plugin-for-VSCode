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

		const currentFont = vscode.workspace.getConfiguration('editor').get('fontFamily') || 'Consolas';
        const currentFontSize = vscode.workspace.getConfiguration('editor').get('fontSize') || 14;

		panel.webview.html = getWebviewContent(currentFont, currentFontSize);

		panel.webview.onDidReceiveMessage(
            async (message) => {
                'Обработчик всех действий пользователя (изменение стиля и размера шрифта), используем switch, так как в одно время пользователь может изменить только 1 параметр'
                const setting = vscode.workspace.getConfiguration();
                
                switch (message.command) {
                    case 'updateFont':
                        await setting.update('editor.fontFamily', message.fontName, true);
                        vscode.window.showInformationMessage(`Шрифт изменен на: ${message.fontName}`);
                        break;
                        
                    case 'updateFontSize':
                        await setting.update('editor.fontSize', Number(message.fontSize), true);
                        break;
                }
            },
            undefined,
            context.subscriptions
        );
	})

	const StatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    StatusBar.command = 'theme-randomizer.openSettings'; // Привязали к открытию UI
    StatusBar.text = `$(gear) Настройки плагина`;
    StatusBar.tooltip = 'Открыть панель кастомизации';
    StatusBar.show();

	context.subscriptions.push(disposable, OpenUI, StatusBar);
	console.log('Congratulations, your extension "theme-randomizer" is now active!');
}

function getWebviewContent(currentFont, currentFontSize) {
    return `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: sans-serif; padding: 20px; color: var(--vscode-foreground); }
                h2 { color: var(--vscode-textLink-foreground); }
                .section { margin-bottom: 25px; padding: 15px; border: 1px solid var(--vscode-panel-border); border-radius: 5px; }
                label { display: block; margin-bottom: 8px; font-weight: bold; }
                input, select { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 8px; border-radius: 4px; width: 100%; max-width: 300px; box-sizing: border-box; }
                .flex-group { display: flex; gap: 15px; align-items: center; }
                .value-display { font-size: 14px; opacity: 0.8; }
            </style>
        </head>
        <body>
            <h2>Панель управления визуалом</h2>
            
            <СЕКЦИЯ: ШРИФТЫ>
            <div class="section">
                <h3>1. Настройка шрифта</h3>
                
                <div style="margin-bottom: 15px;">
                    <label for="fontFamily">Выберите из списка или введите свой шрифт:</label>
                    <input type="text" id="fontFamily" list="fontsData" value="${currentFont}" onchange="changeFont(this.value)">
                    
                    <datalist id="fontsData">
                        <option value="'Fira Code', monospace"></option>
                        <option value="'JetBrains Mono', monospace"></option>
                        <option value="'Courier New', Courier, monospace"></option>
                        <option value="Consolas, 'Courier New', monospace"></option>
                    </datalist>
                </div>

                <div>
                    <label for="fontSize">Размер шрифта:</label>
                    <div class="flex-group">
                        <input type="range" id="fontSize" min="10" max="30" value="${currentFontSize}" oninput="changeFontSize(this.value)">
                        <span id="fontSizeValue" class="value-display">${currentFontSize}px</span>
                    </div>
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
