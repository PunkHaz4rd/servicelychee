import { Gulpclass, SequenceTask, Task } from "gulpclass/Decorators";
import { spawn } from "child_process";

import * as gulp from "gulp";
import * as del from "del";
import * as ts from "gulp-typescript";
import * as watch from "gulp-watch";
import * as mocha from "gulp-mocha";
import * as sourcemaps from "gulp-sourcemaps";
import * as pm2 from "pm2";
import * as _ from "lodash";


export interface PortConfig {
    web: number;
    debug: number;
}

export interface PathConfig {
    typescript: string[];
    generated: string[];
    resources: string[];
    integrationTests: string[];
    unitTests: string[];
    tsConfig: string;
}

/**
 * Configuration for the gulp, web server, running env, etc
 */
export interface GulpConfig {
    /**
     * Name of the app that will be present in the process table of the PM2 and in the logs
     */
    name: string,
    /**
     * Environment: development, production, testing
     * When starting with word "dev" it"s a development env with debug mode and live watch reloading.
     */
    environment?: string;
    /**
     * Web server process numbers
     * Set by Heroku or -1 to scale to max cpu core -1
     */
    webConcurrency?: number;
    /**
     * Max RAM memory when server will be reloaded
     */
    maxMemory?: number;
    /**
     * Ports to open the web, debug
     */
    port?: PortConfig;
    /**
     * Paths for the sources and configurations.
     */
    paths?: PathConfig;
}

/**
 * Default values for the configuration
 * @type {GulpConfig}
 */
export const DEFAULT_CONFIG: GulpConfig = {
    name: "app",
    environment: process.env.NODE_ENV || "production",
    webConcurrency: process.env.WEB_CONCURRENCY || -1,
    maxMemory: process.env.WEB_MEMORY || 512,
    port: {
        web: process.env.PORT || 8080,
        debug: process.env.PORT_DEBUG || 5050,
    },
    paths: {
        typescript: ["./**/*.ts"],
        generated: ["./**/*.js"],
        resources: ["./**/*.json", "./**/*.yml", "./*.lock"],
        integrationTests: ["./**/*.spec.js"],
        unitTests: ["./**/*.test.js"],
        tsConfig: "./tsconfig.json",
    }
};

@Gulpclass()
export default class Gulpfile {

    /**
     * Update default configuration before using it
     * @param config to change the default
     * @return {Gulpfile} class of the gulpfile
     */
    public static forConfig(config: GulpConfig = null): Function {
        if (config) {

            Object.keys(config).forEach(key => DEFAULT_CONFIG[key] = _.merge(config[key], DEFAULT_CONFIG[key]));
        }
        return Gulpfile;
    };

    // CONFIG
    protected config: GulpConfig = DEFAULT_CONFIG;

    // PATHS
    public src: string[] = [...this.config.paths.typescript, ...this.config.paths.resources];
    public ignoreRunningSrc: string[] = ["node_modules", ...this.config.paths.typescript];
    public runningSrc: string[] = [...this.config.paths.generated, ...this.config.paths.resources];

    // PRE-CONFIG
    protected tsProject: any = ts.createProject(this.config.paths.tsConfig);

    public isDevMode(): boolean {
        return this.config.environment.startsWith("dev");
    }

    @Task("clean")
    public async clean(): Promise<void> {
        return new Promise<void>((resolve, reject): void => {
            del(["./lib/**/*.js", "./gulpclass.js", "./**/*.map"], resolve);
        });
    }

    @Task("watch")
    public async watch(): Promise<void> {
        return watch(this.config.paths.typescript, async (): Promise<void> => {
            console.log("TypeScript source changed. Transpiling...");
            return this.typescript();
        });
    }

    @Task("typescript")
    public async typescript(): Promise<void> {
        return new Promise<void>((resolve, reject): void => {
            this.tsProject.src()
                .pipe(sourcemaps.init())
                .pipe(this.tsProject())
                .pipe(sourcemaps.write("."))
                .pipe(gulp.dest(""))
                .on("finish", resolve)
                .on("error", reject);
        });
    }

    @Task("build")
    public async build(): Promise<void> {
        console.log(`build for app: ${this.config.name}`);
        return this.typescript();
    }

    @Task("server:stop")
    public async serverStop(): Promise<void> {
        return pm2.killDaemon();
    }

    @Task("server")
    public async server(): Promise<void> {

        let MACHINE_NAME = "hk1";
        let PRIVATE_KEY = "XXXXX"; // Keymetrics Private key
        let PUBLIC_KEY = "XXXXX"; // Keymetrics Public  key

        return pm2.connect(() => {
            pm2.start({
                script: ".",
                name: this.config.name, // ----> THESE ATTRIBUTES ARE OPTIONAL:
                exec_mode: (this.isDevMode()) ? "fork" : "cluster", // ----> https://github.com/Unitech/PM2/blob/master/ADVANCED_README.md#schema
                instances: (this.isDevMode()) ? 1 : this.config.webConcurrency,
                max_memory_restart: this.config.maxMemory + "M", // Auto-restart if process takes more than XXmo
                source_map_support: true,
                env: {  // If needed declare some environment variables
                    "NODE_ENV": this.config.environment,
                    "PORT": this.config.port.web,
                },
                interpreterArgs: [`--debug=${this.config.port.debug}`],
                post_update: ["npm install"], // Commands to execute once we do a pull from Keymetrics
                watch: (this.isDevMode()) ? this.runningSrc : undefined,
                ignore_watch: (this.isDevMode()) ? this.ignoreRunningSrc : undefined,
                watch_options: (this.isDevMode()) ? {
                    followSymlinks: false
                } : undefined,
            }, () => {
                //pm2.interact(PRIVATE_KEY, PUBLIC_KEY, MACHINE_NAME, () => {

                // Display logs in standard output
                pm2.launchBus((err, bus) => {
                    console.log("[PM2] Log streaming started");

                    bus.on("log:out", (packet) => {
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

    }

    @Task("integration:test")
    public async integrationTest(): Promise<void> {
        return gulp.src(this.config.paths.integrationTests, { read: false })
            .pipe(mocha({
                reporter: 'spec',
                //globals: { },
            }));
    }

    @Task("unit:test")
    public async unitTest(): Promise<void> {
        return gulp.src(this.config.paths.unitTests, { read: false })
            .pipe(mocha({
                reporter: 'spec',
                //globals: { },
            }));
    }

    @Task("test")
    public async test(): Promise<void> {
        return this.unitTest().then(this.integrationTest.bind(this));
        //spawn("node", ["."], { stdio: "inherit" });
    }

    @Task("dev")
    public async dev(): Promise<void> {
        this.config.environment = process.env.NODE_ENV || "development";
        return this.build()
            .then(this.watch.bind(this));
    }

    @Task("dev:server")
    public async devServer(): Promise<void> {
        return this.dev()
            .then(this.server.bind(this));
    }

    @SequenceTask()
    public default(): Array<string> {
        return ["clean", "build", "server"];
    }
}
