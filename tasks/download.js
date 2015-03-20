var os = require('os');
var async = require('async');
var defaults = require('./lib/defaults');

module.exports = function(grunt) {

  grunt.registerTask('download', 'Download node-webkit binaries', downloadTask);

  function downloadTask() {

    var nw = require('./lib/nw')(grunt);
    var util = require('./lib/util')(grunt);

    var task = this;
    var done = task.async();

    var options = this.options({
      downloadDir: defaults.DOWNLOAD_DIR,
      runtimeVersion: defaults.RUNTIME_VERSION,
      downloadURL: defaults.DOWNLOAD_URL,
      forceDownload: false,
      forceExtract: false
    });

    nw.setDownloadDir(options.downloadDir)
      .setDownloadRootURL(options.downloadURL);

    var platform = os.platform();
    var arch = os.arch();

    async.waterfall([
      util.checkAndDownloadArchive.bind(options, platform, arch),
      util.extractArchive.bind(options)
    ], done);

  }

};
