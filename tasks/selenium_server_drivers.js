var fs = require('fs');
var os = require('os');
var path = require('path');
var url = require('url');
var request = require('request');
var ProgressBar = require('progress');
var unzip = require('unzip');
var chmodr = require('chmodr');

module.exports = function (grunt) {

  function getTarget(options) {
    return path.join(options.downloadLocation, path.basename(options.downloadUrl));
  }

  function downloadDriver (options, cb) {
    // Where to save jar to.
    var target_destination = getTarget(options);


    // If it's already there don't download it.
    if (fs.existsSync(target_destination)) {
      return cb(target_destination, null);
    }

    grunt.log.ok('Saving driver to: ' + target_destination);

    var writeStream = fs.createWriteStream(target_destination);

    // When the writeStream.end() resolves it will trigger a finish event.
    // We have to wait for this before we know everything has been flushed to the filesystem.
    // https://nodejs.org/api/stream.html#stream_writable_end_chunk_encoding_callback
    writeStream.on('finish', function(){
      grunt.log.ok('done.');
      var ext = path.extname(target_destination);
      if(ext == '.zip'){
        var extracted_dir = path.join(options.downloadLocation, path.basename(target_destination, ext));
        var unzipStream = unzip.Extract({ path: extracted_dir })
          .on('error', function (err) { cb(null, err); })
          .on('close', function () {
            grunt.log.ok('Extracted files from ' + target_destination + ' to ' + extracted_dir);
            chmodr(extracted_dir, 0755, function(err){
              if(err){
                cb(null, err);
              }else{
                cb(target_destination, null);
              }
            });
          })
        ;
        fs.createReadStream(target_destination)
          .pipe(unzipStream)
        ;
      }else{
        cb(target_destination, null);
      }
    });

    // Start downloading and showing progress.
    request(options.downloadUrl).on('response', function (res) {
      if(res.statusCode >= 400) {
          fs.unlink(target_destination, function (err) {
            if (err)
              grunt.log.error(err);
            cb(null, new Error(options.downloadUrl + " returns " + res.statusCode));
          })
          return;
      }
      // Full length of file.
      var len = parseInt(res.headers['content-length'], 10);

      // Super nifty progress bar.
      var bar = new ProgressBar(' downloading [:bar] :percent :etas', {
        complete: '=',
        incomplete: ' ',
        width: 20,
        total: len
      });

      // Write new data to file.
      res.on('data', function (chunk) {
        writeStream.write(chunk);
        bar.tick(chunk.length);
      });

      // Tell the write stream that we are done calling write.
      // The writeStream will emit a 'finish' event when everything has been written to the filesystem.
      res.on('end', function () {
        writeStream.end();
      });

      // Download error.
      res.on('error', function (err) {
        cb(null, err);
      });
    });
  }

  /**
   * Start a Selenium server.
   */
  grunt.registerMultiTask('selenium-server-drivers', 'Download (if needed) driver files.', function () {
    var done = this.async();
    var target = this.target;

    // Set default options.
    var options = this.options({});

    grunt.verbose.writeflags(options, 'Options');

    for(var driver in options){
      // Download
      downloadDriver(options[driver], function (file, err) {
        grunt.log.ok('using driver at: ' + file);
        if (err) {
          grunt.log.error(err);
          return done(false);
        }
        return done(true);
      });
    }
  });
};
