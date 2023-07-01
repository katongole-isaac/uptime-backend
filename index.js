/**
 * Primary file for the App
 * 
 */

const server = require('./lib/server');
const workers = require('./lib/workers');
const cli = require("./lib/cli");

const app = {};

/**
 * For starting the app
 *  - Calls & initializes the server instance
 *  @param cb - used for testing purposes. It invokes the done() 
 */
app.init = function (cb ) {
  // starts the server
  server.init();

  // start the workers
  workers.init();

  // start the cli
  setTimeout(() => {
    cli.init();
    cb();
    
  }, 10);
};

// start only if inovked on command line i.e node index
if (require.main === module) app.init(()=>{});



module.exports = app;