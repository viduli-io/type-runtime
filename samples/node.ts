import events = require('events')

export class Client extends events.EventEmitter {
  config!: Config
}

export type Config = {
  client?: typeof Client
}
