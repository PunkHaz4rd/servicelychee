"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sourceMapSupport = require("source-map-support");
const mongoose = require("mongoose");
const bluebird = require("bluebird");
// for heroku to bind to a http port
const express = require("express");
// List of the component router instances  (name in plural form)
//import { service as seed }  from "./seed";
const microplum_1 = require("microplum");
//LOGGING
const logpapaya_1 = require("logpapaya");
/**
 * The server main class
 */
class Server {
    /**
     * Server constructor. Create and configure expressjs application
     *
     * @constructor
     */
    constructor(config) {
        this.config = config;
        // errors thrown with the typescript files not generated js
        sourceMapSupport.install();
        this.microplum = new microplum_1.default({
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
     * Bootstrap the application.
     *
     * @method bootstrap
     * @static
     * @return {ng.auto.IInjectorService} Returns the newly created injector for this app.
     */
    static bootstrap(config) {
        return new Server(config);
    }
    /**
     * Set-up db connection
     */
    dbConnection() {
        //mongoose.Promise = bluebird;
        mongoose.Promise = bluebird;
        mongoose.connect(this.config.mongo.url);
    }
    /**
     * Add all routes
     */
    routes() {
        //this.microplum.useService(seed);
    }
    initMiddleware() {
        logpapaya_1.logging.init({
            app: this.config.app || "default-app",
            env: process.env.NODE_ENV || "default-env",
        });
    }
    /**
     * Clean and seed the db with initial data if set in the config file
     */
    seed() {
        /*if (this.config.seedDB) {
            this.microplum.actPromise({ role: "app", cmd: "reset", seed: true });
        }*/
    }
    /**
     * Raise unhandled exceptions and handle exceptions to the response.
     */
    errorHandling() {
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
    listen() {
        express().listen(this.config.server.port, () => {
            console.log(`Magic happens on port ${this.config.server.port}`);
        });
    }
}
exports.Server = Server;

//# sourceMappingURL=server.js.map
