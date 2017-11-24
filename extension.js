// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode')
const {basename, extname} = require('path')
const DisposableClient = require('./lib/DisposableClient')
const format = require('string-template')
// const DiscordRegisterWin = require('./lib/DiscordRegisterWindows')
var configuration
var client
var isReady = false
var lastFileEditing = ''
var startTimestamp
var contextSave
// const VSCODE_PATH = process.execPath
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate (context) {
  contextSave = context
  configuration = vscode.workspace.getConfiguration('discord')
  console.log(process.version)
  context.subscriptions.push(vscode.commands.registerCommand('discord.updatePresence', updatePresence), vscode.commands.registerCommand('discord.enable', enable), vscode.commands.registerCommand('discord.disable', disable))
  if (!configuration.enable) return
  /* if (process.platform === 'win32') {
    var discordRegister = new DiscordRegisterWin(configuration.clientID, VSCODE_PATH)
    discordRegister.register().then(function () {
      startClient()
    }).catch(err => vscode.window.showErrorMessage('vscode discord registering error: ' + err.message))
  } else */
  startClient()
}
function startClient () {
  client = new DisposableClient({ transport: 'ipc' })
  contextSave.subscriptions.push(client)
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  client.on('ready', () => {
    isReady = true
    console.log('Discord-rpc ready')
    updatePresence()
    setInterval(updatePresence, configuration.interval)
  })
  client.transport.on('close', () => {
    isReady = false
  })
  client.login(configuration.clientID).catch(err => {
    vscode.window.showErrorMessage('Can\'t connect to discord rpc: ' + err.message)
  })
  var previousVersion = contextSave.globalState.get('vscode-discord.isFirstInstall')
  if (!previousVersion) {
    vscode.window.showInformationMessage('Welcome to vscode-discord !')
    contextSave.globalState.update('vscode-discord.isFirstInstall', true)
  }
  var version = vscode.extensions.getExtension('maxerbox.vscode-discord').packageJSON.version
  if (previousVersion !== version) {
    vscode.window.showInformationMessage('Vscode-discord updated!')
    contextSave.globalState.update('vscode-discord.isFirstInstall', version)
  }
}
exports.activate = activate

// this method is called when your extension is deactivated
function deactivate () {
}
exports.deactivate = deactivate

function updatePresence () {
  if (!isReady) return
  if (!vscode.workspace.getConfiguration('discord').get('enable', true)) return
  var debugShow = vscode.debug.activeDebugSession && configuration.showDebug
  var activityObject = {
    smallImageKey: debugShow ? 'debug' : 'vscode',
    smallImageText: debugShow ? configuration.debugIconText : configuration.vscodeIconText
  }
  if (vscode.workspace.name) activityObject.state = format(configuration.state, {projectName: vscode.workspace.name})
  if (vscode.window.activeTextEditor) {
    var filename = basename(vscode.window.activeTextEditor.document.fileName)
    var langId = vscode.window.activeTextEditor.document.languageId
    var ext = extname(filename)
    activityObject.details = format(configuration.details, {filename: filename, language: langId})
    if (lastFileEditing !== filename) {
      if (vscode.workspace.getConfiguration('discord').get('showElapsedTime', true)) {
        startTimestamp = new Date().getTime() / 1000
        activityObject.startTimestamp = startTimestamp
      }
      lastFileEditing = filename
    }
    activityObject.largeImageKey = configuration.iconMap[ext] ? configuration.iconMap[ext] : 'vscode'
    activityObject.largeImageText = format(configuration.languageIconText, {language: vscode.window.activeTextEditor.document.languageId})
    activityObject.startTimestamp = startTimestamp
  } else {
    activityObject.details = configuration.idle
  }
  client.setActivity(activityObject).catch(err => {
    vscode.window.showErrorMessage('Discord-rpc:' + err.message)
  })
}

function enable () {
  let Workspace = vscode.workspace
  let Window = vscode.window
  let folders = Workspace.workspaceFolders
  if (!folders) {
    Window.showWarningMessage('vscode-discord can only be enabled if VS Code is opened on a workspace folder.')
    return
  }
  let disabledFolders = folders.filter(folder => !Workspace.getConfiguration('discord', folder.uri).get('enable', true))
  if (disabledFolders.length === 0) {
    if (folders.length === 1) {
      Window.showInformationMessage('vscode-discord is already enabled in the workspace.')
    } else {
      Window.showInformationMessage('vscode-discord is already enabled on all workspace folders.')
    }
    return
  }
  pickFolder(disabledFolders, 'Select a workspace folder to enable vscode-discord for').then(folder => {
    if (!folder) {
      return
    }
    Workspace.getConfiguration('discord', folder.uri).update('enable', true)
    activate(contextSave)
  })
}
function pickFolder (folders, placeHolder) {
  if (folders.length === 1) {
    return Promise.resolve(folders[0])
  }
  return vscode.window.showQuickPick(folders.map((folder) => { return { label: folder.name, description: folder.uri.fsPath, folder: folder } }), { placeHolder: placeHolder }).then((selected) => {
    if (!selected) {
      return undefined
    }
    return selected.folder
  })
}
function disable () {
  let Workspace = vscode.workspace
  let Window = vscode.window
  let folders = Workspace.workspaceFolders
  if (!folders) {
    Window.showErrorMessage('vscode-discord can only be enabled if VS Code is opened on a workspace folder.')
    return
  }
  let enabledFolders = folders.filter(folder => Workspace.getConfiguration('discord', folder.uri).get('enable', true))
  if (enabledFolders.length === 0) {
    if (folders.length === 1) {
      Window.showInformationMessage('vscode-discord is already disabled in the workspace.')
    } else {
      Window.showInformationMessage('vscode-discord is already disabled on all workspace folders..')
    }
    return
  }
  pickFolder(enabledFolders, 'Select a workspace folder to disabled vscode-discord for').then(folder => {
    if (!folder) {
      return
    }
    if (isReady) client.setActivity({})
    Workspace.getConfiguration('discord', folder.uri).update('enable', false)
  })
}
