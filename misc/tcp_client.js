/**
 * TCP client
 * send a msg back to the server
 *
 */

const net = require("node:net");

const PORT = 4000;

const connectionOpts = {
  port: PORT,
  host: "localhost",
};

const outboundMsg = "ping";

const client = net.createConnection(connectionOpts, () => {
  client.write(outboundMsg);
});


// listen on data
client.on("data", (inboundMsg) => {
  console.log(`I sent ${outboundMsg} and i received ${inboundMsg.toString()}`);
  // end the client
  client.end();
});
