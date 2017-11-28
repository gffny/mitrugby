/**
 * gulp file that will restart keystonejs app and compile sass
 */
'use strict';
var gulp = require('gulp');
var watch = require('gulp-watch');
var shell = require('gulp-shell')

var paths = {
    'src':['./models/**/*.js','./routes/**/*.js', 'keystone.js', 'package.json']

    ,
    'style': {
        all: './public/styles/**/*.scss',
        output: './public/styles/'
    }

};

/**
 * logic for starting and restarting server process
 */


// node process
const spawn = require('child_process').spawn;
var node_process;
//
const dest_path = `.`;

let restartServer = function(){
    node_process.kill();
    node_process = startServer();
}
let startServer = function(){
    var local_node_process = spawn('node', ['keystone'], {cwd: dest_path});
    local_node_process.on('close', (code, signal) => {
        console.log(`-- Server process closed --`);
    });
    local_node_process.stdout.on('data', (data) => {
        console.log(`${data}`);
    });
    local_node_process.stderr.on('data', (data) => {
        console.log(`Error: ${data}`);
    });
    return local_node_process;
}

const server_files = ['./models/**/*.js','./routes/**/*.js', 'keystone.js', 'package.json'];
const watcher = gulp.watch(server_files);
watcher.on('change', function(event){
    restartServer();
})

// start the server process
node_process = startServer();


//gulp.task('runKeystone', shell.task('node keystone.js'));
gulp.task('watch', [

]);

gulp.task('default', ['watch']);//, 'runKeystone']);