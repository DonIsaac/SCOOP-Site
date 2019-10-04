const gulp = require('gulp')
var sass = require('gulp-sass');
const zip = require('gulp-zip')
const { exec } = require('child_process')
const del = require('del')

const clean = () => del(['dist/**/*', 'build/**/*'])
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

function bundle_built_site() {
    return gulp.src('build/**/*')
    .pipe(zip('scoop-site.zip'))
    .pipe(gulp.dest('dist'))
}

/**
 * Sends the zipped build files in dist/ to the production server
 */
const deploy_to_prod = cmd('scp dist/scoop-site.zip root@www.scooperative.org:/var/www')

/**
 * Runs the setup script on the production server. The setup script will
 * take the built files that were sent up, put them where they need to be,
 * and restart the server to display the changes.
 */
const exec_on_prod = cmd('ssh root@www.scooperative.org /var/www/setup')

exports['clean'] = clean
exports['build:js'] = build_js
exports['build:assets'] = gulp.parallel(build_css, build_assets)
exports['build'] = gulp.parallel(build_js, build_css, build_assets)
exports['deploy'] = gulp.series(clean, exports['build'], bundle_built_site, deploy_to_prod, exec_on_prod)
exports['dev'] = gulp.series(exports['build'], open_index, dev)
exports['dev:no-open'] =  gulp.series(exports['build'], dev)
exports['open'] = open_index
exports.default = exports['build']

/**
 * Creates a function that executes a terminal/bash/whatever command as a child
 * process. The command's stdout and stderr are piped to the terminal so that you can see it.
 * The returned function is usable by gulp.
 *
 * @param {string} cmd The terminal command to execute
 *
 * @returns {(cb: Function) => void} A function that can be used by gulp to execute the command
 */
function cmd(cmd) {
    return function(cb) {
        exec(cmd, function(err, stdout, stderr) {
            console.log(stdout);
            console.error(stderr);
            cb(err);
        });
    }
}

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
