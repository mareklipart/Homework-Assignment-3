const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');
const handlers = require('./handlers');
const helpers = require('./helpers');
const path = require('path');

//---------------- create servers

const server = {};

server.httpServer = http.createServer(function(req,res) {
    server.unifiedServer(req, res);  
});

server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsServerOptions,function(req,res) {
    server.unifiedServer(req, res);  
});

//---------------- server handling
server.unifiedServer = function(req, res) {

    const parsedUrl = url.parse(req.url, true);

    const path = parsedUrl.pathname;

    const trimmedPath = path.replace(/^\/+|\/+$/g,'');

    const method = req.method.toLowerCase();

    const queryStringObject =  parsedUrl.query;

    const headers = req.headers;

    const decoder = new StringDecoder('utf-8');

    let buffer = '';

    req.on('data', data => {
        buffer += decoder.write(data)
    });

    req.on('end', () => {
 
        let chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;
        
        const data = {
            'trimmedPath': trimmedPath,
            'method': method,
            'queryStringObject': queryStringObject,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };

        chosenHandler(data,function(statusCode,payload,contentType){

            // Determine the type of response (fallback to JSON)
            contentType = typeof(contentType) == 'string' ? contentType : 'json';
   
            // Use the status code returned from the handler, or set the default status code to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
   
            // Return the response parts that are content-type specific
            var payloadString = '';
            if(contentType == 'json'){
              res.setHeader('Content-Type', 'application/json');
              payload = typeof(payload) == 'object'? payload : {};
              payloadString = JSON.stringify(payload);
            }
   
            if(contentType == 'html'){
              res.setHeader('Content-Type', 'text/html');
              payloadString = typeof(payload) == 'string'? payload : '';
            }
   
            if(contentType == 'favicon'){
              res.setHeader('Content-Type', 'image/x-icon');
              payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }
   
            if(contentType == 'plain'){
              res.setHeader('Content-Type', 'text/plain');
              payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }
   
            if(contentType == 'css'){
              res.setHeader('Content-Type', 'text/css');
              payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }
   
            if(contentType == 'png'){
              res.setHeader('Content-Type', 'image/png');
              payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }
   
            if(contentType == 'jpg'){
              res.setHeader('Content-Type', 'image/jpeg');
              payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }
   
            // Return the response-parts common to all content-types
            res.writeHead(statusCode);
            res.end(payloadString);

        });
    });
};
//---------------- start servers

server.init = () => {

    server.httpsServer.listen(config.httpsPort, function() {
        console.log(`server is listening on port ${config.httpsPort}`);
    });
    
    server.httpServer.listen(config.httpPort, function() {
        console.log(`server is listening on port ${config.httpPort}`);
    });
    
}

//---------------- routes handle
server.router = { 
    '': handlers.index,
    'public' : handlers.public,
    'api/users': handlers.users,
    'api/tokens': handlers.tokens,
    'api/menu': handlers.menu,
    'api/cart': handlers.cart,
    'api/orders': handlers.orders,
    'account/create' : handlers.accountCreate,
    'session/create' : handlers.sessionCreate,
    'orders/all' : handlers.orderCreate,
    'cart/create' : handlers.cartCreate,
    //'favicon.ico' : handlers.favicon
};

module.exports = server;