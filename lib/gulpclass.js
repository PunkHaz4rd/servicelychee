"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Decorators_1 = require("gulpclass/Decorators");
const gulp = require("gulp");
const del = require("del");
const ts = require("gulp-typescript");
const watch = require("gulp-watch");
const mocha = require("gulp-mocha");
const sourcemaps = require("gulp-sourcemaps");
const pm2 = require("pm2");
const _ = require("lodash");
/**
 * Default values for the configuration
 * @type {GulpConfig}
 */
exports.DEFAULT_CONFIG = {
    name: "app",
    environment: process.env.NODE_ENV || "production",
    port: {
        web: process.env.PORT || 8080,
        debug: process.env.PORT_DEBUG || 5050,
    },
    path: {
        typescript: ["./**/*.ts"],
        generated: ["./**/*.js"],
        resources: ["./**/*.json", "./**/*.yml", "./*.lock"],
        integrationTests: ["./**/*.spec.js"],
        unitTests: ["./**/*.test.js"],
        tsConfig: "./tsconfig.json",
        index: ".",
        workingDir: ".",
    },
    server: {
        concurrency: process.env.WEB_CONCURRENCY || -1,
        maxMemory: process.env.WEB_MEMORY || 512,
        maxRestarts: 10,
        daemon: false,
    },
};
let Gulpfile = Gulpfile_1 = class Gulpfile {
    constructor() {
        // CONFIG
        this.config = exports.DEFAULT_CONFIG;
        // PATHS
        this.src = [...this.config.path.typescript, ...this.config.path.resources];
        this.ignoreRunningSrc = ["node_modules", ...this.config.path.typescript];
        this.runningSrc = [...this.config.path.generated, ...this.config.path.resources];
        // PRE-CONFIG
        this.tsProject = ts.createProject(this.config.path.tsConfig);
    }
    /**
     * Update default configuration before using it
     * @param config to change the default
     * @return {Gulpfile} class of the gulpfile
     */
    static forConfig(config = null) {
        if (config) {
            _.merge(exports.DEFAULT_CONFIG, config);
        }
        console.log(`Start working for config: ${JSON.stringify(exports.DEFAULT_CONFIG)}`);
        return Gulpfile_1;
    }
    ;
    isDevMode() {
        return this.config.environment.startsWith("dev");
    }
    clean() {
        return __awaiter(this, void 0, void 0, function* () {
            return del(["./lib/**/*.js", "./**/*.map"]);
        });
    }
    watch() {
        return __awaiter(this, void 0, void 0, function* () {
            return watch(this.config.path.typescript, () => __awaiter(this, void 0, void 0, function* () {
                console.log("TypeScript source changed. Transpiling...");
                return this.typescript();
            }));
        });
    }
    typescript() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.tsProject.src()
                    .pipe(sourcemaps.init())
                    .pipe(this.tsProject())
                    .pipe(sourcemaps.write("."))
                    .pipe(gulp.dest(""))
                    .on("finish", resolve)
                    .on("error", reject);
            });
        });
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`build for app: ${this.config.name}`);
            return this.typescript();
        });
    }
    serverStop() {
        return __awaiter(this, void 0, void 0, function* () {
            return pm2.killDaemon();
        });
    }
    server() {
        return __awaiter(this, void 0, void 0, function* () {
            let MACHINE_NAME = "hk1";
            let PRIVATE_KEY = "XXXXX"; // Keymetrics Private key
            let PUBLIC_KEY = "XXXXX"; // Keymetrics Public  key
            return pm2.connect(this.config.server.daemon, (err) => {
                if (err) {
                    console.error("[PM2]:" + err);
                    process.exit(2);
                }
                pm2.start({
                    script: this.config.path.index,
                    name: `${this.config.name}`,
                    exec_mode: (this.isDevMode()) ? "fork" : "cluster",
                    instances: (this.isDevMode()) ? 1 : this.config.server.concurrency,
                    max_memory_restart: this.config.server.maxMemory + "M",
                    maxRestarts: this.config.server.maxRestarts,
                    source_map_support: true,
                    env: {
                        "NODE_ENV": this.config.environment,
                        "PORT": this.config.port.web,
                    },
                    cwd: this.config.path.workingDir,
                    interpreterArgs: [`--inspect=${this.config.port.debug}`],
                    post_update: ["npm install"],
                    watch: (this.isDevMode()) ? this.runningSrc : undefined,
                    ignore_watch: (this.isDevMode()) ? this.ignoreRunningSrc : undefined,
                    watch_options: (this.isDevMode()) ? {
                        followSymlinks: false
                    } : undefined,
                }, (err, apps) => {
                    if (err) {
                        throw err;
                    }
                    //pm2.interact(PRIVATE_KEY, PUBLIC_KEY, MACHINE_NAME, () => {
                    // Display logs in standard output
                    pm2.launchBus((err, bus) => {
                        console.log("[PM2] Log streaming started");
                        bus.on("log:out", (packet) => {
                            // stream the logs
                            console.log("[App:%s] %s", packet.process.name, packet.data);
                        });
                        bus.on("log:err", (packet) => {
                            console.error("[App:%s][Err] %s", packet.process.name, packet.data);
                            //if (this.isDevMode()) { // kill app on error in dev mode
                            //    pm2.killDaemon();
                            //}
                        });
                    });
                    //});
                });
            });
        });
    }
    integrationTest() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.typescript().then(() => {
                gulp.src(this.config.path.integrationTests, { read: false })
                    .pipe(mocha({
                    reporter: 'spec',
                }));
            });
        });
    }
    unitTest() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.typescript().then(() => {
                gulp.src(this.config.path.unitTests, { read: false })
                    .pipe(mocha({
                    reporter: 'spec',
                }));
            });
        });
    }
    test() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.unitTest()
                .then(this.integrationTest.bind(this));
            //spawn("node", ["."], { stdio: "inherit" });
        });
    }
    dev() {
        return __awaiter(this, void 0, void 0, function* () {
            this.config.environment = process.env.NODE_ENV || "development";
            return this.build()
                .then(this.watch.bind(this));
        });
    }
    devServer() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dev()
                .then(this.server.bind(this));
        });
    }
    runServer() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.build();
            yield this.server();
        });
    }
    default() {
        return ["clean", "run:server"];
    }
};
__decorate([
    Decorators_1.Task("clean")
], Gulpfile.prototype, "clean", null);
__decorate([
    Decorators_1.Task("watch")
], Gulpfile.prototype, "watch", null);
__decorate([
    Decorators_1.Task("typescript")
], Gulpfile.prototype, "typescript", null);
__decorate([
    Decorators_1.Task("build")
], Gulpfile.prototype, "build", null);
__decorate([
    Decorators_1.Task("server:stop")
], Gulpfile.prototype, "serverStop", null);
__decorate([
    Decorators_1.Task("server")
], Gulpfile.prototype, "server", null);
__decorate([
    Decorators_1.Task("integration:test")
], Gulpfile.prototype, "integrationTest", null);
__decorate([
    Decorators_1.Task("unit:test")
], Gulpfile.prototype, "unitTest", null);
__decorate([
    Decorators_1.Task("test")
], Gulpfile.prototype, "test", null);
__decorate([
    Decorators_1.Task("dev")
], Gulpfile.prototype, "dev", null);
__decorate([
    Decorators_1.Task("dev:server")
], Gulpfile.prototype, "devServer", null);
__decorate([
    Decorators_1.Task("run:server")
], Gulpfile.prototype, "runServer", null);
__decorate([
    Decorators_1.SequenceTask()
], Gulpfile.prototype, "default", null);
Gulpfile = Gulpfile_1 = __decorate([
    Decorators_1.Gulpclass()
], Gulpfile);
exports.default = Gulpfile;
var Gulpfile_1;

//# sourceMappingURL=gulpclass.js.map
