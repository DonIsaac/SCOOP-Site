const gulp = require('gulp')
var sass = require('gulp-sass');
const { exec } = require('child_process')

const build_js = () => pipe_output(exec('./bin/render.js'), 2)
// const build_css = () => exec('sass src/css/input.scss build/css/compiled.css')
const build_css = () =>
  gulp.src('src/assets/scss/**/*.scss')
  .pipe(sass().on('error', sass.logError))
  .pipe(gulp.dest('build/assets/css'))

const build_assets = () =>
  gulp.src(['src/assets/**/*', '!src/assets/scss/**/*'])
  .pipe(gulp.dest('build/assets/'))

const open_index = () => exec('open build/index.html')

function dev(cb) {
  gulp.watch(['src/**/*', '!src/assets/scss/**/*'], build_js)
  gulp.watch('src/assets/scss/**/*', build_css)
  gulp.watch(['src/assets/**/*', '!src/assets/scss/**/*'], build_assets)

  cb()
}

exports['build:js']       = build_js
exports['build:assets']   = gulp.parallel(build_css, build_assets)
exports['build']          = gulp.parallel(build_js, build_css, build_assets)
exports['dev']            = gulp.series(exports['build'], open_index, dev)
exports['open']           = open_index
exports.default           = exports['build']

/**
 *
 * @param {ChildProcess} child_process
 * @param {num} mode
 */
function pipe_output(child_process, mode = 0) {
  if (!child_process) return
  switch (mode) {
    case 0:
      child_process.stdout.pipe(process.stdout)
      break
    case 1:
      child_process.stderr.pipe(process.stderr)
      break
    default:
      child_process.stdout.pipe(process.stdout)
      child_process.stderr.pipe(process.stderr)
      break
  }

  return child_process
}
