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

const hbs = require('handlebars')
const path = require('path')
const Promise = require('bluebird')
const fs = require('fs')
// Async functions are neat
const [readdir, readFile, access, writeFile] = [
  fs.readdir,
  fs.readFile,
  fs.access,
  fs.writeFile
].map(func => Promise.promisify(func))


// Directory for rendered pages
const OUT_DIR_PATH = path.join(__dirname, '..', 'docs')
// Location of handlebars templates
const TEMPLATE_SOURCE_DIR = path.join(__dirname, '..', 'docs', 'assets', 'src')
// Location of JSON data
const TEMPLATE_DATA_DIR = path.join(__dirname, '..', 'docs', 'assets', 'src', 'data')

// Location of directories containing partials.
// Elements of this array can be strings or string arrays.
// When a string array, each element represents a subdirectory.
const TEMPLATE_PARTIALS_DIRS = [
  path.join('..', 'docs', 'assets', 'src', 'partials')
].map(dir => dir instanceof Array ?
  path.resolve([__dirname, ...dir]) : // TODO: This line isn't working
  path.resolve(__dirname, dir))

console.log(`Template path: ${TEMPLATE_SOURCE_DIR}`)
console.log(`Data path: ${TEMPLATE_DATA_DIR}`)
console.log(`Output path: ${OUT_DIR_PATH}`)

function raise(msg) {
  return err => {
    console.error(msg)
    console.error(err)
  }
}

/*
 * I dunno about you, but I love MapReduce
 */

// Read and parse handlebars templates
const sources_async = () => readdir(TEMPLATE_SOURCE_DIR, 'utf-8')
  .filter(f => {
    let split_file = f.split('.')
    // templates must end in .hbs. Also, ignore partials, which start with '_'
    return split_file[split_file.length - 1] === 'hbs' && !split_file[0].startsWith('_')
  })
  .map(f => { // Read the template
    return readFile(path.join(TEMPLATE_SOURCE_DIR, f), 'utf-8')
      .then(contents => {
        return { page: f.split('.')[0], value: contents }
      })

  })
  .reduce((source_map, source) => {
    source_map[source.page] = source.value
    return source_map
  }, Object.create(null))
  .catch(raise("Error thrown while reading templates"))

// Read in the JSON files containing each page's data
const data_async = () => readdir(TEMPLATE_DATA_DIR, 'utf-8')
  .map(d => { // get the raw data from the file
    return readFile(path.join(TEMPLATE_DATA_DIR, d), 'utf-8')
      .then(contents => { // parse the data into an object
        return JSON.parse(contents)
      }).catch(err => { // error thrown when reading file, default to empty object
        console.error('Error thrown while reading JSON file')
        console.error(err)
        return {}
      })
      .then(data_obj => {
        return { page: d.split('.')[0], value: data_obj }
      })
  })
  .reduce((data_map, data) => {
    data_map[data.page] = data.value
    return data_map
  }, Object.create(null))
  .catch(raise('Error thrown while parsing template data'))

/**
 * Register handlebars partials
 */
const partials_async = () => Promise.each(TEMPLATE_PARTIALS_DIRS, dir => {
  readdir(dir, 'utf-8') // Get the files in one of the partial directories
    // Filter out anything that isn't a handlebars file or doesn't start with '_' 
    .filter(partial_name => partial_name.startsWith('_') && partial_name.endsWith('.hbs'))
    .each(partial_name => {
      readFile(path.join(dir, partial_name), 'utf-8')
        .then(partial_contents => { // Read the contents and register it with handlebars
          hbs.registerPartial(partial_name.split('.')[0], partial_contents)
        })
    })
})
.catch(raise('Error thrown while registering partials'))

// const pages = []
Promise.join(sources_async(), data_async(), partials_async(), async (sources, data) => {
  for (let page_name in sources) {
    let template = hbs.compile(sources[page_name])
    let page = template(data[page_name] || {})
    let page_path = path.join(OUT_DIR_PATH, page_name + '.html')
    // pages.push(await writeFile(page_path, page))
    await writeFile(page_path, page)

  }
})

// Promise.all(pages)
// .then(() => console.log('Successfully saved all rendered pages'))
// .catch(raise('Error thrown while saving pages.'))
