const config = require('./config')
const app = require('./app')

app.listen(app.get('port'), () => {
    console.log(`${config.ENV} server listening at port ${app.get('port')}.`);
})
