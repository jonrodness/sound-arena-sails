module.exports = function(grunt) {

    // taken from https://github.com/erikschlegel/sails-generate-reactjs/blob/master/templates/tasks/config/browserify.js
    var version = grunt.file.readJSON('package.json').version;

    grunt.config.set('browserify', {
        js: {
            src: require('../pipeline').browserifyMainFile,
            dest: '.tmp/public/browserify/debug.' + version + '.js'
        }
    });

    grunt.loadNpmTasks('grunt-browserify');
};