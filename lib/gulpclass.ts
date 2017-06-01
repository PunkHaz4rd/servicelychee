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

    public tsSrc: Array<string> = ["./**/*.ts"];
    public jsSrc: Array<string> = ["./**/*.ts"];
    public resourceSrc: Array<string> = ["./**/*.json", "./**/*.yml", "./*.lock"];

    public src: Array<string> = [...this.tsSrc, ...this.resourceSrc];
    public runningSrc: Array<string> = [...this.jsSrc, ...this.resourceSrc];

    public environment: string = process.env.NODE_ENV || "production";

    protected tsProject: any = ts.createProject("./tsconfig.json");

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
        return pm2.connect((err) => {
            if (err) {
                console.error(err);
                process.exit(2);
            }

            let pm2Options: any = {
                name: "service",
                script: "./index", // Script to be run
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
    public async devRun(): Promise<void> {
        return this.dev()
            .then(this.server.bind(this));
    }

    @SequenceTask()
    public default(): Array<string> {
        return ["clean", "build", "server"];
    }
}
