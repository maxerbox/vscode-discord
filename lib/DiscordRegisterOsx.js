const DiscordRegister = require('./DiscordRegister')
/**
 * Create a discord register for Osx
 * @class DiscordRegisterOsx
 * @extends {DiscordRegister}
 */
class DiscordRegisterOsx extends DiscordRegister {
  register () {
    return new Promise((resolve, reject) => {
      reject(new Error('Not available yet'))
    })
  }
}
module.exports = DiscordRegisterOsx
