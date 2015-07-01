module.exports = function(grunt) {
	grunt.initConfig({
		less: {
				development: {
						options: {
								paths: ["css/*"]
						},
						files: {"css/style.css": "css/style.less"}
				}
		},
		watch: {
			css: {
				files: 'css/*.less',
				tasks: ['less'],
				options: {
					livereload: true,
				}
			},
			livereload: {
				options: { livereload: true },
				files: ['css/*.less', '**/*.html'],
			}
		}
	});
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.registerTask('default', ['less']);
};