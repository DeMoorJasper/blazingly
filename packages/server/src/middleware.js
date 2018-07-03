// Node modules
const url = require('url');
const path = require('path');
const fs = require('fs');

// Local modules
const preRender = require('./request-handler/prerender');
const rawFile = require('./request-handler/rawFile');

let redirects = {};

function registerMiddleware(options) {
  try {
    redirects = JSON.parse(fs.readFileSync(path.join(options.outDir, 'redirects.json'), 'utf-8'));
  } catch (e) { }

  return async function middleware(req, res) {
    let parsedUrl = url.parse(req.url);

    let redirect = redirects[parsedUrl.pathname];
    if (redirect) {
      parsedUrl.pathname = redirect;
    }

    let startTime = Date.now();
    try {
      if (path.extname(parsedUrl.pathname)) {
        await rawFile(req, res, parsedUrl, options)
      } else {
        await preRender(req, res, parsedUrl, options);
      }

      console.log('200 OK - ', req.url, 'TOOK:', (Date.now() - startTime), 'ms');
    } catch (e) {
      try {
        res.status(404);
        res.set('Content-Type', 'text/plain');
        res.send('File not found.');

        console.error('404 NOT FOUND - ', req.url, 'TOOK:', (Date.now() - startTime), 'ms');
      } catch (e) {
        res.status(500);
        res.end('An error occured.');

        console.error('500 ERROR - ', req.url, 'TOOK:', (Date.now() - startTime), 'ms');
      }
    }
  }
}

module.exports = registerMiddleware;