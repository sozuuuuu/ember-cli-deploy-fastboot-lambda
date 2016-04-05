var path = require('path');
var FastBootServer = require('ember-fastboot-server');
var outputPath = 'fastboot-dist';
var appName = 'bustle';

var server = new FastBootServer({
  distPath: 'fastboot-dist'
});

function insertIntoIndexHTML(res) {
  return server.insertIntoIndexHTML(res.title, res.body, res.head);
}

exports.handler = function(event, context) {
  server.app.visit(event.path, { request: { get: function() {} }, response: {} })
    .then(insertIntoIndexHTML)
    .then(context.succeed)
    .catch(function() {
      context.fail('500 AWS Lambda Error')
    });
};
