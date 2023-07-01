/**
 * TLS client
 * Should have a cert (public key for the server )
 * send a msg back to the server
 *
 */


const tls = require('node:tls');
const fs = require('node:fs');
const path = require('node:path');

const serverOptions = {
  ca: fs.readFileSync(path.join(__dirname , "/../https/cert.pem")),
};

const PORT = 4000;

const outboundMsg = "ping";

const client = tls.connect(PORT , serverOptions, () => {
  client.write(outboundMsg);
});


// listen on data
client.on("data", (inboundMsg) => {
  console.log(`I sent ${outboundMsg} and i received ${inboundMsg.toString()}`);
  // end the client
  client.end();
});
