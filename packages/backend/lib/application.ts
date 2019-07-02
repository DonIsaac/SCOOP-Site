import * as express from 'express'

export class Application {
  private app: express.Application

  constructor() {
    // @ts-ignore
    this.app = express()
  }

  public mount(controller: any): void {
    let base = Reflect.getMetadata('server:base', controller)
    this.app.use(base, controller.router)
  }
}
