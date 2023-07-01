/**
 * TLS server 
 * All communications between the server and clients
 * must be secured by private keys & public keys (certs).
 * sends a message to a client 
 * 
 */

// use net module
const tls = require('node:tls');
const fs = require('node:fs');
const path = require('node:path');

const serverOptions = {
  key: fs.readFileSync(path.join(__dirname, "/../https/key.pem")),
  cert: fs.readFileSync(path.join(__dirname , "/../https/cert.pem")),
};

const PORT = 4000;

const server = tls.createServer(serverOptions, (connection)=> {

    const outboundMsg = "pong";

    connection.write(Buffer.from(outboundMsg));
    
    connection.on('data', (inboundMsg)=> {
        console.log( `I wrote ${outboundMsg} and client sent ${inboundMsg}`)
    });

})

server.on('tlsClientError', (err)=> {
    console.log(`Error : `, err);
})


// listens 
server.listen(PORT, ()=> {
    console.log(`Running on port ${PORT}`);
});