const DiscordRegister = require('./DiscordRegister')
/**
 * Create a discord register for Linux
 * @class DiscordRegisterLinux
 * @extends {DiscordRegister}
 */
class DiscordRegisterLinux extends DiscordRegister {
  register () {
    // eslint-disable-next-line no-unused-vars
    return new Promise((resolve, reject) => {
      // Linux doesn't need to register
      resolve()
    })
  }
}
module.exports = DiscordRegisterLinux
