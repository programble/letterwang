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

  grunt.registerTask('default', ['jshint', 'cssmin', 'uglify']);
};
