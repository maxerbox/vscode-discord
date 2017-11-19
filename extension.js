// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode')
const {Client} = require('discord-rpc')
const DiscordRegistry = require('./DiscordRegistery')
const {basename, extname} = require('path')
const Registry = require('winreg')
const {promisifyAll} = require('bluebird')
const format = require('string-template')
var configuration
var client
var isReady = false
var lastFileEditing = ''
var startTimestamp
var contextSave
const VSCODE_PATH = process.execPath
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate (context) {
  contextSave = context
  configuration = vscode.workspace.getConfiguration('discord')
  context.subscriptions.push(vscode.commands.registerCommand('discord.updatePresence', updatePresence), vscode.commands.registerCommand('discord.enable', enable), vscode.commands.registerCommand('discord.disable', disable))
  if (!configuration.enable) return
  setUpReg().then(function () {
    client = new Client({ transport: 'ipc' })
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    client.on('ready', () => {
      isReady = true
      vscode.workspace.onDidChangeTextDocument = updatePresence
      process.on('beforeExit', () => {
        if (isReady) client.setActivity({})
      })
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
    if (!context.globalState.get('vscode-discord.isFirstInstall')) {
      vscode.window.showInformationMessage('Welcome to vscode-discord !')
      context.globalState.update('vscode-discord.isFirstInstall', true)
    }
  })
}
exports.activate = activate

// this method is called when your extension is deactivated
function deactivate () {
}
exports.deactivate = deactivate

function createRegistery (path) {
  return promisifyAll(new DiscordRegistry(configuration.clientID, path))
}
function setUpReg () {
  return new Promise((resolve, reject) => {
    const regKey = createRegistery('')
    const iconKey = createRegistery('\\DefaultIcon')
    const openKey = createRegistery('\\shell\\open\\command')
    regKey.keyExistsAsync().then(exist => {
      if (exist) {
        resolve()
        return
      }
      regKey.createAsync().then(regKey.setAsync(Registry.DEFAULT_VALUE, 'REG_SZ', `URL:Run game ${configuration.clientID} protocol`)).then(regKey.setAsync('URL Protocol', 'REG_SZ', '')).then(iconKey.createAsync()).then(iconKey.setAsync(Registry.DEFAULT_VALUE, 'REG_SZ', VSCODE_PATH)).then(openKey.createAsync()).then(openKey.setAsync(Registry.DEFAULT_VALUE, 'REG_SZ', VSCODE_PATH)).then(resolve).catch(reject)
    }).catch(reject)
  })
}
function updatePresence () {
  if (!isReady) return
  if (!vscode.workspace.getConfiguration('discord').get('enable', true)) return
  var activityObject = {
    smallImageKey: 'vscode',
    smallImageText: configuration.vscodeIconText
  }
  if (vscode.workspace.name) activityObject.state = format(configuration.state, {projectName: vscode.workspace.name})
  if (vscode.window.activeTextEditor) {
    var filename = basename(vscode.window.activeTextEditor.document.fileName)
    var ext = extname(filename)
    activityObject.details = format(configuration.details, {filename: filename, language: vscode.window.activeTextEditor.document.languageId})
    if (lastFileEditing !== filename) {
      startTimestamp = new Date().getTime() / 1000
      activityObject.startTimestamp = startTimestamp
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
