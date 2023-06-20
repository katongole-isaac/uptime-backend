/**
 * Primary file for the App
 * 
 */

const server = require('./lib/server');
const workers = require('./lib/workers');

const app = {};

/**
 * For starting the app
 *  - Calls & initializes the server instance
 * 
 */
app.init = function () {
    // starts the server
    server.init();

    // start the workers
    workers.init();
}


app.init();



module.exports = app;