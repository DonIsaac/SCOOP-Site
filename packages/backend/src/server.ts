import http from 'http';
// import http2 from 'http2';

import Config from './config';
import Application from './app';

// Create and get the config singleton
const config = Config.getInstance();
// Inject it into the application
// TODO: Create a module that can support dependency injection (allowing config to be properly injected)
// TODO: Use http2
const app = new Application(config);

// Attach the application to the server and launch the server
http.createServer(app.expose()).listen(app.get('port'));
console.log(`Server listening at port ${app.get('port')}`)


