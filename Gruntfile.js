var fs = require('fs');

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      files: ['Gruntfile.js', '<%= pkg.name %>/*.js', 'public/js/*.js',
              '!public/js/*.min.js'],
    },

    cssmin: {
      files: {
        src: 'public/css/<%= pkg.name %>.css',
        dest: 'public/css/<%= pkg.name %>.min.css'
      }
    },

    uglify: {
      build: {
        src: 'public/js/<%= pkg.name %>.js',
        dest: 'public/js/<%= pkg.name %>.min.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', 'jshint');
  grunt.registerTask('postinstall', ['cssmin', 'uglify']);

  grunt.registerTask('words', 'Generate word list', function() {
    var words = [];

    ['american-english', 'british-english'].forEach(function(dict) {
      var data = fs.readFileSync('/usr/share/dict/' + dict,
                                 {encoding: 'utf8'});

      data.trim().split('\n').forEach(function(word) {
        if (/^[a-z]{3,}$/.test(word)) {
          if (/s$/.test(word) && words.indexOf(word.slice(0, -1)) != -1);
          else if (words.indexOf(word) == -1)
            words.push(word);
        }
      });
    });

    fs.writeFileSync('data/words', words.sort().join('\n'));

    grunt.log.writeln(words.length + ' words');
  });
};
