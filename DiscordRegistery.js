const Registry = require('winreg')

class DiscordRegistry extends Registry {
  constructor (clientId, path) {
    super({
      hive: Registry.HKCU,
      key: `\\Software\\Classes\\discord-${clientId}${path}`
    })
  }
}
module.exports = DiscordRegistry
