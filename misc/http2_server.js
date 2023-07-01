/**
 * Http 2 server
 *  listens on port 4000
 */

const http2 = require("node:http2");

// create server
const PORT = 4000;

const server = http2.createServer();

server.on("stream", (stream, headers) => {

  stream.respond({
    "content-type": "text/html",
    status: 200,
  });


  stream.end(`
    <html>
        <body>
            <h1> Http 2 Server </h1>
        </body>
    </html>
  
  `);
});

// server listern
server.listen(PORT);