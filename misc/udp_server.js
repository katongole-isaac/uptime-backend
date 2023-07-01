/**
 * UDP server 
 * listen on port 4000
 * 
 */

const udp = require('node:dgram');

const PORT =  4000;

// udp server for ipv4 sockets 
const server = udp.createSocket('udp4');

server.on('error', (err)=> {
    console.log(`\x1b[31m %s \x1b[0m`, err);
    server.close();
})

server.on('message', (msgBuffer) => {
    console.log(`Msg: %s`, msgBuffer.toString());
})

server.on('listening',()=> {
    console.log(`Listening on port ${PORT}`);
})

// bind the server to a port
// and it starts listening for conn(s)
server.bind(PORT);