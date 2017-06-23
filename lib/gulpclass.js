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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var Decorators_1 = require("gulpclass/Decorators");
var gulp = require("gulp");
var del = require("del");
var ts = require("gulp-typescript");
var watch = require("gulp-watch");
var mocha = require("gulp-mocha");
var sourcemaps = require("gulp-sourcemaps");
var pm2 = require("pm2");
var _ = require("lodash");
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
var Gulpfile = Gulpfile_1 = (function () {
    function Gulpfile() {
        // CONFIG
        this.config = exports.DEFAULT_CONFIG;
        // PATHS
        this.src = this.config.path.typescript.concat(this.config.path.resources);
        this.ignoreRunningSrc = ["node_modules"].concat(this.config.path.typescript);
        this.runningSrc = this.config.path.generated.concat(this.config.path.resources);
        // PRE-CONFIG
        this.tsProject = ts.createProject(this.config.path.tsConfig);
    }
    /**
     * Update default configuration before using it
     * @param config to change the default
     * @return {Gulpfile} class of the gulpfile
     */
    Gulpfile.forConfig = function (config) {
        if (config === void 0) { config = null; }
        if (config) {
            _.merge(exports.DEFAULT_CONFIG, config);
        }
        console.log("Start working for config: " + JSON.stringify(exports.DEFAULT_CONFIG));
        return Gulpfile_1;
    };
    ;
    Gulpfile.prototype.isDevMode = function () {
        return this.config.environment.startsWith("dev");
    };
    Gulpfile.prototype.clean = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, del(["./lib/**/*.js", "./**/*.map"])];
            });
        });
    };
    Gulpfile.prototype.watch = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, watch(this.config.path.typescript, function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            console.log("TypeScript source changed. Transpiling...");
                            return [2 /*return*/, this.typescript()];
                        });
                    }); })];
            });
        });
    };
    Gulpfile.prototype.typescript = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.tsProject.src()
                            .pipe(sourcemaps.init())
                            .pipe(_this.tsProject())
                            .pipe(sourcemaps.write("."))
                            .pipe(gulp.dest(""))
                            .on("finish", resolve)
                            .on("error", reject);
                    })];
            });
        });
    };
    Gulpfile.prototype.build = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log("build for app: " + this.config.name);
                return [2 /*return*/, this.typescript()];
            });
        });
    };
    Gulpfile.prototype.serverStop = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, pm2.killDaemon()];
            });
        });
    };
    Gulpfile.prototype.server = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var MACHINE_NAME, PRIVATE_KEY, PUBLIC_KEY;
            return __generator(this, function (_a) {
                MACHINE_NAME = "hk1";
                PRIVATE_KEY = "XXXXX";
                PUBLIC_KEY = "XXXXX";
                return [2 /*return*/, pm2.connect(this.config.server.daemon, function (err) {
                        if (err) {
                            console.error("[PM2]:" + err);
                            process.exit(2);
                        }
                        pm2.start({
                            script: _this.config.path.index,
                            name: "" + _this.config.name,
                            exec_mode: (_this.isDevMode()) ? "fork" : "cluster",
                            instances: (_this.isDevMode()) ? 1 : _this.config.server.concurrency,
                            max_memory_restart: _this.config.server.maxMemory + "M",
                            maxRestarts: _this.config.server.maxRestarts,
                            source_map_support: true,
                            env: {
                                "NODE_ENV": _this.config.environment,
                                "PORT": _this.config.port.web,
                            },
                            cwd: _this.config.path.workingDir,
                            interpreterArgs: ["--inspect=" + _this.config.port.debug],
                            post_update: ["npm install"],
                            watch: (_this.isDevMode()) ? _this.runningSrc : undefined,
                            ignore_watch: (_this.isDevMode()) ? _this.ignoreRunningSrc : undefined,
                            watch_options: (_this.isDevMode()) ? {
                                followSymlinks: false
                            } : undefined,
                        }, function (err, apps) {
                            if (err) {
                                throw err;
                            }
                            //pm2.interact(PRIVATE_KEY, PUBLIC_KEY, MACHINE_NAME, () => {
                            // Display logs in standard output
                            pm2.launchBus(function (err, bus) {
                                console.log("[PM2] Log streaming started");
                                bus.on("log:out", function (packet) {
                                    console.log("[App:%s] %s", packet.process.name, packet.data);
                                });
                                bus.on("log:err", function (packet) {
                                    console.error("[App:%s][Err] %s", packet.process.name, packet.data);
                                    //if (this.isDevMode()) { // kill app on error in dev mode
                                    //    pm2.killDaemon();
                                    //}
                                });
                            });
                            //});
                        });
                    })];
            });
        });
    };
    Gulpfile.prototype.integrationTest = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.typescript().then(function () {
                        gulp.src(_this.config.path.integrationTests, { read: false })
                            .pipe(mocha({
                            reporter: 'spec',
                        }));
                    })];
            });
        });
    };
    Gulpfile.prototype.unitTest = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.typescript().then(function () {
                        gulp.src(_this.config.path.unitTests, { read: false })
                            .pipe(mocha({
                            reporter: 'spec',
                        }));
                    })];
            });
        });
    };
    Gulpfile.prototype.test = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.unitTest()
                        .then(this.integrationTest.bind(this))];
            });
        });
    };
    Gulpfile.prototype.dev = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.config.environment = process.env.NODE_ENV || "development";
                return [2 /*return*/, this.build()
                        .then(this.watch.bind(this))];
            });
        });
    };
    Gulpfile.prototype.devServer = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.dev()
                        .then(this.server.bind(this))];
            });
        });
    };
    Gulpfile.prototype.runServer = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.build()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.server()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Gulpfile.prototype.default = function () {
        return ["clean", "run:server"];
    };
    return Gulpfile;
}());
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
