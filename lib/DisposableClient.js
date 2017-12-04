const {Client} = require('discord-rpc')
class DisposableClient extends Client {
  dispose () {
    super.transport.close()
  }
}
module.exports = DisposableClient
