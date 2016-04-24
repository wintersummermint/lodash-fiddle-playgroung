var express = require('express'),
    pkg = require('./package.json'),
    api = require('./api'),
    app = express(),
    port = Number(process.env.PORT || 5001);

app.use(express.compress());
app.use(express.logger());
app.use(express.json());

app.configure(function() {
    app.use('/', express.static(__dirname + '/static'));
});

app.get(/^\/\w+\/$/, function(req, res) {
    res.sendfile(__dirname + '/static/index.html');
});

app.get(/^\/embed\/\w+\/$/, function(req, res) {
    res.sendfile(__dirname + '/static/embed.html');
});

app.get(/^\/\w+$/, function(req, res) {
    res.redirect(req.url + '/');
});

app.get(/^\/embed\/\w+$/, function(req, res) {
    res.redirect(req.url + '/');
});

api(app);

app.listen(port, function() {
    console.log('port is ' + port);
});

console.log(
    'Express version ' +
    pkg.dependencies.express.replace(/[^\w\.]/g, '') +
    ' starting server on port ' +
    port +
    '.'
);
