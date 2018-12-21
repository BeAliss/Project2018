// plugins for development
var gulp = require('gulp'),
	rimraf = require('rimraf'),
	jade = require('gulp-jade'),
	sass = require('gulp-sass'),
	inlineimage = require('gulp-inline-image'),
	prefix = require('gulp-autoprefixer'),
	plumber = require('gulp-plumber'),
	browserSync = require('browser-sync').create(),
	concat = require('gulp-concat'),
	cssfont64 = require('gulp-cssfont64'),
	sourcemaps = require('gulp-sourcemaps'),
	postcss = require('gulp-postcss'),
	assets  = require('postcss-assets'),
	babel  = require('gulp-babel');

// plugins for build
var purify = require('gulp-purifycss'),
	uglify = require('gulp-uglify'),
	imagemin = require('gulp-imagemin'),
	pngquant = require('imagemin-pngquant'),
	csso = require('gulp-csso');



var assetsDir = 'assets/';
var outputDir = 'app/';
var buildDir = 'build/';

//----------------------------------------------------Compiling
// Компиляция babel ->js
gulp.task("babel", function () {
	return gulp.src(assetsDir + 'js/*.js')
	  .pipe(babel())
	  .pipe(gulp.dest(outputDir + 'js/'))
	  .pipe(browserSync.stream());
  });

// Компиляция PUG ->HTML
	gulp.task('jade', function () {
		gulp.src([assetsDir + 'jade/**/*.jade', '!' + assetsDir + 'jade/_*.jade', '!' + assetsDir + 'jade/tpl/_*.jade', '!' + assetsDir + 'jade/layout/_*.jade'])
			.pipe(plumber())
			.pipe(jade({pretty: true}))
			.pipe(gulp.dest(outputDir))
			.pipe(browserSync.stream());
	});

// Компиляция SASS -> CSS
	gulp.task('sass', function () {
		gulp.src([assetsDir + 'sass/**/*.sass', '!' + assetsDir + 'sass/**/_*.sass', assetsDir + 'sass/**/*.scss', '!' + assetsDir + 'sass/**/_*.scss'])
			.pipe(plumber())
			.pipe(sourcemaps.init())
			.pipe(sass())
			.pipe(inlineimage())
			.pipe(prefix('last 3 versions'))
			.pipe(postcss([assets({
				basePath:outputDir,
				loadPaths: ['i/']
			})]))
			.pipe(sourcemaps.write())
			.pipe(gulp.dest(outputDir + 'css/'))
			.pipe(browserSync.stream());
	});

// Сборка всех библеотек js
	gulp.task('jsConcat', function () {
		return gulp.src(assetsDir + 'js/all/**/*.js')
			.pipe(concat('all.js', {newLine: ';'}))
			.pipe(gulp.dest(outputDir + 'js/'))
			.pipe(browserSync.stream());
	});

// Конвертация шрифтов
	gulp.task('fontsConvert', function () {
		return gulp.src([assetsDir + 'fonts/*.woff', assetsDir + 'fonts/*.woff2'])
			.pipe(cssfont64())
			.pipe(gulp.dest(outputDir + 'css/'))
			.pipe(browserSync.stream());
	});


// Копирование img из assets в app
	gulp.task('imageSync', function () {
		return gulp.src(assetsDir + 'img/**/*')
			.pipe(gulp.dest(outputDir + 'img/'))
			.pipe(browserSync.stream());

	});

// Копирование fonts из assets в app
	gulp.task('fontsSync', function () {
		return gulp.src(assetsDir + 'fonts/**/*')
			.pipe(gulp.dest(outputDir + 'fonts/'))
			.pipe(browserSync.stream());
	});


//livereload and open project in browser
gulp.task('browser-sync', function () {
	browserSync.init({
		port: 1337,
		server: {
			baseDir: outputDir
		},

		// tunnel: true,
		// tunnel: "name", //http://name.localtunnel.me

	});
});


//---------------------------------building final project folder
//clean build folder
gulp.task('cleanBuildDir', function (cb) {
	rimraf(buildDir, cb);
});


//minify images
gulp.task('imgBuild', function () {
	return gulp.src([outputDir + 'img/**/*', '!' + outputDir + 'img/sprite/*.svg'])
		.pipe(imagemin({
			progressive: true,
			svgoPlugins: [{removeViewBox: false}],
			use: [pngquant()]
		}))
		.pipe(gulp.dest(buildDir + 'img/'))
});


//copy, minify css
gulp.task('cssBuild', function () {
	return gulp.src(outputDir + 'css/**/*')
		.pipe(purify([outputDir + 'js/**/*', outputDir + '**/*.html']))
		.pipe(csso())
		.pipe(gulp.dest(buildDir + 'css/'))
});


//copy fonts
gulp.task('fontsBuild', function () {
	return gulp.src(outputDir + '/fonts/**/*')
		.pipe(gulp.dest(buildDir + '/fonts/'))
});

//copy html
gulp.task('htmlBuild', function () {
	return gulp.src(outputDir + '**/*.html')
		.pipe(gulp.dest(buildDir))
});

//copy and minify js
gulp.task('jsBuild', function () {
	return gulp.src(outputDir + 'js/**/*')
		.pipe(uglify())
		.pipe(gulp.dest(buildDir + 'js/'))
});

gulp.task('watch', function () {
	gulp.watch(assetsDir + 'jade/**/*.jade', gulp.parallel('jade'));
	gulp.watch(assetsDir + 'sass/**/*.scss', gulp.parallel('sass'));
	gulp.watch(assetsDir + 'sass/**/*.sass', gulp.parallel('sass'));
	gulp.watch(assetsDir + 'js/**/*.js', gulp.parallel('babel')); 
	gulp.watch(assetsDir + 'js/all/**/*.js', gulp.parallel('jsConcat'));
	gulp.watch(assetsDir + 'img/**/*', gulp.series('imageSync'));
	gulp.watch(assetsDir + 'fonts/**/*', gulp.series('fontsSync'));
});
gulp.task('default', gulp.parallel('jade', 'sass', 'imageSync', 'fontsSync', 'fontsConvert', 'jsConcat','babel', 'watch', 'browser-sync'));

gulp.task('build', gulp.parallel('cleanBuildDir','imgBuild',  'htmlBuild', 'jsBuild', 'cssBuild', 'fontsBuild'));