/**
 * Primary file for the App
 * 
 */

const cluster = require("node:cluster");
const os = require("node:os");

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

  if (cluster.isPrimary) {
    // start the workers
    workers.init();

    // start the cli
    setTimeout(() => {
      cli.init();
      cb();
    }, 10);

    // spawn child process
    // based on the available cpu core
    for (let i = 0; i < os.cpus().length; i++) {
      cluster.fork();
    }


  } else {

    // starts the server
    server.init();


  }

};

// start only if inovked on command line i.e node index
if (require.main === module) app.init(()=>{});



module.exports = app;