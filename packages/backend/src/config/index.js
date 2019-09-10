const fs = require('fs');
const path = require('path');

let config;

// We don't want multiple imports to cause initialization to happen again
if (!config) {
    let ENV = process.env.NODE_ENV || 'development';

    ENV = ENV.toLowerCase();
    if (ENV !== 'development' && ENV !== 'test' && ENV !== 'production') {
        throw new Error(`Invalid environment "${ENV}". Must be "production", "development", or "test".`);
    }

    let configFile;

    // Load a different config file depending on the environment
    switch (ENV) {
        case 'development':
            configFile = 'config.dev.json';
            break;
        case 'production':
            configFile = 'config.prod.json';
            break;
        case 'test':
            configFile = 'config.test.json';
            break
    }

    configFile = path.join(__dirname, configFile);

    // Attempt to load and parse the config file.
    try {
        config = JSON.parse(fs.readFileSync(configFile, 'utf8'))
    } catch (err) {
        if (ENV === 'production') {
            console.error('Could not read the config file. Make sure it exists and has no syntax errors.');
            process.exit(1);
        } else {
            throw err;
        }
    }

    // Mount extra information and utility methods onto the config object

    config.ENV = ENV;
    config.isProd = function isProd() {
        return this.ENV === 'production';
    }

    config.log = function log(...msg) {
        if (!this.isProd()) {
            console.log(`[${new Date().toISOString()}]`, ...msg)
        }
    }

    config.error = function error(msg) {
        if (this.isProd()) {
            console.error('Error:', msg);
            process.exit(1);
        } else {
            throw new Error(msg);
        }
    }

    if (config.ENV === 'test') {
        console.log('config object:')
        console.dir(config)
    }
}


module.exports = config;
