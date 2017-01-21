var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

gulp.task('default', function () {
var files = [
    'lib/js.fft.ftdd.min.js',
    'lib/js.fft.drawer.js',
    'lib/js.fft.history.js',
    'lib/js.fft.player.js',
    'lib/js.fft.visualizer.js'
];

return gulp.src(files)
    .pipe(concat('fftplayer.min.js'))
    .pipe(gulp.dest('bin'))
    .pipe(uglify())
    .pipe(gulp.dest('bin'));
});
