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

	context.subscriptions.push(disposable);
	console.log('Congratulations, your extension "theme-randomizer" is now active!');
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
