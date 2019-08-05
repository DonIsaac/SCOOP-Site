import cors from 'cors';
import helmet from 'helmet';
import express from 'express';
import handlebars from 'express-handlebars';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import path from 'path';
import 'reflect-metadata';

import Config from "./config";
import { Endpoint } from './lib'

/**
 * An Application is a wrapper for an express Application.
 */
export default class Application {
  private app: express.Application;
  private config: Config;

  public constructor(config: Config){
    this.app = express();
    this.config = config;

    this.initialize()
  }

  /**
   * Initializes server settings and data.
   */
  private initialize(): void {
    this.app.set('port', this.config.server.port);

    let hbs = handlebars({
      extname: '.hbs',
      layoutsDir: path.join(__dirname, '../frontend/views/'),
      partialsDir: path.join(__dirname, 'frontend/views/partials'),

      helpers: {
        // TODO?
      }
    });

    this.app.set('view engine', '.hbs');
    this.app.engine('hbs', hbs);

    this.mountMiddleware();
  }

  /**
   * Mounts middleware to the express application.
   * Called during initialization.
   */
  private mountMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(cookieParser());
    this.app.use(bodyParser.json());
  }

  /**
   * Gets a stored value from the Application's storage map.
   * @param key the key the value is stored under
   */
  public get(key: string): any {
    return this.app.get(key);
  }

  /**
   * Stores a value in the Application's storage map.
   * @param key the key the value is stored under
   * @param value the value to store
   *
   * @returns a pointer to the current Application for method chaining
   */
  public set(key: string, value: any): Application {
    this.app.set(key, value);
    return this;
  }

  public mount(controller: NewableFunction): Application {
    let base: string = Reflect.getMetadata('ctl:base', controller);
    if (!base) throw new Error('Attempted to mount a non-controller.');

    let endpoints: Endpoint[] = Reflect.getMetadata('ctl:endpoints', controller);

    return this;
  }

  /**
   * Gets the internal express application. This allows for the application
   * to be bootstrapped to a server.
   *
   * @returns the internal express application instance
   */
  public expose(): express.Application {
    return this.app;
  }
}
