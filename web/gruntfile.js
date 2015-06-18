module.exports = function(grunt) {
        grunt.initConfig({

            less: {
                development: {
                    options: {
                        paths: ["css/*"]
                    },
                    files: {"css/style.css": "css/style.less"}
                },
                production: {
                    options: {
                        paths: ["css/*"],
                        cleancss: true
                    },
                    files: {"css/style.css": "css/style.less"}
                }
            },
            watch: {
              css: {
                files: '**/*.less',
                tasks: ['less'],
                options: {
                  livereload: true,
                },
              },
              livereload: {
                options: { livereload: true },
                files: ['**/*'],
              }
            }
        });
        grunt.loadNpmTasks('grunt-contrib-watch');
        grunt.loadNpmTasks('grunt-contrib-less');
        grunt.registerTask('default', ['less']);
    };