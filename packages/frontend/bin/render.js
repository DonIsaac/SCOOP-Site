#!/usr/bin/env node

/**
 * docs/src/render.js
 *
 * This script compiles the different assets needed for every documentation
 * webpage. Handlebars templates are read in and compiled with data stored
 * as JSON files.
 *
 * This script also supports partials. Partials must start with a '_'
 * character.
 *
 * @author Donald Isaac
 */

/*
 * ============================================================================
 * ================================= IMPORTS ==================================
 * ============================================================================
 */
const hbs = require('handlebars')
const layouts = require('handlebars-layouts')
const path = require('path')
const Promise = require('bluebird')
const fs = require('fs')
const cmd = require('commander')
const log = require('ulog')('build:docs')
const os = require('os')

// Async functions are neat
const [readdir, readFile, access, writeFile] = [
  fs.readdir,
  fs.readFile,
  fs.access,
  fs.writeFile
].map(func => Promise.promisify(func))

/*
 * ============================================================================
 * ================================ CONSTANTS =================================
 * ============================================================================
 */

/**
 * The name of the user's config file
 * @type {string}
 */
const CONFIG_FILE_NAME = 'render.config.json'

/*
 * ============================================================================
 * ============================== SCRIPT SETUP ================================
 * ============================================================================
 */

// Dis be how we do da layouts oh yah
hbs.registerHelper(layouts(hbs))
/**
 * The root directory of the project.
 * @type {string}
 */

const config = {
  source: 'src/',
  outDir: 'build/',
  resources: { // relative to source directory
    templateDir: 'views/',
    dataDir: 'data/',
    partialDirs: ['partials'],
    layoutDir: 'layouts/',
    helperDir: 'helpers/'
  }
}

// Parse command line arguments
cmd.version('1.0.0')
  .option('-v, --verbose', 'Displays verbose info messages')
  .option('-S, --silent', 'Silent run. Only errors are displayed')
  .option('-D, --debug', 'Debug messages are displayed. Careful, this might flood your screen')
  .option('-f, --config-file [file]', 'Specify the config file to use. Defaults to render.config.json')
  .option('-s, --source [path]', 'Location of source directory relative to the root', null)
  .option('-o, --out-dir [path]', 'Directory where the rendered site should go. Defaults to "build/"', null)
  .option('-t, --template-dir [path]', 'Directory where Handlebars templates are located', null)
  .option('-d, --data-dir [path]', 'Directory where template data files are located', null)
  .option('-p, --partial-dirs [paths]', 'Comma separated list of Handlebars partial directories', null)
  .option('-l, --layout-dir [paths]', 'Location of layouts directory', null)
  .parse(process.argv);

let config_file_name = cmd.configFile ? path.basename(cmd.configFile) : CONFIG_FILE_NAME
let config_file_dir = cmd.configFile ? path.dirname(cmd.configFile) : undefined

let root = resolveRoot(config_file_dir)
// Read user config file; store it as an object
let user_config = JSON.parse(fs.readFileSync(path.join(root, config_file_name), 'utf-8'))
// Override system defaults with user config data
Object.assign(config, user_config)

log.debug(config)
// Command line arguments override both system defaults and user config data
log.debug(cmd);
[
  'source',
  'outDir'
].forEach(option => {
  config[option] = (cmd && cmd[option]) || config[option]
});

[
  'templateDir',
  'dataDir',
  'layoutDir',
  'helperDir'
].forEach(resource => {
  config.resources[resource] = cmd[resource] || config.resources[resource]
})

if (cmd.partialDirs) {
  config.resources.partialDirs = cmd.partialDirs.split(',')
}

/*
	DIRECTORY OPTIONS
*/
// TODO: Replace usage of these constants with straight up config usage
// TODO: Make this suck less
// console.dir(config.partialDirs)
// Directory for rendered pages
log.debug(config)
let { source, outDir } = config
let { templateDir, dataDir, partialDirs, layoutDir, helperDir } = config.resources
const OUT_DIR_PATH = path.join(root, outDir)
// Location of handlebars templates
const TEMPLATE_SOURCE_DIR = path.join(root, source, templateDir)
// Location of JSON data
const TEMPLATE_DATA_DIR = path.join(root, source, dataDir)
const LAYOUT_DIR = path.join(root, source, layoutDir)
const HELPER_DIR = path.join(root, source, helperDir)

// Location of directories containing partials.
// Elements of this array can be strings or string arrays.
// When a string array, each element represents a subdirectory.
const TEMPLATE_PARTIALS_DIRS = partialDirs.map(dir => path.join(root, source, dir))
/* [
  path.join('..', 'docs', 'assets', 'src', 'partials')
].map(dir => path.resolve(__dirname, dir)) */

/*
 In order from lowest to highest (lower value = more important):
 ERROR, WARN, INFO, LOG, DEBUG, TRACE
*/
if (cmd.silent) {
  log.level = log.ERROR
} else if (cmd.verbose) {
  log.level = log.LOG
} else if (cmd.debug) {
  log.level = log.DEBUG
} else {
  log.level = log.INFO
}

log.log(`Template path: ${TEMPLATE_SOURCE_DIR}`)
log.log(`Data path: ${TEMPLATE_DATA_DIR}`)
log.log(`Output path: ${OUT_DIR_PATH}\n`)



/*
 * I dunno about you, but I love MapReduce
 */

/**
 * Reads and parses handlebars templates from the template directory.
 *
 * The promise resolves with the following shape
 * ```js
 * {
 *    index: "<index.html.hbs file contents>",
 *    about: "<about.html.hbs file contents>",
 *    // etc
 * }
 * ```
 *
 * @returns {Promise<any>} Map of parsed handlebars templates
 */
const sources_async = () => Promise.try(() => log.log('Loading templates...'))
  .then(() => readdir(TEMPLATE_SOURCE_DIR, 'utf-8'))
  .filter(f => {
    let split_file = f.split('.')
    // templates must end in .hbs. Also, ignore partials, which start with '_'
    return split_file[split_file.length - 1] === 'hbs' && !split_file[0].startsWith('_')
  })
  .map(f => { // Read the template from the file
    return readFile(path.join(TEMPLATE_SOURCE_DIR, f), 'utf-8')
      .then(contents => {
        // Return an object with the template's name and contents
        return { page: f.split('.')[0], value: contents }
      })

  })
  .reduce((source_map, source) => {
    source_map[source.page] = source.value
    return source_map
  }, Object.create(null))
  .catch(raise('Error thrown while reading templates'))



/*
 * {
 *    "index": {...data...},
 *    "about": {...data...},
 * }
 */
// Read in the JSON files containing each page's data
const data_async = () => Promise.try(() => log.log('Loading template data...'))
  .then(() => readdir(TEMPLATE_DATA_DIR, 'utf-8'))
  .filter(filename => {
    let split_name = filename.split('.')
    let filetype = filename.split('.')[split_name.length - 1]
    // data files must end in .json or .js
    let valid = ['json', 'js'].includes(filetype)
    log.debug(`data: controller file ${filename} ends with ${filetype} is ${valid ? 'valid' : 'invalid'}`)
    return valid
  })
  .map(async d => { // get the raw data from the file
    let data_path = path.join(TEMPLATE_DATA_DIR, d)
    if (d.endsWith('.json')) { // Controller is a JSON object, parse it, add it to map.
      return readFile(data_path, 'utf-8')
        .then(contents => { // parse the data into an object
          return JSON.parse(contents)
        }).catch(err => { // error thrown when reading file, default to empty object
          log.error('Error thrown while reading JSON file; using empty object')
          log.warn(err)
          return {}
        })
        .then(data_obj => {
          return { page: d.split('.')[0], value: data_obj }
        })
    } else if (d.endsWith('.js')) { // data is a script that exports a controller object
      let data_exports = await require(data_path)
      let controller = data_exports.default || data_exports // handle ES6 exports
      return { page: d.split('.')[0], value: controller }
    } else { // should be unreachable, acts as a sanity check
      throw new Error('Invalid data filetype.')
    }
  })
  .reduce((data_map, data) => {
    data_map[data.page] = data.value
    return data_map
  }, Object.create(null))
  .catch(raise('Error thrown while parsing template data'))



/*
 * {
 *    "index": "...html...",
 *    "about": "...html...",
 * }
 */
/**
 * Register handlebars partials
 */
const partials_async = () => Promise.each(TEMPLATE_PARTIALS_DIRS, dir => {
  return readdir(dir, 'utf-8') // Get the files in one of the partial directories
    // Filter out anything that isn't a handlebars file or doesn't start with '_'
    .filter(partial => partial.startsWith('_') && partial.endsWith('.hbs'))
    .each(partial => {
      return readFile(path.join(dir, partial), 'utf-8')
        .then(partial_contents => { // Read the contents and register it with handlebars
          let partial_name = partial.split('.')[0]
          partial_name = partial_name.substr(1, partial_name.length - 1)
          log.log(`PARTIALS: Registering partial ${partial_name}...`)
          partial_contents.page_name = partial_contents.page_name || partial_name
          return hbs.registerPartial(partial_name, partial_contents)
        })
    })
})
  .then(log.debug('PARTIALS: All partials registered.'))
  .catch(raise('Error thrown while registering partials'))

const layouts_async = () => Promise.try(() => log.log('Loading layouts...'))
  .then(() => readdir(LAYOUT_DIR, 'utf-8'))
  .filter(layout_file => layout_file.endsWith('.hbs'))
  .each(layout_file => {
    readFile(path.join(LAYOUT_DIR, layout_file), 'utf-8')
      .then(layout_contents => {
        let layout_name = layout_file.split('.')[0]
        log.log(`Registering layout ${layout_name}...`)
        return hbs.registerPartial(layout_name, layout_contents)
      })
  })
  .catch(raise('Error thrown while registering layouts'))

const helpers_async = () => Promise.try(() => log.log('Registering helpers...'))
  .then(() => readdir(HELPER_DIR, 'utf-8'))
  .filter(helper_file => helper_file.endsWith('.js'))
  .each(async helper_file => {
    let helpers = await require(path.join(HELPER_DIR, helper_file))
    for (let helper in helpers) {
      let fn = helpers[helper]
      if (typeof fn === 'function') {
        log.log(`Registering helper ${helper}...`)
        hbs.registerHelper(helper, fn)
      }
    }
  })
  .catch(raise('Error thrown while registering helpers'))


// const pages = []
Promise.join(sources_async(), data_async(), partials_async(), layouts_async(), helpers_async(),
  async (sources, data) => {
    log.log('Rendering templates...')
    log.debug(`Partials: ${JSON.stringify(Object.keys(hbs.partials))}`)
    log.debug(`Pages: ${Object.keys(sources)}`)
    log.debug(`Helpers: ${JSON.stringify(hbs.helpers)}`)
    for (let page_name in sources) {
      let template = hbs.compile(sources[page_name])
      let page;
      try { // Error thrown if template contains a syntax error
        page = template(data[page_name] || {})
      } catch (err) {
        log.error(`Syntax error in page ${page_name}:\n${err.message}`)
        log.debug(err.stack)
        process.exit(1)
      }
      let page_path = path.join(OUT_DIR_PATH, page_name + '.html')
      log.log(`Rendering ${page_name}...`)
      // pages.push(await writeFile(page_path, page))
      await writeFile(page_path, page).then(() => log.log('Finished'))

    }
  })
  .then(() => log.info('Finished rendering.'))

// Promise.all(pages)
// .then(() => console.log('Successfully saved all rendered pages'))
// .catch(raise('Error thrown while saving pages.'))

/*
 * ============================================================================
 * ============================ UTILITY FUNCTIONS =============================
 * ============================================================================
 */
function raise(msg) {
  return err => {
    log.error(msg)
    log.error(err)
  }
}

/**
 * Finds the root directory of the website. A directory is the root directory
 * if and only if it contains a `render.config.json` file.
 *
 * @returns {Promise<String>} The path to the root directory
 *
 * @throws If the root directory could not be resolved
 */
function resolveRoot(root = process.cwd()) {
  const systemRoot = (os.platform === "win32") ? process.cwd().split(path.sep)[0] : "/"

  let found = false

  for (; // start at specified root
    !found && root !== systemRoot; // Stop searching if config file is found or we reach the root dir
    root = path.resolve(root, '..') // Go to parent directory, search again
  ) {
    /** @type {String[]} */
    let filesInDir = fs.readdirSync(root)

    if (filesInDir.includes(CONFIG_FILE_NAME))
      return root
  }

  throw new Error('"render" must be called within a project directory or subdirectory.')
}
