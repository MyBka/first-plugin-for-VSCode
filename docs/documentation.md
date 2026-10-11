# Плагин: Theme Customizer
Основная идея плагина, *как следует из названия*, заключается в кастомизации шрифтов и тем для VSCode.
**Что для этого потребовалось сделать?**

## 1. Скачиваем шаблон
Для этого последовательно вводим команды в терминал
```npm install -g yo generator-code```
```yo code```
После ввода второй команды придется настроить свой шаблон через встроенные в команду вопросы.
Вот ответы для того, чтобы создать **идентичный данному проекту** шаблон:
```
✓ What type of extension do you want to create? New Extension (JavaScript)
✓ What's the name of your extension? theme-randomizer
✓ What's the identifier of your extension? theme-randomizer
✓ What's the description of your extension? first plugin for vscode
✓ Enable JavaScript type checking in 'jsconfig.json'? Yes
✓ Initialize a git repository? Yes
✓ Which package manager to use? npm
```

## 2. Настройка шаблона
В основном идет работа с файлом `extension.js`, вот его шаблон:
```
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "theme-randomizer" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('theme-randomizer.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from theme-randomizer!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
```

Хоть 90% работы будет с этим шаблоном, настроить другие файлы тоже нужно. 
```const disposable = vscode.commands.registerCommand('theme-randomizer.helloWorld', function ())```
Наша же функция должна соответствовать названию плагина, поэтому исправим `theme-randomizer.helloWorld` на `theme-randomizer.random`

Файл `package.json` выполняет роль манифеста плагина. Раздел `contributes` регистрирует нашу команду в системе (это декларативное расширение IDE), а `activationEvents` указывает на событие активации (в нашем случае — вызов команды пользователем), что позволяет IDE использовать ленивую загрузку и не тратить память зря до тех пор, пока плагин не понадобится
```
"activationEvents": [
  "onCommand:theme-randomizer.random"
],
"main": "./extension.js",
"contributes": {
  "commands": [{
    "command": "theme-randomizer.random",
    "title": "Randomizer"
  }]
},
```
Всё, оставшуюся часть работаем с файлом `extension.js`

## 3. Структура плагина

### Объяснение встроенных функций, переменных и т.д.
`const vscode = require('vscode')` - подключаем инструменты самой VScode 

`function activate(context)` - Основная функция плагина
Здесь, мы пишем код к плагину и активируем его

`function deactivate()` - Функция выключения плагина, но ей пользоваться в процессе разработки не придётся, ведь плагин автоматически отключается при закрытии программы,
```
/**
 * @param {vscode.ExtensionContext} context
 */ 
```
Встроенный комментарий, который дает JS понять, какой тип данных будет передаваться в функцию
`vscode.ExtensionContext` - Тип данных параметра, который является объектом контекста расширения для VS Code
Параметр `context` (*тип vscode.ExtensionContext*) — это важнейший объект, который IDE передает плагину. Он управляет жизненным циклом плагина. Через `context.subscriptions.push(disposable)` мы регистрируем нашу команду в системе, чтобы VS Code корректно освободил память и удалил команду при закрытии программы

### Описание создания рандомайзера темы:
В константу `themes` записываем **ВСЕ** значения тем с помощью фильтра:
`const themes = vscode.extensions.all.filter(e => e.packageJSON.contributes?.themes)`
Но этого мало, ведь переменная `themes`, хранит в себе не конкретно название темы, а весь объект, одним из элементов которого является раздел темы, именно этот раздел мы забираем с помощью `forEach` и записываем уже названия конкретных тем в новый массив `AllThemes`.
```
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
``` 
(*Далее я вывожу через консоль массив, чтобы убедиться, что туда действительно переходят только названия тем*)

С помощью функции `disposable` из шаблона мы создаем **асинхронную** функцию для отображения новой темы и уведомления об этом пользователя
Для этого с помощью отдельно созданной функции `getRandomInt` случайно выбираем индекс темы (*из массива AllThemes*).
Переменная `setting` - `const setting = vscode.workspace.getConfiguration()` позволяет изменять текущие настройки VSCode, а `setting.update` - `await setting.update('workbench.colorTheme', RandomTheme, true)` проводит изменения переходя на случайно выбранную тему и после завершения процесса пользователь видит на экране название случайно выбранной темы.

### Описание создания пользовательского интерфейса
UI будет состоять из двух глобальных блоков:
1. Выбор шрифта и его размера
2. Кастомизация темы (либо выбор на рандом).
*За пользовательский интерфейс отвечает константа OpenUI*

В первую очередь создаем панель, в которой после будет располагаться наш UI: 
`const panel = vscode.window.createWebviewPanel('themeSettingsUI', 'Кастомизация VS Code', vscode.ViewColumn.One, { enableScripts: true });`

Затем, считываем текущие настройки (шрифт, его размер и параметры активной темы), если они не выставлены, ставим значения по умолчанию:
```
const currentFont = vscode.workspace.getConfiguration('editor').get('fontFamily') || 'Consolas';
const currentFontSize = vscode.workspace.getConfiguration('editor').get('fontSize') || 14; 

const currentColorCustomizations = vscode.workspace.getConfiguration('workbench').get('colorCustomizations') || {};
const currentEditorBg = currentColorCustomizations['editor.background'] || '#130f26';
const currentSideBarBg = currentColorCustomizations['sideBar.background'] || '#0c0919';
const currentOuterBarsBg = currentColorCustomizations['activityBar.background'] || '#080612';
const currentBorderColor = currentColorCustomizations['editorGroup.border'] || '#ff007f';
```

Теперь загружаем HTML-страницу внутрь созданной вкладки плагина:
`panel.webview.html = getWebviewContent(currentFont, currentFontSize, currentEditorBg, currentSideBarBg, currentOuterBarsBg, currentBorderColor);`

`panel.webview.onDidReceiveMessage(async (message) => { ... })` - Это функция, которая считывает сообщения от пользователя при взаимодействии с HTML-страницей.
По скольку за один раз пользователь делает максимум одно сообщение, мы эту функцию можем реализовать при помощи `switch`, где все разбито на кейсы (все возможные действия пользователя).
Поскольку HTML-окно изолировано, оно не может напрямую менять настройки VS Code. Когда пользователь двигает ползунок или выбирает цвет, JavaScript внутри HTML отправляет "сообщение" (пакет данных) в этот основной скрипт. Скрипт принимает объект message, в котором всегда есть строка message.command — имя действия.
Поскольку все эти действия и изменения настроек VS Code требуют времени, мы используем асинхронную функцию, чтобы не вызвать сбоев.
Вновь переменная `setting` - `const setting = vscode.workspace.getConfiguration()` позволяет изменять текущие настройки VSCode.

Далее, в зависимости от команды, переданной от HTML окна в основной скрипт, выполняется определенный кейс (смена шрифта, размера, параметров темы).
**Итоговые кейсы выглядят следующим образом:**
```
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
```

### Описание создания статус бара (кнопка для активации HTML-окна)
`const StatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);` - создаем кнопку в левой нижней панели VS Code
`StatusBar.command = 'theme-randomizer.openSettings';` - Активация команды при нажатии
`StatusBar.text = `$(gear) Настройки плагина`;` - Текст, отображаемый на этой кнопке
`StatusBar.tooltip = 'Открыть панель кастомизации';` - Текст, отображаемый при наведении на эту кнопку
`StatusBar.show();` - Отображаение кнопки

### HTML-код
Интерфейс представляет собой **изолированное Webview-окно** внутри VS Code. Настройка внешнего вида построена на динамической подстановке текущих параметров пользователя при инициализации и мгновенной передаче новых изменений обратно в ядро расширения через встроенный API сообщений.

#### Стилизация (CSS)
* **Интеграция с темой VS Code:** Вместо жестко заданных цветов в стилях активно используются **системные CSS-переменные VS Code** (такие как `var(--vscode-foreground)`, `var(--vscode-input-background)`, `var(--vscode-button-background)`). Благодаря этому интерфейс плагина автоматически подстраивается под любую активную тему редактора (*светлую, темную, высококонтрастную*).
* **Стилизация Color Picker:** Стандартные элементы `input[type="color"]` переопределены через псевдоэлементы движка WebKit (`::-webkit-color-swatch`). Это позволило убрать дефолтные рамки браузера, скруглить углы (`border-radius: 6px`) и сделать палитру выбора цвета аккуратной и минималистичной.

#### Разметка (HTML)
* **Динамическая инициализация данных:** Значения атрибутов `value` у всех элементов ввода (`input`) не прописаны вручную. Они интерполируются через переменные JavaScript (`${currentFont}`, `${currentFontSize}` и т.д.) в момент генерации строки. Это гарантирует, что при открытии плагина пользователь увидит свои текущие настройки.
* **Выпадающий список шрифтов:** Для поля ввода шрифта используется связка `input type="text"` и тега `datalist`. Это позволяет пользователю как выбрать один из четырех предустановленных популярных шрифтов разработки (Fira Code, JetBrains Mono и др.), так и написать название любого своего системного шрифта вручную.

#### Логика (JavaScript / Скрипт взаимодействия)
Интерфейс не имеет прямого доступа к файловой системе или настройкам VS Code. Вся логика построена на **асинхронном мосте обмена сообщениями**:

1. **`acquireVsCodeApi()`** — специальный метод, который инициализирует закрытый контекст связи с основным процессом расширения.
2. **Отправка команд с параметрами (`vscode.postMessage`)** — при каждом действии пользователя (выбор шрифта, сдвиг ползунка размера, изменение цвета в палитре) срабатывают inline-функции (`changeFont`, `changeFontSize`, `changeColor`), которые упаковывают данные в JSON-объект и отправляют его в `extension.js`.
3. **Оптимизация UI (`changeFontSize`)** — при изменении размера шрифта функция не только шлет сообщение в VS Code, но и мгновенно обновляет текстовый индикатор `span` на экране (`size + 'px'`), обеспечивая плавный визуальный отклик для пользователя.
4. **Делегирование глобальных команд (`resetColors` и `randomTheme`)** — в отличие от функций изменения шрифта или цвета, эти функции не передают никаких дополнительных параметров (payload). Они отправляют в `extension.js` исключительно строковый идентификатор команды в поле `command`:
   * Функция `resetColors()` сообщает главному процессу расширения о необходимости стереть объект `workbench.colorCustomizations`.
   * Функция `randomTheme()` просит ядро плагина вызвать зарегистрированную в VS Code команду `theme-randomizer.random`.


## 4 Проверка
Сочетанием клавиш "Ctrl + Shift + D" открываем раздел "Запуск И Отладка" и нажимаем на соответствующую кнопку, в панели команд выбираем открыть в VSCode. Откроется новое окно VSCode. В левом нижнем углу находим кнопку: **Настройки плагина** и кастомизируем настройки под свое усмотрение
