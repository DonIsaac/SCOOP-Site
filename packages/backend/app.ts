const express = require('express');

const exphbs = require('express-handlebars');

const helmet = require('helmet');

const cors = require('cors');

const cookieParser = require('cookie-parser');

const bodyParser = require('body-parser');

const path = require('path');

const config = require('./config/config.js');


module.exports = function scoopMeSomeGoodStuff() {
    const app = express();

    // Things Donathan says to do and can write better comments about later
    // Mount middleware
    app.use(helmet());  // security
    app.use(cors());    // header checking

    // Fresh outta the oven
    app.use(cookieParser());


    app.use(bodyParser.urlencoded({
        extended: true
    }));


    /* TODO
    ********** Static endpoint declarations **********
    *
    */




    // App Constants

    app.set('url', config.server.url);
    app.set('port', config.server.port);

    // Express-handlebars config
    // TODO thees
    var hbs = exphbs({
        extname: '.hbs',
        layoutsDir: path.join(__dirname, '../frontend/views/'),
        partialsDir: path.join(__dirname, 'frontend/views/partials'),

        helpers: {
            // TODO?
        }
    });

    app.set('view engine', '.hbs');
    app.set('views', '../frontend/views');
    app.engine('hbs', hbs);


    // Some endpoints
    app.get('/', (req, res) => {
        res.render('landing-page.hbs', {layouts: false});
    });

    return app;

}