import 'babel-polyfill';
import http from 'http';
import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import SocketIo from 'socket.io';
import config from './config';
import handleUserSocket from './ws';
import { logger, middleware as requestMiddleware } from './helpers/logger';

const app = express();
const server = new http.Server(app);
const io = new SocketIo(server);
io.path('/ws');

app.use(cookieParser(config.secret));
app.use(
  session({
    secret: config.secret,
    key: 'usersid',
    cookie: { maxAge: 1200000 },
    resave: false,
    saveUninitialized: false
  })
);


// app.use(httpLogger('dev'));

app.use(requestMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/static', express.static(config.projectDir + '/public'));

app.get('/app/load', (req, res) => {
  res.json({ data: { testMsg: 'This came from server' } });
});

app.post('/user/login', (req, res) => {
  setTimeout(
    function() {
      res.json({ data: true });
    },
    2000
  );
});

// Log errors
app.use((err, req, res, next) => {
  if (err) {
    logger.error(err);
    next(err);
  }
});

if (config.apiPort) {
  const runnable = app.listen(config.apiPort, err => {
    if (err) {
      logger.error(err);
    }
    console.log(
      '----\n==> SIMPLE DEBUG API is running on port %s',
      config.apiPort
    );
    console.log(
      '==>  Send requests to http://%s:%s',
      config.apiHost,
      config.apiPort
    );
  });

  io.listen(runnable);

  io.on('connection', socket => {
    console.log('user connected');
    handleUserSocket(socket);
  });
} else {
  console.error('==> ERROR: No PORT environment variable has been specified');
}
