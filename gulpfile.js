const gulp = require("gulp"),
    clean = require("gulp-clean"),
    sass = require("gulp-sass"),
    browserSync = require("browser-sync").create();
    runSequence = require("run-sequence");

gulp.task("clean", () => {
    return gulp.src("./dist/", { read: false })
        .pipe(clean());
});

gulp.task("sass", () => {
    return gulp.src("./src/sass/*.scss")
        .pipe(sass()
        .on("error", sass.logError))
        .pipe(gulp.dest("./dist/css/"));
});

gulp.task("file-copy", () => {
    gulp.src("./src/*.html")
        .pipe(gulp.dest("./dist/"));
});

// Configures the BrowserSync NPM module
gulp.task("browser-sync", () => {
    browserSync.init({
        server: {
            baseDir: "dist", // Where the server will start from
            index: "index.html" // Default file to load
        },
        port: 3000,
        ui: {
            port: 3001
        },
        notify: false, // Turns off the notification that the browser has connected to BrowserSync server
        browser: [] // Enter a string or an array of strings to start specific browsers i.e. "google chrome", "safari" or "firefox". Keeping it empty will stop any browsers from opening
    });
});

// Reloads the browser
gulp.task("reload-browser", () => {
    gulp.src("./temp/")
    .pipe(browserSync.reload({
        stream: true
    }));
});

gulp.task("build", (cb) => {
    runSequence("clean", "sass", "file-copy", "reload-browser", cb);
});

gulp.task("start", ["build", "browser-sync"], (cb) => {
    gulp.watch("./src/**/*.*", ["build"], cb);
});