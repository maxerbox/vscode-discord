const {Client} = require('discord-rpc')
class DisposableClient extends Client {
  dispose () {
    super.setActivity({'detail': ''}).catch((err) => console.log(err)).then(() => {
      console.log('Activity reset')
    })
  }
}
module.exports = DisposableClient
