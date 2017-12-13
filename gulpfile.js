const gulp = require("gulp"),
    clean = require("gulp-clean"),
    sourcemaps = require("gulp-sourcemaps");
    sass = require("gulp-sass"),
    autoprefixer = require("gulp-autoprefixer"),
    babel = require("gulp-babel"),
    uglify = require("gulp-uglify"),
    rename = require("gulp-rename"),
    htmlmin = require("gulp-htmlmin"),
    replace = require("gulp-replace"),
    browserSync = require("browser-sync").create(),
    merge = require("merge-stream"),
    runSequence = require("run-sequence");

// Cleans the temp directory
gulp.task("clean", () => {
    return gulp.src("./temp/", { read: false })
        .pipe(clean());
});

// Compiles sass to css
gulp.task("sass", () => {
    return gulp.src("./src/sass/*.scss")
        .pipe(sourcemaps.init())
        .pipe(sass({
            outputStyle: "compressed"
        })
        .on("error", sass.logError))
        .pipe(autoprefixer({
            browsers: ["last 2 versions"]
        }))
        .pipe(rename("style.min.css"))
        .pipe(sourcemaps.write(""))
        .pipe(gulp.dest("./temp/css/"));
});

// ES5 to ES6 Compiler
gulp.task("babel", () => {
    return gulp.src("./src/js/app.js")
        .pipe(babel({
            presets: ["env"]
        }))
        .pipe(gulp.dest("./temp/js/"));
});

// Copies the local dependancy files
gulp.task("local-file-copy", () => {
    // jQuery
    const jQ = gulp.src("./node_modules/jquery/dist/jquery.min.js")
        .pipe(gulp.dest("./temp/js/")),

    // Normalize.css
    normalize = gulp.src("./node_modules/normalize.css/normalize.css")
        .pipe(gulp.dest("./temp/css/")),

    // JSON Data
    json = gulp.src("./src/json/*.json")
        .pipe(gulp.dest("./temp/json/")),

    // Images
    img = gulp.src("./src/img/*.*")
        .pipe(gulp.dest("./temp/img/")),

    // Fonts
    fonts = gulp.src("./src/fonts/**/*.*")
        .pipe(gulp.dest("./temp/fonts/")),

    // Favicon
    favicon = gulp.src("./src/favicon.png")
        .pipe(gulp.dest("./temp/")),

    // Font-awesome
    faCSS = gulp.src("./node_modules/font-awesome/css/font-awesome.min.css")
        .pipe(gulp.dest("./temp/css/")),

    faFont = gulp.src("./node_modules/font-awesome/fonts/*.*")
        .pipe(gulp.dest("./temp/fonts/")),

    // Tooltipster CSS
    tooltipsterCSS = gulp.src("./node_modules/tooltipster/dist/css/tooltipster.bundle.min.css")
        .pipe(gulp.dest("./temp/css/")),

    // Tooltipster Theme CSS
    tooltipsterThemeCSS = gulp.src("./node_modules/tooltipster/dist/css/plugins/tooltipster/sideTip/themes/tooltipster-sideTip-punk.min.css")
    .pipe(gulp.dest("./temp/css/")),

    // Tooltipster JS
    tooltipsterJS = gulp.src("./node_modules/tooltipster/dist/js/tooltipster.bundle.min.js")
        .pipe(gulp.dest("./temp/js/")),
    
    // Date Picker JS
    datePickerJS = gulp.src("./node_modules/@fengyuanchen/datepicker/dist/datepicker.min.js")
        .pipe(gulp.dest("./temp/js/")),

    // Date Picker CSS
    datePickerCSS = gulp.src("./node_modules/@fengyuanchen/datepicker/dist/datepicker.min.css")
        .pipe(gulp.dest("./temp/css/")),

    // Slick CSS
    slickCSS = gulp.src("./node_modules/slick-carousel/slick/slick.css")
        .pipe(gulp.dest("./temp/css/slick/")),

    // Slick Theme CSS
    slickThemeCSS = gulp.src("./node_modules/slick-carousel/slick/slick-theme.css")
        .pipe(gulp.dest("./temp/css/slick/")),

    // Slick JS
    slickJS = gulp.src("./node_modules/slick-carousel/slick/slick.min.js")
        .pipe(gulp.dest("./temp/js/slick/")),

    // Slick Fonts
    slickFonts = gulp.src("./node_modules/slick-carousel/slick/fonts/*.*")
        .pipe(gulp.dest("./temp/css/slick/fonts/")),

    // Slick AJAX Loader
    slickAjaxLoader = gulp.src("./node_modules/slick-carousel/slick/ajax-loader.gif")
        .pipe(gulp.dest("./temp/css/slick/")),

    // Animate.css
    animate = gulp.src("./node_modules/animate.css/animate.min.css")
        .pipe(gulp.dest("./temp/css/"));

    return merge(jQ, normalize, json, img, fonts, favicon, faCSS, faFont, tooltipsterCSS, tooltipsterThemeCSS, tooltipsterJS, datePickerJS, datePickerCSS, slickCSS, slickThemeCSS, slickJS, slickFonts, slickAjaxLoader, animate);
});

// Copies the HTML files
gulp.task("html-min", () => {
    return gulp.src(["./src/*.html", "./src/ajax/*.*"], { base: "./src/" })
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true
        }))
        .pipe(gulp.dest("./temp/"));
});

// Configures the BrowserSync NPM module
gulp.task("browser-sync", () => {
    browserSync.init({
        server: {
            baseDir: "temp", // Where the server will start from
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
    return gulp.src("./temp/")
        .pipe(browserSync.reload({
            stream: true
        }));
});

// Task that builds the temp folder
gulp.task("build:temp", (cb) => {
    runSequence("clean", "sass", "babel", "local-file-copy", "html-min", "reload-browser", cb);
});

// Task that watches all files for changes and runs
// the build task when a file is changed
gulp.task("start", ["build:temp", "browser-sync"], (cb) => {
    gulp.watch("./src/**/*.*", ["build:temp"], cb);
});

//////////////////////////////////
//// BUILDING THE DIST FOLDER ////
//////////////////////////////////

// Cleans the dist directory
gulp.task("clean-dist", () => {
    return gulp.src("./dist/", { read: false })
        .pipe(clean());
});

gulp.task("html-replace", () => {
    return gulp.src("./temp/*.html")
        .pipe(replace("<link rel=\"stylesheet\" href=\"./fonts/Josefin_Sans/JosefinSans-Thin.ttf\"><link rel=\"stylesheet\" href=\"./fonts/Josefin_Sans/JosefinSans-Light.ttf\">", "<link href=\"https://fonts.googleapis.com/css?family=Josefin+Sans:100,300\" rel=\"stylesheet\">"))
        .pipe(replace("./css/normalize.css", "https://cdnjs.cloudflare.com/ajax/libs/normalize/7.0.0/normalize.min.css"))
        .pipe(replace("./css/font-awesome.min.css", "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"))
        .pipe(replace("./css/datepicker.min.css", "https://cdnjs.cloudflare.com/ajax/libs/datepicker/0.6.4/datepicker.min.css"))
        .pipe(replace("./css/slick/slick.css", "https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.8.1/slick.min.css"))
        .pipe(replace("./css/slick/slick-theme.css", "https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.8.1/slick-theme.min.css"))
        .pipe(replace("./css/animate.min.css", "https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.5.2/animate.min.css"))
        .pipe(replace("./js/jquery.min.js", "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.min.js"))
        .pipe(replace("./js/datepicker.min.js", "https://cdnjs.cloudflare.com/ajax/libs/datepicker/0.6.4/datepicker.min.js"))
        .pipe(replace("./js/slick/slick.min.js", "https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.8.1/slick.min.js"))
        .pipe(replace("./js/app.js", "./js/app.min.js"))
        .pipe(gulp.dest("./dist/"));
});

// Copies the local dependancy files
gulp.task("dist-file-copy", (cb) => {
    // JSON Data
    const json = gulp.src("./temp/json/*.json")
        .pipe(gulp.dest("./dist/json/")),

    ajaxData = gulp.src("./temp/ajax/*.*")
        .pipe(gulp.dest("./dist/ajax/")),

    // Images
    img = gulp.src("./temp/img/**/*.*")
        .pipe(gulp.dest("./dist/img/")),

    // Favicon
    favicon = gulp.src("./temp/favicon.png")
        .pipe(gulp.dest("./dist/")),

    // CSS
    css = gulp.src("./temp/css/style.min.css")
        .pipe(replace("@font-face{font-family:\"Josefin Sans\";src:url(\"../fonts/Josefin_Sans/JosefinSans-Light.ttf\"),url(\"../fonts/Josefin_Sans/JosefinSans-Thin.ttf\")}", ""))
        .pipe(gulp.dest("./dist/css/")),

    // Tooltipster
    tooltipsterBundleCss = gulp.src("./temp/css/tooltipster.bundle.min.css")
        .pipe(gulp.dest("./dist/css/")),
    
    tooltipsterThemeCss = gulp.src("./temp/css/tooltipster-sideTip-punk.min.css")
        .pipe(gulp.dest("./dist/css/")),

    tooltipsterJs = gulp.src("./temp/js/tooltipster.bundle.min.js")
        .pipe(gulp.dest("./dist/js/"));

    return merge(json, ajaxData, img, favicon, css, tooltipsterBundleCss, tooltipsterThemeCss, tooltipsterJs);
});

gulp.task("uglify-js", () => {
    return gulp.src("./temp/js/app.js")
        .pipe(uglify())
        .pipe(rename("app.min.js"))
        .pipe(gulp.dest("./dist/js/"));
});

gulp.task("build:dist", (cb) => {
    runSequence("build:temp", "clean-dist", "html-replace", "dist-file-copy", "uglify-js", cb);
});