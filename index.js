/* jshint node: true */
'use strict';

var FastbootLambdaDeployPlugin = require('./lib/fastboot-lambda-deploy-plugin');

module.exports = {
  name: 'ember-cli-deploy-fastboot-lambda',

  createDeployPlugin: function(options) {
    return new FastbootLambdaDeployPlugin({
      name: options.name
    });
  }
};
