const assert = require('assert');

describe('config', function() {
    describe('general', function() {
        let config;

        before(function() {
            config = require('../src/config');
        })

        it('Should have requisite values', function() {
            assert(config);
            assert(config.port || config.server.port);
            assert(config.ENV);
            assert(config.isProd)
        })
    });

});
