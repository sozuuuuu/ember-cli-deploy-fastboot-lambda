# ember-cli-deploy-fastboot-lambda

An ember-cli-deploy plugin for building FastBoot and deploying to AWS Lambda.

## Usage
* An AWS Lambda function must first be created.  It must use the NodeJS runtime and have a handler of `index.handler`.
* Run `ember deploy` as usual.
* Run `ember deploy:activate` with the appropriate revision.  **Only then will the Lambda function be uploaded.**  This is to prevent activated browser deploys and Lambda deploys from going out of sync.


## Config
The following config is required.

```javascript
ENV['fastboot-lambda'] = {
  "lambda-function": '<lambda-function>'
}
```


For more information on using ember-cli, visit [http://www.ember-cli.com/](http://www.ember-cli.com/).
