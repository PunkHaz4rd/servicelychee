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
var child_process_1 = require("child_process");
var gulp = require("gulp");
var del = require("del");
var ts = require("gulp-typescript");
var watch = require("gulp-watch");
var sourcemaps = require("gulp-sourcemaps");
var pm2 = require("pm2");
var Gulpfile = (function () {
    function Gulpfile() {
        this.tsSrc = ["./**/*.ts"];
        this.jsSrc = ["./**/*.ts"];
        this.resourceSrc = ["./**/*.json", "./**/*.yml", "./*.lock"];
        this.src = this.tsSrc.concat(this.resourceSrc);
        this.runningSrc = this.jsSrc.concat(this.resourceSrc);
        this.environment = process.env.NODE_ENV || "production";
        this.tsProject = ts.createProject("./tsconfig.json");
    }
    Gulpfile.prototype.isDevMode = function () {
        return this.environment.startsWith("dev");
    };
    Gulpfile.prototype.clean = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        del(["./lib/**/*.js", "./gulpclass.js", "./**/*.map"], resolve);
                    })];
            });
        });
    };
    Gulpfile.prototype.watch = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, watch(this.tsSrc, function () { return __awaiter(_this, void 0, void 0, function () {
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
                return [2 /*return*/, this.typescript()];
            });
        });
    };
    Gulpfile.prototype.server = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, pm2.connect(function (err) {
                        if (err) {
                            console.error(err);
                            process.exit(2);
                        }
                        var pm2Options = {
                            name: "service",
                            script: "./index",
                            exec_mode: "cluster",
                            //instances : 4, // Optional: Scales your app by 4
                            //max_memory_restart : "100M" // Optional: Restarts your app if it reaches 100Mo
                            source_map_support: true,
                        };
                        if (_this.isDevMode()) {
                            pm2Options.watch = _this.src;
                            pm2Options.ignore_watch = ["node_modules"].concat(_this.tsSrc);
                            pm2Options.watch_options = {
                                followSymlinks: false
                            };
                        }
                        pm2.start(pm2Options, function (err, apps) {
                            pm2.disconnect(); // Disconnects from PM2
                            if (err)
                                throw err;
                        });
                    })];
            });
        });
    };
    Gulpfile.prototype.test = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                child_process_1.spawn("node", ["."], { stdio: "inherit" });
                return [2 /*return*/];
            });
        });
    };
    Gulpfile.prototype.dev = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.environment = process.env.NODE_ENV || "development";
                return [2 /*return*/, this.build()
                        .then(this.watch.bind(this))];
            });
        });
    };
    Gulpfile.prototype.devRun = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.dev()
                        .then(this.server.bind(this))];
            });
        });
    };
    Gulpfile.prototype.default = function () {
        return ["clean", "build", "server"];
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
    Decorators_1.Task("server")
], Gulpfile.prototype, "server", null);
__decorate([
    Decorators_1.Task("test")
], Gulpfile.prototype, "test", null);
__decorate([
    Decorators_1.Task("dev")
], Gulpfile.prototype, "dev", null);
__decorate([
    Decorators_1.Task("dev:server")
], Gulpfile.prototype, "devRun", null);
__decorate([
    Decorators_1.SequenceTask()
], Gulpfile.prototype, "default", null);
Gulpfile = __decorate([
    Decorators_1.Gulpclass()
], Gulpfile);
exports.default = Gulpfile;

//# sourceMappingURL=gulpclass.js.map