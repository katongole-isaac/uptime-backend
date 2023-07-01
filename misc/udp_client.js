/**
 * UDP client 
 * sends a message to udp server
 * 
 */

const udp = require('node:dgram');

const PORT = 4000 ;
const address = "localhost"

const client = udp.createSocket('udp4');

const msg = "This is the message i have sent";


client.send(Buffer.from(msg), PORT,address,(err) => {
    console.log(`Error`, err);
    client.close();
} );

