# ember-cli-deploy-fastboot-lambda

An ember-cli-deploy plugin for building FastBoot and deploying to AWS Lambda.

## Usage
* An AWS Lambda function must first be created.  It must use the NodeJS runtime and have a handler of `index.handler`.
* Run `ember deploy` as usual.  `ember-cli-deploy-fastboot-lambda` will build out a `fastboot-dist` directory.
* Run `ember deploy:activate` with the appropriate revision.  **Only then will the Lambda function be uploaded.**  This is to prevent activated browser deploys and Lambda deploys from going out of sync.

## Config
The following config is required.  `environment` defaults to production.

```javascript
ENV['fastboot-lambda'] = {
  environment: '<environment>',
  "lambda-function": '<lambda-function>'
}
```


## Notes
* The Lambda function will currently deploy with `ember-fastboot-server` version **0.5.0**.
* To upgrade this in the future, create a `package.json` on an Amazon Linux machine with the appropriate version specified, `npm install`, and copy the resulting `node_modules` into `assets/lambda-package/`.
* Finally, remove the `build` entry from `assets/lambda-package/node_modules/ember-fastboot-server/node_modules/contextify/.npmignore`.

## TODO
* Utilize [ember-cli-fastboot-build](https://github.com/fivetanley/ember-cli-deploy-fastboot-build).  Much of this code is duplicated here, however `ember-cli-deploy-manifest` creates two entries in `manifest.txt` for all assets (presumably from assets in both `deploy-dist` and `fastboot-dist` directories, though this is unverified.)  This causes an upload error with `ember-cli-deploy-s3`.


For more information on using ember-cli, visit [http://www.ember-cli.com/](http://www.ember-cli.com/).
