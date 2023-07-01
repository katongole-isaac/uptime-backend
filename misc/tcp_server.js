/**
 * TCP server (NET)
 * sends a message to a client 
 * 
 */

// use net module
const net = require('node:net');

const PORT = 4000;

const server = net.createServer((connection)=> {

    const outboundMsg = "pong";

    connection.write(Buffer.from(outboundMsg));
    
    connection.on('data', (inboundMsg)=> {
        console.log( `I wrote ${outboundMsg} and client sent ${inboundMsg}`)
    });

})


// listens 
server.listen(PORT, ()=> {
    console.log(`Running on port ${PORT}`);
});