var async = require('async');
var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var defaults = require('./lib/defaults');

module.exports = function(grunt) {

  grunt.registerTask('build', 'Build node-webkit application', buildTask);

  function buildTask() {

    var nw = require('./lib/node-webkit')(grunt);
    var util = require('./lib/util')(grunt);

    var task = this;
    var done = task.async();

    var pkg = grunt.file.readJSON('package.json');
    var options = this.options({
      downloadDir: defaults.DOWNLOAD_DIR,
      runtimeVersion: defaults.RUNTIME_VERSION,
      downloadURL: defaults.DOWNLOAD_URL,
      forceDownload: false,
      forceExtract: false,
      buildDir: 'build',
      linux_ia32: true,
      linux_x64: true,
      win: true,
      osx: true
    });

    nw.setDownloadDir(options.downloadDir)
      .setDownloadRootURL(options.downloadURL);

    var platforms = 'linux_x64 linux_ia32 win osx'.split(' ');
    async.forEachSeries(platforms, buildForPlatform, done);

    function buildForPlatform(platform, cb) {

      if(options[platform]) {

        grunt.log.writeln('Building for platform ' + platform + '...');

        var arch = 'ia32';
        var isLinux = !!~platform.indexOf('linux');
        if(isLinux) {
          arch = platform.split('_')[1];
          platform = 'linux';
        }

        var steps = {

          common: [

            util.checkAndDownloadArchive.bind(options, platform, arch),
            util.extractArchive.bind(options),

            function createBuildDir(archivePath, next) {

              var appDir = pkg.name + '-' +
                pkg.version + '-' +
                platform + '-' +
                arch;

              var buildDir = path.join(options.buildDir, appDir);
              if(grunt.file.exists(buildDir)) {
                grunt.file.delete(buildDir);
              }
              grunt.file.mkdir(buildDir);
              return next(null, buildDir);
            },

            function copyBinaries(buildDir, next) {
              var archivePath = nw.getNWArchivePath(options.runtimeVersion, platform, arch);
              var binariesDir = nw.getNWBinariesDir(archivePath);
              copyTree(binariesDir + '/**', buildDir);
              return next(null, buildDir);
            }

          ],

          osx: [],
          win: [

            function renameExec(buildDir, next) {
              var nwPath = path.join(buildDir, 'nw.exe');
              var destPath = path.join(buildDir, pkg.name + '.exe');
              fs.renameSync(nwPath, destPath);
              return next(null, buildDir);
            }

          ],

          linux: [

            // Workaround libudev.so.0
            function addWrapper(buildDir, next) {
              copyTree(path.join(__dirname, 'build-res/linux/**'), buildDir);
              var currentWrapper = path.join(buildDir, 'app-wrapper.sh');
              var dest = path.join(buildDir, pkg.name);
              fs.renameSync(currentWrapper, dest);
              return next(null, buildDir);
            },

            function renameExec(buildDir, next) {
              var nwPath = path.join(buildDir, 'nw');
              var destPath = path.join(buildDir, 'nw-bin');
              fs.renameSync(nwPath, destPath);
              return next(null, buildDir);
            },

            function makeExecutable(buildDir, next) {
              var files = [pkg.name, 'nw-bin'];
              files.forEach(function(file) {
                var nwPath = path.join(buildDir, file);
                fs.chmodSync(nwPath, '0755');
              });
              return next(null, buildDir);
            },


            function removeNWSnapshot(buildDir, next) {
              var snapshotPath = path.join(buildDir, 'nwsnapshot');
              grunt.file.delete(snapshotPath);
              return next(null, buildDir);
            }
            

          ]

        };

        return async.waterfall(steps.common.concat(steps[platform]), cb);

      } else {
        return cb();
      }
    }

    function copyTree(src, dest) {
      var files = grunt.file.expand(src);
      files.forEach(function(f) {
        if(!grunt.file.isDir(f)) {
          var relPath = path.relative(path.dirname(src), f);
          var realDest = path.join(dest, relPath);
          grunt.file.copy(f, realDest);
        }
      });
    }

  }

};