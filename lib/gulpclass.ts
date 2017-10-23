import { Gulpclass, SequenceTask, Task } from "gulpclass/Decorators";
import { spawn } from "child_process";
import { StartOptions } from "pm2";

import * as gulp from "gulp";
import * as del from "del";
import * as ts from "gulp-typescript";
import * as watch from "gulp-watch";
import * as mocha from "gulp-mocha";
import * as env from "gulp-env";
import * as sourcemaps from "gulp-sourcemaps";
import * as pm2 from "pm2";
import * as _ from "lodash";
import * as fs from "fs";
import * as gitUserName from "git-user-name";
import * as gitBranch from "git-branch";
import * as gitRepoName from "git-repo-name";
import * as gitUserEmail from "git-user-email";
import * as gitRemoteUserName from "git-username";


export interface PortConfig {
    web: string | number;
    debug: string | number;
}

export interface PathConfig {
    typescript: string[];
    generated: string[];
    resources: string[];
    integrationTests: string[];
    unitTests: string[];
    tsConfig: string;
    index: string;
    workingDir: string;
}

export interface ServerConfig {
    /**
     * Web server process numbers
     * Set by Heroku or -1 to scale to max cpu core -1
     */
    concurrency: string | number;
    /**
     * Max RAM memory when server will be reloaded
     */
    maxMemory: string | number;
    /**
     * The maximum number of times in a row a script will be restarted if it exits in less than minUptime
     */
    maxRestarts: string | number;
    /**
     * Should server be run in daemon mode
     */
    daemon: boolean;
    /**
     * Arguments for the server apps
     */
    args?: string;
    /**
     * Force clustr mode even on dev
     */
    forceClusterMode: boolean;
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
     * Namespace for the configuration app containing env variables and other config. By default is "."
     */
    config: string,
    /**
     * Environment: development, production, testing
     * When starting with word "dev" it"s a development env with debug mode and live watch reloading.
     */
    environment?: string;
    /**
     * Ports to open the web, debug
     */
    port?: PortConfig;
    /**
     * Paths for the sources and configurations.
     */
    path?: PathConfig;
    /**
     * Config dedicated to the server part of the application that listening on some actions.
     */
    server?: ServerConfig;
}

/**
 * Default values for the configuration
 * @type {GulpConfig}
 */
export const DEFAULT_CONFIG: GulpConfig = {
    name: "app",
    config: ".",
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
        forceClusterMode: process.env.CLUSTER_MODE === "true" || false,
        daemon: false,
    },
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
            _.merge(DEFAULT_CONFIG, config);
        }
        console.log(`Start working for config: ${JSON.stringify(DEFAULT_CONFIG)}`);
        return Gulpfile;
    };

    // CONFIG
    protected config: GulpConfig = DEFAULT_CONFIG;

    // PATHS
    public src: string[] = [...this.config.path.typescript, ...this.config.path.resources];
    public ignoreRunningSrc: string[] = ["node_modules", ...this.config.path.typescript];
    public runningSrc: string[] = [...this.config.path.generated, ...this.config.path.resources];

    // PRE-CONFIG
    protected tsProject: any = ts.createProject(this.config.path.tsConfig);

    public isDevMode(): boolean {
        return this.config.environment.startsWith("dev");
    }

    public async fileExists(path: string, permissions = fs.constants.R_OK): Promise<boolean> {
        return new Promise<boolean>(r => fs.access(path, permissions, e => r(!e)));
    }

    public async _envFromMap(map: {[key:string]: string}): Promise<{}> {
        console.log(`Setting environment for ${JSON.stringify(map)}`);

        let envs = await env({
            vars: map,
        });
        return Promise.resolve(envs);
    }

    public async _envFromNamespace(namespace: string): Promise<{}> {
        let path = `${namespace}.ts`;
        if (!(await this.fileExists(path))) {
            return Promise.resolve({});
        } else {
            console.log(`Reading environment from ${path}`);
            let envs = await env({
                file: path,
                handler: (content: string, filename: string): {} => {
                    let envs = eval(this.tsProject.typescript.transpile(content));
                    Object.keys(envs).forEach(key => {
                        console.log('env', key, envs[key])
                        if (process.env[key]) {
                            envs[key] = process.env[key];
                        }
                    });
                    return envs;
                },
            });
            return Promise.resolve(envs);
        }
    }

    public async env(prefix: string): Promise<void> {
        this._envFromMap({
            GIT_USER_EMAIL: gitUserEmail(),
            GIT_USER_NAME: gitUserName(),
            GIT_USER: gitRemoteUserName(),
            GIT_REPOSITORY: gitRepoName.sync(),
            GIT_BRANCH: gitBranch.sync(),
        });
        let globalPrefix = `${this.config.config}/${prefix}`;
        let localPrefix = `./${prefix}`;
        let branch = (process.env.GIT_BRANCH in ["production", "test"]) ? process.env.GIT_BRANCH : "development";

        await this._envFromNamespace(`${globalPrefix}.${branch}.${process.env.GIT_USER}.${process.env.GIT_REPOSITORY}`);
        await this._envFromNamespace(`${globalPrefix}.${branch}.${process.env.GIT_USER}`);
        await this._envFromNamespace(`${globalPrefix}.${process.env.GIT_USER}.${process.env.GIT_REPOSITORY}`);
        await this._envFromNamespace(`${globalPrefix}.${process.env.GIT_USER}`);
        await this._envFromNamespace(`${globalPrefix}.${branch}.${process.env.GIT_REPOSITORY}`);
        await this._envFromNamespace(`${globalPrefix}.${branch}`);
        await this._envFromNamespace(`${globalPrefix}.${process.env.GIT_REPOSITORY}`);
        await this._envFromNamespace(globalPrefix);
        await this._envFromNamespace(localPrefix);
    }

    @Task("env:server")
    public async envServer(): Promise<void> {
        return this.env("config.server");
    }

    @Task("env:client")
    public async envClient(): Promise<void> {
        return this.env("config.client");
    }

    @Task("env:deploy")
    public async envDeploy(): Promise<void> {
        return this.env("config.deploy");
    }

    @Task("clean")
    public async clean(): Promise<void> {
        return del(["./lib/**/*.js", "./**/*.map"]);
    }

    @Task("watch")
    public async watch(): Promise<void> {
        return watch(this.config.path.typescript, async (): Promise<void> => {
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
        return pm2.killDaemon((err: any, apps): void => {
            if (err) {
                throw err;
            }
        });
    }

    @Task("server")
    public async server(): Promise<void> {

        let MACHINE_NAME = "hk1";
        let PRIVATE_KEY = "XXXXX"; // Keymetrics Private key
        let PUBLIC_KEY = "XXXXX"; // Keymetrics Public  key

        return pm2.connect(this.config.server.daemon, (err: any): void => {
            if (err) {
                console.error("[PM2]:"+err);
                process.exit(2);
            }

            pm2.start(<StartOptions>{
                script: this.config.path.index,
                args: this.config.server.args,
                name: `${this.config.name}`, // this is hack to fix the pm2 error for setting this as a reference
                exec_mode: (!this.config.server.forceClusterMode && this.isDevMode()) ? "fork" : "cluster", // ----> https://github.com/Unitech/PM2/blob/master/ADVANCED_README.md#schema
                instances: (this.isDevMode()) ? 1 : this.config.server.concurrency,
                max_memory_restart: this.config.server.maxMemory + "M", // Auto-restart if process takes more than XXmo
                maxRestarts: this.config.server.maxRestarts,
                source_map_support: true,
                env: {  // If needed declare some environment variables
                    "NODE_ENV": this.config.environment,
                    "PORT": this.config.port.web,
                },
                cwd: this.config.path.workingDir,
                interpreterArgs: [`--inspect=${this.config.port.debug}`],
                post_update: ["npm install"], // Commands to execute once we do a pull from Keymetrics
                watch: this.isDevMode(),//(this.isDevMode()) ? this.runningSrc : undefined,
                ignore_watch: (this.isDevMode()) ? this.ignoreRunningSrc : undefined,
                watch_options: (this.isDevMode()) ? {
                    followSymlinks: false
                } : undefined,
            }, (err: any, apps): void => {
                if (err) {
                    throw err;
                }

                //pm2.interact(PRIVATE_KEY, PUBLIC_KEY, MACHINE_NAME, () => {

                // Display logs in standard output
                pm2.launchBus((err: any, bus): void => {
                    console.log("[PM2] Log streaming started");

                    bus.on("log:out", (packet): void => {
                        // stream the logs
                        console.log("[App:%s] %s", packet.process.name, packet.data);
                    });

                    bus.on("log:err", (packet): void => {
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
        await this.envServer();
        return this.typescript().then(() => {
            gulp.src(this.config.path.integrationTests, { read: false })
                .pipe(mocha({
                    reporter: 'spec',
                    //globals: { },
                }));
        });
    }

    @Task("unit:test")
    public async unitTest(): Promise<void> {
        await this.envServer();
        return this.typescript().then(() => {
            gulp.src(this.config.path.unitTests, { read: false })
                .pipe(mocha({
                    reporter: 'spec',
                    //globals: { },
                }));
        });
    }

    @Task("test")
    public async test(): Promise<void> {
        return this.unitTest()
            .then(this.integrationTest.bind(this));
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
        await this.envServer();
        return this.dev()
            .then(this.server.bind(this));
    }

    @Task("run:server")
    public async runServer(): Promise<void> {
        await this.envServer();
        await this.build();
        await this.server();
    }


    @SequenceTask()
    public default(): Array<string> {
        return ["clean", "run:server"];
    }
}
