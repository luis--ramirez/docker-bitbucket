/*global module:false*/

var path = require('path');

module.exports = function(grunt) {
  function now(){
    var today = new Date();
    return {
      today: today.getFullYear() + '/' + today.getMonth() + "/" + today.getDate(),
      year: today.getFullYear()
    };
  }

  // Project configuration.
  grunt.initConfig({
    meta: {
      banner: '//     Backbone Brace - ' + now().today + '\n' +
        '//     Copyright ' + now().year + ' Atlassian Software Systems Pty Ltd\n' +
        '//     Licensed under the Apache License, Version 2.0'
    },
    lint: {
      files: ['grunt.js', 'backbone.brace.js', 'test/*.js']
    },
    qunit: {
      files: ['test/test.html']
    },
    concat: {
      dist: {
        src: ['<banner>', '<file_strip_banner:backbone.brace.js>'],
        dest: 'dist/backbone.brace.js'
      }
    },
    min: {
      dist: {
        src: ['<banner>', '<config:concat.dist.dest>'],
        dest: 'dist/backbone.brace.min.js'
      }
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'lint qunit concat docco'
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: false,
        boss: true,
        eqnull: true
      },
      globals: {}
    },
    uglify: {}
  });

  grunt.registerTask('waitForever', 'wait forever', function() { this.async(); });
  grunt.registerTask('qunit-server', 'server waitForever');

  // Default task.
  grunt.registerTask('default', 'lint qunit concat min docco');

  grunt.registerTask('docco', 'Generate docco doc', function(){
    var done = this.async();
    var opts = {
      cmd: 'docco',
      args: [path.join('dist', 'backbone.brace.js')]
    };
    setTimeout(function(){
      grunt.utils.spawn(opts, function(err, rslt, code){
        if (err) {
          grunt.log.writeln(err);
        } else {
          grunt.log.writeln(rslt);
          done(true);
        }
      });
    }, 100);
  });

};
