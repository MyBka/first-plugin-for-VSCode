# Плагин: Theme Randomizer
Основная идея плагина, *как следует из названия*, заключается в случайном выборе темы для VSCode.
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

### Описание создания плагина:
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

## 4 Проверка
Сочетанием клавиш "Ctrl + Shift + D" открываем раздел "Запуск И Отладка" и нажимаем на соответствующую кнопку, в панели команд выбираем открыть в VSCode. Откроется новое окно VSCode, нажимаем на панель команд (Ctrl + Shift + P) и пишем ">Randomizer", после этого должна отобразиться новая тема и уведомление об её смене.