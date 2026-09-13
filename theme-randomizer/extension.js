// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min));
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
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
			const RandomTheme = AllThemes[getRandomInt(0,AllThemes.length)]
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
