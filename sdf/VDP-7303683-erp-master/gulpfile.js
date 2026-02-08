import gulp from "gulp";
import eslint from "gulp-eslint";
import fs from "fs";
import { exec } from 'child_process';
import upload from '@nscs/generator-project-folders-init/app/upload.js';
import gulpDocumentation from 'gulp-documentation';
import markdownPdf from 'gulp-markdown-pdf';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv)).argv

gulp.task("lint-report", function (done) {
    gulp
        .src(['**/*.js', '!node_modules/**'])
        .pipe(eslint({
            rules: {

            }
        }))
        //.pipe(eslint.format()) // stdout
        //.pipe(eslint.format("json", fs.createWriteStream("reports/lint_report-json.json")))
        .pipe(eslint.format("html", fs.createWriteStream("reports/lint_report-html.html")))

        .pipe(eslint.format("json", fs.createWriteStream("reports/lint_report.json")))
        .pipe(eslint.format("json", fs.createWriteStream("reports/lint_report.json")));




    exec('echo lint_report-html has been created inside of ./reports to view && sonar-scanner', function (err, stdout, stderr) {
        console.log(stdout);
        //console.log(stderr);
        done(err);
    });

    done();
});

gulp.task('oradocs', async function (done) {
    if (argv.file && argv.root && argv.job) {
        var path = argv.file;
        var root = argv.root;
        var job = argv.job;
        return await upload(path, root, job);
    }
});

gulp.task('document', function () {
    var arg = argv.options;

    var args = arg.split(' | ');
    var src = args[0];
    var file = args[1];

    return gulp.src(src + '/./*.js')
        .pipe(gulpDocumentation('md', { filename: file }))
        .pipe(gulp.dest('./docs/code_documentation'));
});

gulp.task('pdf', function () {
    try {
        var arg = argv.options;
        var args = arg.split(' | ');
        var src = args[0];
        var file = args[1];
        var folder = args[2];

        process.chdir('./' + folder);
        return gulp.src(file, { allowEmpty: true })
            .pipe(markdownPdf({ cssPath: './pdf-css/sdd.css' }))
            .pipe(gulp.dest(src))
    }
    catch (e) {
        console.log(e)
    }
});
