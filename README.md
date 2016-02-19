# grunt-selenium-server-drivers

> Start/stop a local Selenium standalon server.

Grunt config example (with default options):
```js
module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-selenium-server');
  grunt.loadNpmTasks('grunt-selenium-server-drivers');
  var os = require('os');
  os.arch();
  grunt.initConfig({
    'selenium-server-drivers': {
      dev: {
        options: {
          chromedriver: {
            downloadUrl: 'http://chromedriver.storage.googleapis.com/2.21/chromedriver_linux64.zip',
            downloadLocation: '<%= start-selenium-server.dev.options.downloadLocation %>',
          }
        }
      }
    },
    'start-selenium-server': {
      dev: {
        options: {
          autostop: false,
          downloadUrl: 'https://selenium-release.storage.googleapis.com/2.46/selenium-server-standalone-2.46.0.jar',
          downloadLocation: os.tmpdir(),
          serverOptions: {},
          systemProperties: {}
        }
      }
    },
    'stop-selenium-server': {
      dev: {}
    }
  });
};
```

## Supported Drivers
chromedriver
