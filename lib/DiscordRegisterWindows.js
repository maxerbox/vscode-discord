const DiscordRegistry = require('./DiscordRegistery')
const DiscordRegister = require('./DiscordRegister')
const Registry = require('winreg')
const {promisifyAll} = require('bluebird')
/**
 * Register vscode for windows
 * @class DiscordRegisterWin
 */
class DiscordRegisterWin extends DiscordRegister {
  register () {
    return new Promise((resolve, reject) => {
      const regKey = this.createRegistery('')
      const iconKey = this.createRegistery('\\DefaultIcon')
      const openKey = this.createRegistery('\\shell\\open\\command')
      regKey.keyExistsAsync().then(exist => {
        if (exist) {
          resolve()
          return
        }
        regKey.createAsync().then(regKey.setAsync(Registry.DEFAULT_VALUE, 'REG_SZ', `URL:Run game ${this.clientID} protocol`)).then(regKey.setAsync('URL Protocol', 'REG_SZ', '')).then(iconKey.createAsync()).then(iconKey.setAsync(Registry.DEFAULT_VALUE, 'REG_SZ', this.appPath)).then(openKey.createAsync()).then(openKey.setAsync(Registry.DEFAULT_VALUE, 'REG_SZ', this.appPath)).then(resolve).catch(reject)
      }).catch(reject)
    })
  }
  createRegistery (path) {
    return promisifyAll(new DiscordRegistry(this.clientID, path))
  }
  unregister () {
    return new Promise((resolve, reject) => {
      const regKey = this.createRegistery('')
      regKey.destroyAsync().then(resolve).catch(reject)
    })
  }
}
module.exports = DiscordRegisterWin
