const gulp = require('gulp')
var sass = require('gulp-sass');
const { exec } = require('child_process')

const build_js = () => pipe_output(exec('./bin/render.js'))
    // const build_css = () => exec('sass src/css/input.scss build/css/compiled.css')
const build_css = () =>
    gulp.src('src/assets/scss/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('build/assets/css'))

const build_assets = () =>
    gulp.src(['src/assets/**/*', '!src/assets/scss/**/*'])
    .pipe(gulp.dest('build/assets/'))

const open_index = () => exec('/bin/open build/index.html')

function dev(cb) {
    gulp.watch(['src/**/*', '!src/assets/scss/**/*'], build_js)
    gulp.watch('src/assets/scss/**/*', build_css)
    gulp.watch(['src/assets/**/*', '!src/assets/scss/**/*'], build_assets)

    cb()
}

exports['build:js'] = build_js
exports['build:assets'] = gulp.parallel(build_css, build_assets)
exports['build'] = gulp.parallel(build_js, build_css, build_assets)
exports['dev'] = gulp.series(exports['build'], open_index, dev)
exports['dev:no-open'] =  gulp.series(exports['build'], dev)
exports['open'] = open_index
exports.default = exports['build']

/**
 * Pipes the output streams of a child process to the currently executing process's output streams.
 * The mode parameter determines which output streams to pipe.
 *
 * @param {ChildProcess} child_process The child process to pipe
 * @param {number} mode 0 to pipe stderr only, 1 to pipe stdout only, any other number to pipe both. Defaults to 0.
 *
 * @returns {ChildProcess} The piped child process for method chaining
 */
function pipe_output(child_process, mode = 0) {
    switch (mode) {
        case 0:
            child_process.stderr.pipe(process.stderr);
            break;
        case 1:
            child_process.stdout.pipe(process.stdout);
            break;
        default:
            child_process.stdout.pipe(process.stdout);
            child_process.stderr.pipe(process.stderr);
    }

    return child_process;
}
