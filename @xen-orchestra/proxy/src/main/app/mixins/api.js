import { format, parse } from 'json-rpc-protocol'

export default class Api {
  construtor (app) {
    app.on('start', async function startApi () {
      this.registerHttpHandler('/api/', async ctx => {
        // TODO
      })
    })
  }
}
