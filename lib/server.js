"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sourceMapSupport = require("source-map-support");
var mongoose = require("mongoose");
var bluebird = require("bluebird");
// for heroku to bind to a http port
var express = require("express");
// List of the component router instances  (name in plural form)
//import { service as seed }  from "./seed";
var microplum_1 = require("microplum");
/**
 * The server main class
 */
var Server = (function () {
    /**
     * Server constructor. Create and configure expressjs application
     *
     * @constructor
     */
    function Server(config) {
        this.config = config;
        // errors thrown with the typescript files not generated js
        sourceMapSupport.install();
        this.microplum = new microplum_1.default({
            app: this.config.app || "app",
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
    Server.bootstrap = function (config) {
        return new Server(config);
    };
    /**
     * Set-up db connection
     */
    Server.prototype.dbConnection = function () {
        //mongoose.Promise = bluebird;
        mongoose.Promise = bluebird;
        mongoose.connect(this.config.mongo.url);
    };
    /**
     * Add all routes
     */
    Server.prototype.routes = function () {
        //this.microplum.useService(seed);
    };
    /**
     * Clean and seed the db with initial data if set in the config file
     */
    Server.prototype.seed = function () {
        /*if (this.config.seedDB) {
            this.microplum.actPromise({ role: "app", cmd: "reset", seed: true });
        }*/
    };
    /**
     * Raise unhandled exceptions and handle exceptions to the response.
     */
    Server.prototype.errorHandling = function () {
        var _this = this;
        // raise unhandled exceptions
        process.on("unhandledRejection", function (r) { return console.log(r); });
        process.on("exit", function (code) {
            _this.microplum.close();
            console.log("About to exit with code: " + code);
        });
    };
    /**
     * Listen http for Heroku to have http server
     */
    Server.prototype.listen = function () {
        var _this = this;
        express().listen(this.config.server.port, function () {
            console.log("Magic happens on port " + _this.config.server.port);
        });
    };
    return Server;
}());
exports.Server = Server;

//# sourceMappingURL=server.js.map
