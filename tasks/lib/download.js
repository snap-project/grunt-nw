/* jshint node: true */

var request = require('request');
var fs = require('fs');

module.exports = function(grunt) {

  return function download(url, file, cb) {

    grunt.log.writeln('Downloading ' + url);

    var r = request.defaults({
      proxy: process.env.HTTP_PROXY || process.env.HTTPS_PROXY
    });
    var reqOpts = {
      url: url
    };
    var fileStream = fs.createWriteStream(file);
    var downloaded = 0;
    var contentLength = 0;

    var stream = r.get(reqOpts);

    stream.once('response', function(res) {
      contentLength = res.headers['content-length'];
      grunt.log.writeln('File size is ' + contentLength + ' bytes.');
      grunt.log.writeln('Saving to ' + file);
    });
    
    stream.once('end', function() {
      return cb(null, file);
    });
    stream.once('error', cb);

    stream.on('data', function(chunk) {
      downloaded += chunk.length;
      var percent = (downloaded/contentLength)*100;
      grunt.log.write('\033[0G');
      grunt.log.write('\033[K');
      grunt.log.write('Downloaded ' + percent.toFixed(2) + '%');
      if(downloaded >= contentLength) {
        grunt.log.writeln();
      }
    });

    stream.pipe(fileStream);

  };

};