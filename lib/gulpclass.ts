import { Gulpclass, SequenceTask, Task } from "gulpclass/Decorators";
import { spawn } from "child_process";

import * as gulp from "gulp";
import * as del from "del";
import * as ts from "gulp-typescript";
import * as watch from "gulp-watch";
import * as sourcemaps from "gulp-sourcemaps";
import * as pm2 from "pm2";


export interface PortConfig {
    web: number;
    debug: number;
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
};

@Gulpclass()
export default class Gulpfile {

    public static forConfig(config: GulpConfig = null): Function {
        if (config) {
            Object.keys(config).forEach(key => DEFAULT_CONFIG[key] = config[key]);
        }
        return Gulpfile;
    };

    // PATHS
    public tsSrc: Array<string> = ["./**/*.ts"];
    public jsSrc: Array<string> = ["./**/*.ts"];
    public resourceSrc: Array<string> = ["./**/*.json", "./**/*.yml", "./*.lock"];
    public src: Array<string> = [...this.tsSrc, ...this.resourceSrc];
    public runningSrc: Array<string> = [...this.jsSrc, ...this.resourceSrc];

    // CONFIG
    protected tsProject: any = ts.createProject("./tsconfig.json");
    protected config: GulpConfig = DEFAULT_CONFIG;

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
        return watch(this.tsSrc, async (): Promise<void> => {
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
                watch: (this.isDevMode()) ? this.src : undefined,
                ignore_watch: (this.isDevMode()) ? ["node_modules", ...this.tsSrc] : undefined,
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
                        if (this.isDevMode()) { // kill app on error in dev mode
                            pm2.killDaemon();
                        }
                    });
                });

                //});
            });
        });

    }

    @Task("test")
    public async test(): Promise<void> {
        spawn("node", ["."], { stdio: "inherit" });
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
