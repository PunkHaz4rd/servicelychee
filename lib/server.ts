import * as sourceMapSupport from "source-map-support";
import * as mongoose from "mongoose";
import * as bluebird from "bluebird";
// for heroku to bind to a http port
import * as express from "express";
// List of the component router instances  (name in plural form)
//import { service as seed }  from "./seed";

import { default as Service, Microplum } from "microplum";


/**
 * The server main class
 */
export class Server {

    /**
     * Seneca microservice connector
     */
    public microplum: Microplum;

    /**
     * Bootstrap the application.
     *
     * @method bootstrap
     * @static
     * @return {ng.auto.IInjectorService} Returns the newly created injector for this app.
     */
    public static bootstrap(config: any): Server {
        return new Server(config);
    }

    /**
     * Server constructor. Create and configure expressjs application
     *
     * @constructor
     */
    constructor(public config: any) {
        // errors thrown with the typescript files not generated js
        sourceMapSupport.install();
        this.microplum = new Service({
            app: this.config.app || "app",
            roles: this.config.roles || [],
            version: 2,
            amqpUrl: this.config.amqp.url,
            debugUserId: this.config.debugUserId,
        });
        this.microplum.client();
        this.dbConnection();
        this.routes();
        this.errorHandling();
        this.microplum.listen();
        this.seed();
        this.listen();
    }

    /**
     * Set-up db connection
     */
    public dbConnection(): void {
        //mongoose.Promise = bluebird;
        (<any>mongoose).Promise = bluebird;
        mongoose.connect(this.config.mongo.url);
    }

    /**
     * Add all routes
     */
    public routes(): void {
        //this.microplum.useService(seed);
    }

    /**
     * Clean and seed the db with initial data if set in the config file
     */
    public seed(): void {
        /*if (this.config.seedDB) {
            this.microplum.actPromise({ role: "app", cmd: "reset", seed: true });
        }*/
    }

    /**
     * Raise unhandled exceptions and handle exceptions to the response.
     */
    public errorHandling(): void {
        // raise unhandled exceptions
        process.on("unhandledRejection", r => console.log(r));
        process.on("exit", (code) => {
            this.microplum.close();
            console.log(`About to exit with code: ${code}`);
        });
    }

    /**
     * Listen http for Heroku to have http server
     */
    public listen(): void {
        express().listen(this.config.server.port, () => {
            console.log(`Magic happens on port ${this.config.server.port}`);
        });
    }
}
