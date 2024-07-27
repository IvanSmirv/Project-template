const gulp = require('gulp');
const fs = require('fs');
const server = require('gulp-server-livereload')
const fileinclude = require('gulp-file-include')
const clean = require('gulp-clean')
const less = require('gulp-less');
const cssmin = require('gulp-cssmin');
const jsmin = require('gulp-minify');
const rename = require("gulp-rename");
const imageMin = require('gulp-imagemin');
const archiver = require('gulp-archiver');
const pug = require('gulp-pug');
const merge = require('merge-stream');
const through2 = require('through2');

// =====================================================================================================
gulp.task('clean', function (done) {
    if (fs.existsSync('./dist/')) {
        return gulp.src("./dist/", { read: false })
            .pipe(clean({ force: true }))
    }
    done();
})

// =====================================================================================================
gulp.task('server', function () {
    return gulp.src('./dist/')
        .pipe(server({
            open: true,
            livereload: true
        }))
})

// =====================================================================================================
gulp.task('pug', function buildHTML() {
    return gulp.src('./src/*.pug')
        .pipe(pug({
            pretty: true
        }))
        .pipe(gulp.dest('dist/'));
});

// gulp.task('html', function () {
//     return gulp.src('./src/*.html')
//         .pipe(fileinclude({
//             prefix: '@@',
//             basepath: '@file'
//         }))
//         .pipe(gulp.dest('dist/'));
// });

// =====================================================================================================
gulp.task('styles-and-minify', function () {
    return gulp.src('./src/styles/main.less')
        .pipe(less())
        .pipe(gulp.dest('./dist/styles/'))
        .on('end', function () {
            gulp.src('./src/styles/**/*.css')
                .pipe(gulp.dest('./dist/styles/'));
            if (fs.existsSync('./dist/')) {
                return gulp.src('./dist/styles/main.css')
                    .pipe(cssmin())
                    .pipe(rename({ extname: '.min.css' }))
                    .pipe(gulp.dest('./dist/styles/'));
            }
        });
});

// =====================================================================================================
gulp.task('js-and-minify', function (done) {
    gulp.src('./src/js/**/*.js')
        .pipe(gulp.dest('./dist/js/'))
        .on('end', function () {
            if (fs.existsSync('./dist/')) {
                gulp.src('./src/js/**/*.js')
                    .pipe(jsmin({
                        ext: {
                            min: '.min.js'
                        }
                    }))
                    .pipe(gulp.dest('./dist/js/'));
            }
            done()
        });
});

// =====================================================================================================
gulp.task('images-and-minify', function () {
    return gulp.src('./src/img/**/*')
        .pipe(gulp.dest('./dist/img/'))
        .on('end', function () {
            if (fs.existsSync('./dist/')) {
                gulp.src('./dist/img/**/*.+(png|jpg|jpeg)')
                    .pipe(imageMin())
                    .pipe(gulp.dest('./dist/img/'));
            }
        });
})

// =====================================================================================================
gulp.task('fonts', function () {
    return gulp.src('./src/fonts/**/*')
        .pipe(gulp.dest('./dist/fonts/'))
})

// =====================================================================================================
const sizeData = [];
function getSizeStream(folderPath) {
    let totalSize = 0;

    return through2.obj(function (file, enc, cb) {
        if (file.stat && file.stat.size) {
            totalSize += file.stat.size;
        }
        cb(null, file);
    }, function (cb) {
        const totalSizeMB = Math.round(totalSize / 1024 / 1024 * 100) / 100;
        sizeData.push({
            'Путь к папке': folderPath,
            'Размер (MБ)': totalSizeMB
        });
        cb();
    });
}

gulp.task('size', function () {
    const folders = ['./dist/**/*', './src/**/*'];
    const tasks = folders.map((folder) => {
        const folderTitle = folder.replace('/**/*', '');
        return gulp.src(folder)
            .pipe(getSizeStream(folderTitle));
    });

    return merge(tasks).on('end', function () {
        console.table(sizeData);
    });
});

// =====================================================================================================
gulp.task('archive', function () {
    return gulp.src('dist/**')
        .pipe(archiver('archive.zip'))
        .pipe(gulp.dest('./'));
});

// =====================================================================================================
gulp.task('watch', () => {
    // gulp.watch('./src/**/*.html', gulp.parallel('html'));
    gulp.watch('./src/**/*.pug', gulp.parallel('pug'));
    gulp.watch('./src/styles/**/*', gulp.parallel('styles-and-minify'));
    gulp.watch('./src/js/**/*', gulp.parallel('js-and-minify'));
    gulp.watch('./src/img/**/*', gulp.parallel('images-and-minify'));
    gulp.watch('./src/fonts/**/*', gulp.parallel('fonts'));
    // gulp.watch(['./dist/**/*', './src/**/*'], gulp.series('size'));
})

// =====================================================================================================
gulp.task('default', gulp.series(
    'clean',
    gulp.parallel('pug', 'styles-and-minify', 'js-and-minify', 'images-and-minify', 'fonts'),
    gulp.parallel('server', 'watch')
))