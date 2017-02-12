'use strict';

const express = require('express');
const Primus = require('primus');
const http = require('http');
const path = require('path')
const Actions = require('./src/server/actions')
const app = express();

var server = http.createServer(app),
    primus = new Primus(server, {transformer: 'uws'});

var actions = Actions(primus);

app.set('port', 8000);

app.use('/public', express.static(__dirname + '/public'));

server.listen(8000);
