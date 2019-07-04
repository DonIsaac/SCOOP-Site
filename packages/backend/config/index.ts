import {PathLike, readFileSync} from 'fs';
import config from '../config';
import path from 'path';

export interface ServerConfig {
  port: number;
}

export interface ViewsConfig {
  /** Directory of handlebars partials */
  partialsDir: PathLike;

  /** Directory of handlebars layouts */
  layoutsDir: PathLike;
}

export interface DatabaseConfig {
  /** URL to MongoDB */
  url: string;
}

/**
 * Application configuration data.
 */
export default class Config {
  private static instance: Config;

  public server: ServerConfig;
  public views: ViewsConfig;
  public db: DatabaseConfig;
  public root: string;

  /**
   * Creates a new Config instance. This should only be called once, and should only
   * be used by the `getInstance` method, as this class defines/contains a singleton.
   *
   * @param env the  environment to launch the server in
   */
  private constructor(env: 'production' | 'development' | 'test' | string) {
    let configFileName;
    // TODO: create a resolveRoot() method that looks for tsconfig.json
    this.root = path.resolve(__dirname, '..');

    switch (env) {
      case 'production':
        configFileName = 'config.prod.json';
        break;
      case 'development':
        configFileName = 'config.dev.json';
        break;
      case 'test':
        configFileName = 'config.test.json';
        break;
      default:
        throw new Error('Illegal environment name.');
    }

    let configData = JSON.parse(readFileSync(path.join(__dirname, configFileName), 'utf-8'));

    let { server, views, db} = configData;
    this.server = server;
    this.views = views;
    this.db = db;
  }
  /**
   * Gets a reference to the Config singleton.
   */
  public static getInstance(): Config {
    if (!Config.instance)
      Config.instance = new Config(process.env.NODE_ENV || 'production');

    return Config.instance;
  }
}
