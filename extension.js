/**

VSCODE Discord Integration
Author: Maxerbox
Git: https://github.com/maxerbox/vscode-discord

**/

const vscode = require('vscode')
const {basename, extname} = require('path')
const DisposableClient = require('./lib/DisposableClient')
const format = require('string-template')


let configuration
let client
let isReady = false
let lastFileEditing = ''
let startTimestamp
let contextSave


function activate (context) {
  contextSave = context
  configuration = vscode.workspace.getConfiguration('discord')
  console.log(process.version)
  context.subscriptions.push(vscode.commands.registerCommand('discord.updatePresence', updatePresence), vscode.commands.registerCommand('discord.enable', enable), vscode.commands.registerCommand('discord.disable', disable), vscode.commands.registerCommand('discord.reconnect', reconnectHandle))
  if (!configuration.enable) return
  startClient()
}


function reconnectHandle () {
  startClient()
}


function startClient () {
  client = null
  client = new DisposableClient({ transport: 'ipc' })
  contextSave.subscriptions.push(client)
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

  let previousVersion = contextSave.globalState.get('vscode-discord.isFirstInstall')
  if (!previousVersion) {
    vscode.window.showInformationMessage('Welcome to vscode-discord !')
    contextSave.globalState.update('vscode-discord.isFirstInstall', true)
  }

  let version = vscode.extensions.getExtension('maxerbox.vscode-discord').packageJSON.version
  if (previousVersion !== version) {
    vscode.window.showInformationMessage('Vscode-discord updated!')
    contextSave.globalState.update('vscode-discord.isFirstInstall', version)
  }
}

exports.activate = activate


function deactivate () {
}

exports.deactivate = deactivate


function getIcon (filename) {
  let icon = configuration.iconMap[filename]
  return icon || configuration.iconMap[extname(filename)]
}


function updatePresence () {
  if (!isReady) return
  if (!vscode.workspace.getConfiguration('discord').get('enable', true)) return
  let debugShow = vscode.debug.activeDebugSession && configuration.showDebug
  let activityObject = {
    smallImageKey: debugShow ? 'debug' : 'vscode',
    smallImageText: debugShow ? configuration.debugIconText : configuration.vscodeIconText
  }
  if (vscode.workspace.name) activityObject.state = format(configuration.state, {projectName: vscode.workspace.name})
  if (vscode.window.activeTextEditor) {
    let filename = basename(vscode.window.activeTextEditor.document.fileName)
    let langId = vscode.window.activeTextEditor.document.languageId
    activityObject.details = format(configuration.details, {filename: filename, language: langId})
    if (lastFileEditing !== filename) {
      if (vscode.workspace.getConfiguration('discord').get('showElapsedTime', true)) {
        startTimestamp = new Date().getTime() / 1000
        activityObject.startTimestamp = startTimestamp
      }
      lastFileEditing = filename
    }
    activityObject.largeImageKey = getIcon(filename) || 'vscode'
    activityObject.largeImageText = format(configuration.languageIconText, {language: vscode.window.activeTextEditor.document.languageId})
    activityObject.startTimestamp = startTimestamp > startTimestamp + 3600 ? startTimestamp = new Date().getTime() / 1000 : startTimestamp
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
