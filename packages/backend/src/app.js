const express = require('express');
const parser = require('body-parser');
const config = require('./config');


const app = module.exports = express()

let port = config.port || config.server.port;
if (!port) {
    config.log('No port specified, defaulting to 3000.');
    port = 3000;
}

app.set('port', port);

// Mount middleware
app.use(parser.json());

// To add controllers to the app, add them to the array below
mountControllers(app, [
    require('./members')
]);

/**
 * Mounts an array of controllers onto an express application.
 *
 * Controllers must have the `base` and `router` properties. `base` is a string
 * which specifies the route prefix for the router, and `router` is the express
 * router with all the routes to use.
 *
 * @param {Express.Application} app the express application to mount the controllers on
 * @param {Controller[]} controllers the list of controllers to mount
 */
function mountControllers(app, controllers) {

    if (!(controllers instanceof Array)) throw new Error('controllers must be an array.');

    for (let controller of controllers) {
        if (!controller.base) config.error('No base path provided.');
        if (!controller.router) config.error('No router provided.');

        app.use(controller.base, controller.router);
    }
}
