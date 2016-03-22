var SSH = require('node-ssh');
var path = require('path');
var ssh = new SSH();

var connectionStr = process.argv[2];

if(typeof connectionStr !== 'string') {
  console.log('Must provide a connection string');
  process.exit(1);
}

var parts = connectionStr.split('@');
var user, serverIp;

if(parts.length === 1) {
  user = process.env.USER;
  serverIp = parts[0];
} else {
  user = parts[0];
  serverIp = parts[1];
}

var buildDir = '/tmp/' + Math.random().toString(36).slice(2, 18);

ssh.connect({
  host: serverIp,
  username: user,
  privateKey: path.join(process.env.HOME, '.ssh', 'id_rsa')
}).then(removeExistingBuildDir, serverConnectError)
  .then(createBuildDir)
  .then(uploadPackageJson)
  .then(npmInstall)
  .then(zipNodeModules)
  .then(downloadNodeModules)
  .then(function() { process.exit(0); });


function serverConnectError(err) {
  console.log('Error connecting to server', err);
  return Promise.reject();
}

function removeExistingBuildDir() {
  console.log('Removing existing build directory');

  return ssh.execCommand('rm ' + buildDir);
}

function createBuildDir() {
  console.log('Creating build directory', buildDir);

  return ssh.execCommand('mkdir ' + buildDir);
}

function uploadPackageJson() {
  console.log('Uploading package.json');

  var src = __dirname + '/assets/lambda-package/package.json';
  var dest = buildDir + '/package.json';

  return ssh.put(src, dest);
}

function npmInstall() {
  console.log('Running npm install');

  return ssh.execCommand('npm install', { cwd: buildDir });
}

function zipNodeModules() {
  console.log('Zipping node_modules');

  return ssh.execCommand('zip -r node_modules.zip node_modules', { cwd: buildDir, stream: 'both' });
}

function downloadNodeModules(result) {
  console.log('Downloading node_modules.zip');

  var src = buildDir + '/node_modules.zip';
  var dest = __dirname + '/assets/lambda-package/node_modules.zip';

  return ssh.get(dest, src);
}
