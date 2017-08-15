import Express from 'express';
import favicon from 'serve-favicon';
import compression from 'compression';
import httpProxy from 'http-proxy';
import path from 'path';
import PrettyError from 'pretty-error';
import http from 'http';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { Provider } from 'react-redux';

import ServerTemplate from './ServerTemplate';
import createStore from './redux/createStore';
import Html from './Html';
import config from './config';

const targetUrl = `http://${config.apiHost}:${config.apiPort}`;
const pretty = new PrettyError();
const app = new Express();
const server = new http.Server(app);
const maxAge = 86400000 * 7; // a week
const proxy = httpProxy.createProxyServer({
  target: targetUrl,
  ws: true
});

pretty.start();

app.use(compression());
app.use((req, res, next) => {
  if (req.url.match(/^\/(css|js|img|font|woff2|svg|ttf|eot|woff)\/.+/)) {
    res.setHeader('Cache-Control', 'public, max-age=' + maxAge);
  }
  next();
});
app.use(favicon(path.join(__dirname, '..', 'static', 'favicon.ico')));
app.use(Express.static(path.join(__dirname, '..', 'static')));

// Proxy to API server
app.use('/api', (req, res) => {
  proxy.web(req, res, { target: targetUrl });
});

app.use('/ws', (req, res) => {
  proxy.web(req, res, { target: targetUrl + '/ws' });
});

server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

// added the error handling to avoid https://github.com/nodejitsu/node-http-proxy/issues/527
proxy.on('error', (error, req, res) => {
  if (error.code !== 'ECONNRESET') {
    console.error('proxy error', error);
  }
  if (!res.headersSent) {
    res.writeHead(500, { 'content-type': 'application/json' });
  }

  const json = { error: 'proxy_error', reason: error.message };
  res.end(JSON.stringify(json));
});

app.use((req, res) => {
  if (__DEVELOPMENT__) {
    // Do not cache webpack stats: the script file would change since
    // hot module replacement is enabled in the development env
    webpackIsomorphicTools.refresh();
  }
  const store = createStore();

  function hydrateOnClient() {
    res.send(
      '<!doctype html>\n' +
        ReactDOMServer.renderToString(
          <Html assets={webpackIsomorphicTools.assets()} store={store} />
        )
    );
  }

  if (__DISABLE_SSR__) {
    hydrateOnClient();
    return;
  }

  const context = {};
  const component = (
    <Provider store={store} key="provider">
      <StaticRouter location={req.url} context={context}>
        <ServerTemplate />
      </StaticRouter>
    </Provider>
  );
  const html = ReactDOMServer.renderToString(
    <Html
      assets={webpackIsomorphicTools.assets()}
      component={component}
      store={store}
    />
  );

  if (context.url) {
    res.writeHead(302, {
      Location: context.url
    });
    res.end();
  } else {
    res.send('<!doctype html>\n' + html);
  }
});

if (process.env.PORT || config.port) {
  server.listen(process.env.PORT || config.port, err => {
    if (err) {
      console.error(err);
    }
    console.info(
      '----\n==> ✅  %s is running, talking to API server on %s.',
      config.app.title,
      config.apiPort
    );
    console.info(
      '==> 💻  Open http://%s:%s in a browser to view the app.',
      config.host,
      config.port
    );
  });
} else {
  console.error(
    '==>     ERROR: No PORT environment variable has been specified'
  );
}
