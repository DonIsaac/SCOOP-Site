/*
 * Server file for the node server.
 * Loads the express app and starts listening on the
 * port specified in config.ts
 */

// Import the factory function and pass in the config object, storing the
// created app as 'app'
const app = require('./app.js')(require('./config/config.ts'))

// Launch the server
let server = app.listen(app.get('port'), () => {
    let host = server.address().address;
    let port = server.address().port;

   	console.log(__dirname);
    console.log(`App listening at http://localhost:${port}`);
});
