/**
 * http 2 client
 *
 */

const http2 = require("node:http2");

const serverUrl = `http://localhost:4000`;

const client = http2.connect(serverUrl);

// composing the request
const req = client.request({
  ":path": "/",
});


let data = ""

// upon recieving any data
req.on('data', (chunk)=> {
    data += chunk;
})

// when there's no more data to be recieved
req.on('end', ()=> {
    console.log('Data: %s',data);
    client.close();
})

// send the request
req.end();