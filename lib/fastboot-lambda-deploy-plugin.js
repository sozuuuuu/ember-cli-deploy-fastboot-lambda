var fs               = require('fs-promise');
var glob             = require('glob');
var path             = require('path');
var RSVP             = require('rsvp');
var AWS              = require('aws-sdk');
var Lambda           = new AWS.Lambda({ region: 'us-east-1' });
var UpdateLambdaFunc = RSVP.denodeify(Lambda.updateFunctionCode.bind(Lambda));
var exec             = RSVP.denodeify(require('child_process').exec);
var DeployPlugin     = require('ember-cli-deploy-plugin');

module.exports = DeployPlugin.extend({
  defaultConfig: {
    environment: 'production',
    outputPath: path.join('tmp', 'fastboot-dist'),
    zipPath: path.join('tmp', 'fastboot-dist.zip')
  },

  build: function() {
    var outputPath = this.readConfig('outputPath');
    var self = this;

    return this.buildFastBoot(outputPath)
      .then(function(files) {
        return {
          fastbootDistDir: outputPath,
          fastbootDistFiles: files || []
        };
      })
      .catch(function(error) {
        self.log('build failed', { color: 'red' });
        return Promise.reject(error);
      });
  },

  buildFastBoot: function(outputPath) {
    var buildEnv   = this.readConfig('environment');

    this.log('building fastboot app to `' + outputPath + '` using buildEnv `' + buildEnv + '`...', { verbose: true });

    process.env.EMBER_CLI_FASTBOOT = true;

    var Builder  = this.project.require('ember-cli/lib/models/builder');

    var builder = new Builder({
      ui: this.ui,
      outputPath: outputPath,
      environment: buildEnv,
      project: this.project
    });

    return builder.build()
      .finally(function() {
        process.env.EMBER_CLI_FASTBOOT = false;
        return builder.cleanup();
      })
        .then(this._logSuccess.bind(this, outputPath));
  },

  didBuild: function(context) {
    // Rewrite FastBoot index.html assets
    try {
      var browserAssetMap = JSON.parse(fs.readFileSync(context.distDir + '/assets/assetMap.json'));
      var fastBootAssetMap = JSON.parse(fs.readFileSync(context.fastbootDistDir + '/assets/assetMap.json'));
      var prepend = browserAssetMap.prepend;

      var indexHTML = fs.readFileSync(context.fastbootDistDir + '/index.html').toString();
      var newAssets = browserAssetMap.assets;
      var oldAssets = fastBootAssetMap.assets;

      for (var key in oldAssets) {
        var value = oldAssets[key];
        indexHTML = indexHTML.replace(prepend + value, prepend + newAssets[key]);
      }

      fs.writeFileSync(context.fastbootDistDir + '/index.html', indexHTML);

    } catch(e) {
      this.log('unable to rewrite assets: ' + e.stack, { verbose: true });
    }

    // TODO: Remove this and put it in the Beanstalk server code or somewhere else
    this.log('npm installing for fastboot-dist', { verbose: true });
    return exec("npm install --production", { cwd: context.fastbootDistDir })
      .then(this._makeLambdaPackage.bind(this, context));
  },

  activate: function(context) {
    var self = this;
    this.log('reading in lambda-package.zip', { verbose: true });
    return fs.readFile('tmp/lambda-package.zip').then(function(fileBuf) {
      self.log('uploading lambda-package.zip to AWS Lambda', { verbose: true });

      return UpdateLambdaFunc({
        FunctionName: 'fastboot-test',
        ZipFile: fileBuf
      });
    })
  },

  _makeLambdaPackage: function(context) {
    var packageSkeletonPath = path.join(__dirname, '..', 'assets', 'lambda-package');

    return fs.copy(packageSkeletonPath, 'tmp/lambda-package')
      .then(function() {
        return fs.copy(context.fastbootDistDir, 'tmp/lambda-package/fastboot-dist')
      })
      .then(function() {
        return exec("zip -r lambda-package.zip *", { cwd: 'tmp/lambda-package' })
      })
      .then(function() {
        return exec("mv lambda-package.zip ../", { cwd: 'tmp/lambda-package' })
      })
      .then(function() {
        context.lambdaPackage = 'tmp/lambda-package.zip';
      })
  },

  _logSuccess: function(outputPath) {
    var self = this;
    var files = glob.sync('**/**/*', { nonull: false, nodir: true, cwd: outputPath });

    if (files && files.length) {
      files.forEach(function(path) {
        self.log('✔  ' + path, { verbose: true });
      });
    }
    self.log('fastboot build ok', { verbose: true });

    return Promise.resolve(files);
  }
});
