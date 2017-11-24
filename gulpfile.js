const gulp = require("gulp"),
    clean = require("gulp-clean"),
    sourcemaps = require("gulp-sourcemaps");
    sass = require("gulp-sass"),
    babel = require("gulp-babel"),
    browserSync = require("browser-sync").create(),
    runSequence = require("run-sequence");

// Cleans the dist directory
gulp.task("clean", () => {
    return gulp.src("./dist/", { read: false })
        .pipe(clean());
});

// Compiles sass to css
gulp.task("sass", () => {
    return gulp.src("./src/sass/*.scss")
        .pipe(sourcemaps.init())
        .pipe(sass()
        .on("error", sass.logError))
        .pipe(sourcemaps.write(""))
        .pipe(gulp.dest("./dist/css/"));
});

// ES5 to ES6 Compiler
gulp.task("babel", () => {
    return gulp.src("./src/js/app.js")
        .pipe(babel({
            presets: ["env"]
        }))
        .pipe(gulp.dest("./dist/js/"));
});

// Copies the local dependancy files
gulp.task("local-file-copy", () => {
    // jQuery
    gulp.src("./node_modules/jquery/dist/jquery.min.js")
        .pipe(gulp.dest("./dist/js/"));

    // Normalize.css
    gulp.src("./node_modules/normalize.css/normalize.css")
        .pipe(gulp.dest("./dist/css/"));

    // JSON Data
    gulp.src("./src/json/*.json")
        .pipe(gulp.dest("./dist/json/"));

    // Images
    gulp.src("./src/img/*.*")
        .pipe(gulp.dest("./dist/img/"));

    // Fonts
    gulp.src("./src/fonts/**/*.*")
        .pipe(gulp.dest("./dist/fonts/"));

    // Template7
    gulp.src("./node_modules/template7/dist/template7.min.js")
        .pipe(gulp.dest("./dist/js/"));
});

// Copies the HTML files
gulp.task("html-copy", () => {
    return gulp.src("./src/*.html")
        .pipe(gulp.dest("./dist/"));
});

// Configures the BrowserSync NPM module
gulp.task("browser-sync", () => {
    browserSync.init({
        server: {
            baseDir: "dist", // Where the server will start from
            index: "index.html" // Default file to load
        },
        port: 3000, // Default localhost port
        ui: {
            port: 3001 // Default UI localhost port
        },
        notify: false, // Turns off the notification that the browser has connected to BrowserSync server
        browser: [] // Enter a string or an array of strings to start specific browsers i.e. "google chrome", "safari" or "firefox". Keeping it empty will stop any browsers from opening
    });
});

// Reloads the browser
gulp.task("reload-browser", () => {
    return gulp.src("./dist/")
        .pipe(browserSync.reload({
            stream: true
        }));
});

// Task that builds the dist folder
gulp.task("build", (cb) => {
    runSequence("clean", "sass", "babel", "local-file-copy", "html-copy", "reload-browser", cb);
});

// Task that watches all files for changes and runs
// the build task when a file is changed
gulp.task("start", ["build", "browser-sync"], (cb) => {
    gulp.watch("./src/**/*.*", ["build"], cb);
});