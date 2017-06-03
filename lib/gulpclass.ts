import { Gulpclass, SequenceTask, Task } from "gulpclass/Decorators";
import { spawn } from "child_process";

import * as gulp from "gulp";
import * as del from "del";
import * as ts from "gulp-typescript";
import * as watch from "gulp-watch";
import * as sourcemaps from "gulp-sourcemaps";
import * as pm2 from "pm2";


@Gulpclass()
export default class Gulpfile {

    // PATHS
    public tsSrc: Array<string> = ["./**/*.ts"];
    public jsSrc: Array<string> = ["./**/*.ts"];
    public resourceSrc: Array<string> = ["./**/*.json", "./**/*.yml", "./*.lock"];
    public src: Array<string> = [...this.tsSrc, ...this.resourceSrc];
    public runningSrc: Array<string> = [...this.jsSrc, ...this.resourceSrc];

    // ENV
    public environment: string = process.env.NODE_ENV || "production";

    // CONFIG
    protected tsProject: any = ts.createProject("./tsconfig.json");

    protected webConcurrency: number = process.env.WEB_CONCURRENCY || -1; // Set by Heroku or -1 to scale to max cpu core -1
    protected maxMemory: number = process.env.WEB_MEMORY || 512;// " " "

    public isDevMode(): boolean {
        return this.environment.startsWith("dev");
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
        return this.typescript();
    }

    @Task("server")
    public async server(): Promise<void> {
        /*return pm2.connect((err) => {
         if (err) {
         console.error(err);
         process.exit(2);
         }

         let pm2Options: any = {
         name: "service",
         script: "./index.js", // Script to be run
         exec_mode: "cluster", // Allows your app to be clustered
         //instances : 4, // Optional: Scales your app by 4
         //max_memory_restart : "100M" // Optional: Restarts your app if it reaches 100Mo
         source_map_support: true,
         };
         if (this.isDevMode()) {
         pm2Options.watch = this.src;
         pm2Options.ignore_watch = ["node_modules", ...this.tsSrc];
         pm2Options.watch_options = {
         followSymlinks: false
         };
         }

         pm2.start(pm2Options, (err, apps) => {
         pm2.disconnect();   // Disconnects from PM2
         if (err) throw err;
         });
         });*/

        let MACHINE_NAME = 'hk1';
        let PRIVATE_KEY = 'XXXXX'; // Keymetrics Private key
        let PUBLIC_KEY = 'XXXXX'; // Keymetrics Public  key

        return pm2.connect(() => {
            pm2.start({
                script: './index.js',
                name: 'production-app', // ----> THESE ATTRIBUTES ARE OPTIONAL:
                exec_mode: 'cluster', // ----> https://github.com/Unitech/PM2/blob/master/ADVANCED_README.md#schema
                instances: this.webConcurrency,
                max_memory_restart: this.maxMemory + 'M', // Auto-restart if process takes more than XXmo
                env: {  // If needed declare some environment variables
                    "NODE_ENV": this.environment,
                },
                post_update: ["npm install"] // Commands to execute once we do a pull from Keymetrics
            }, () => {
                //pm2.interact(PRIVATE_KEY, PUBLIC_KEY, MACHINE_NAME, () => {

                // Display logs in standard output
                pm2.launchBus((err, bus) => {
                    console.log('[PM2] Log streaming started');

                    bus.on('log:out', function (packet) {
                        console.log('[App:%s] %s', packet.process.name, packet.data);
                    });

                    bus.on('log:err', function (packet) {
                        console.error('[App:%s][Err] %s', packet.process.name, packet.data);
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
        this.environment = process.env.NODE_ENV || "development";
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
