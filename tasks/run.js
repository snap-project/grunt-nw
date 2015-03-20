/* jshint node: true */
var os = require('os');
var path = require('path');
var extract = require('./lib/extract');
var defaults = require('./lib/defaults');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

module.exports = function(grunt) {

  grunt.registerTask('run', 'Run node-webkit application', runTask);

  function runTask() {

    this.requires('download');

    var nw = require('./lib/nw')(grunt);
    var util = require('./lib/util')(grunt);

    var task = this;
    var done = task.async();

    var runnables = {
      linux: 'nw',
      osx: 'node-webkit.app/Contents/MacOS/node-webkit',
      windows: 'nw.exe'
    };

    var options = this.options({
      downloadDir: defaults.DOWNLOAD_DIR,
      runtimeVersion: defaults.RUNTIME_VERSION,
      nwArgs: []
    });

    nw.setDownloadDir(options.downloadDir);

    var platform = os.platform();
    var arch = os.arch();
    var archivePath = nw.getNWArchivePath(options.runtimeVersion, platform, arch);
    var binariesDir = nw.getNWBinariesDir(archivePath);
    var nwPath = path.join(binariesDir, runnables[platform]);

    if(platform.indexOf('linux') !== -1) {

      // linudev.so.0 workaround

      var scriptPath = __dirname + '/build-res/linux/libudev-linker.sh';
      var execOpts = { cwd: process.cwd() };

      exec(scriptPath, execOpts, function(err) {

        if(err) {
          return done(err);
        }

        process.env.LD_LIBRARY_PATH = '.:' + process.env.LD_LIBRARY_PATH;

        return spawnNodeWebkit();

      });

    } else {
      return spawnNodeWebkit();
    }

    function spawnNodeWebkit() {

      grunt.log.writeln(
        'Running "' + nwPath + ' ' +
        options.nwArgs.join(' ')+'"'
      );

      var exec = spawn(nwPath, options.nwArgs);
      exec.stdout.pipe(process.stdout);
      exec.stderr.pipe(process.stderr);
      exec.once('close', done);

    }

  }

};
