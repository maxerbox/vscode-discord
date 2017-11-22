const DiscordRegister = require('./DiscordRegister')
/**
 * Create a discord register for Osx
 * @class DiscordRegisterOsx
 * @extends {DiscordRegister}
 */
class DiscordRegisterOsx extends DiscordRegister {
  register () {
    // eslint-disable-next-line no-unused-vars
    return new Promise((resolve, reject) => {
      // MacOS doesn't need to register either
      resolve()
    })
  }
}
module.exports = DiscordRegisterOsx
