"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var microplum_1 = require("microplum");
var DocumentFacade = (function (_super) {
    __extends(DocumentFacade, _super);
    function DocumentFacade(Schema, act, args) {
        var _this = _super.call(this, act, args) || this;
        _this.Schema = Schema;
        return _this;
    }
    DocumentFacade.prototype._callSync = function (id, data) {
        if (data === void 0) { data = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    DocumentFacade.prototype._sync = function (model) {
        return __awaiter(this, void 0, void 0, function () {
            var error, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!model._syncId) return [3 /*break*/, 3];
                        return [4 /*yield*/, model.validate()];
                    case 1:
                        error = _a.sent();
                        if (error) {
                            throw new microplum_1.ValidationPlumError(error);
                        }
                        data = {};
                        if (model && model.toObject) {
                            data[this._name()] = model.toObject();
                        }
                        return [4 /*yield*/, this._callSync(model._id, data)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/, Promise.resolve()];
                }
            });
        });
    };
    DocumentFacade.prototype._doSync = function (update) {
        return !this.args.noSync || Object.keys(update)
            .filter(function (key) { return !key.startsWith('_'); })
            .length > 0;
    };
    DocumentFacade.prototype._name = function () {
        return this.args.role;
    };
    DocumentFacade.prototype.create = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var model;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        input._syncId = (this.args.syncId) ? this.args.syncId : null;
                        model = new this.Schema(input);
                        return [4 /*yield*/, this._sync(model)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, model.save()];
                }
            });
        });
    };
    DocumentFacade.prototype.update = function (conditions, update) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var models;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        update._modified = Date.now();
                        if (this.args.syncId) {
                            update._syncId = this.args.syncId;
                        }
                        else if (this._doSync(update)) {
                            update._syncId = null;
                        }
                        return [4 /*yield*/, this.find(conditions)];
                    case 1:
                        models = _a.sent();
                        return [2 /*return*/, Promise.all(models.map(function (model) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            model.set(update);
                                            if (!model.isModified()) return [3 /*break*/, 2];
                                            return [4 /*yield*/, this._sync(model)];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/, model.save()];
                                        case 2: return [2 /*return*/, Promise.resolve(model)];
                                    }
                                });
                            }); }))];
                }
            });
        });
    };
    DocumentFacade.prototype.updateOne = function (conditions, update) {
        return __awaiter(this, void 0, void 0, function () {
            var model;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        update._modified = Date.now();
                        if (this.args.syncId) {
                            update._syncId = this.args.syncId;
                        }
                        else if (this._doSync(update)) {
                            update._syncId = null;
                        }
                        return [4 /*yield*/, this.findOne(conditions)];
                    case 1:
                        model = _a.sent();
                        if (!model) return [3 /*break*/, 5];
                        model.set(update);
                        if (!model.isModified()) return [3 /*break*/, 3];
                        return [4 /*yield*/, this._sync(model)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, model.save()];
                    case 3: return [2 /*return*/, Promise.resolve(model)];
                    case 4: return [3 /*break*/, 6];
                    case 5: return [2 /*return*/, this.create(update)];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    DocumentFacade.prototype.updateById = function (id, update) {
        return __awaiter(this, void 0, void 0, function () {
            var model;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        update._modified = Date.now();
                        if (this.args.syncId) {
                            update._syncId = this.args.syncId;
                        }
                        else if (this._doSync(update)) {
                            update._syncId = null;
                        }
                        return [4 /*yield*/, this.findById(id)];
                    case 1:
                        model = _a.sent();
                        if (!model) return [3 /*break*/, 5];
                        model.set(update);
                        if (!model.isModified()) return [3 /*break*/, 3];
                        return [4 /*yield*/, this._sync(model)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, model.save()];
                    case 3: return [2 /*return*/, Promise.resolve(model)];
                    case 4: return [3 /*break*/, 6];
                    case 5: return [2 /*return*/, this.create(update)];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    DocumentFacade.prototype.find = function (query) {
        if (query === void 0) { query = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                query._deactivated = null;
                return [2 /*return*/, this.Schema
                        .find(query)
                        .exec()];
            });
        });
    };
    DocumentFacade.prototype.findOne = function (query) {
        if (query === void 0) { query = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                query._deactivated = null;
                return [2 /*return*/, this.Schema
                        .findOne(query)
                        .exec()];
            });
        });
    };
    DocumentFacade.prototype.findById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.Schema
                        .findById(id)
                        .exec()
                        .then(function (doc) { return (doc && !doc._deactivated) ? doc : null; })];
            });
        });
    };
    DocumentFacade.prototype.remove = function (conditions) {
        if (conditions === void 0) { conditions = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.update(conditions, {
                        _deactivated: Date.now(),
                        _syncId: (this.args.syncId) ? this.args.syncId : null
                    })];
            });
        });
    };
    DocumentFacade.prototype.removeOne = function (conditions) {
        if (conditions === void 0) { conditions = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateOne(conditions, {
                        _deactivated: Date.now(),
                        _syncId: (this.args.syncId) ? this.args.syncId : null
                    })];
            });
        });
    };
    DocumentFacade.prototype.removeById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateById(id, {
                        _deactivated: Date.now(),
                        _syncId: (this.args.syncId) ? this.args.syncId : null
                    })];
            });
        });
    };
    DocumentFacade.prototype.clean = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.remove({})];
            });
        });
    };
    return DocumentFacade;
}(microplum_1.PlumFacade));
var DatabaseFacade = (function (_super) {
    __extends(DatabaseFacade, _super);
    function DatabaseFacade() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return DatabaseFacade;
}(DocumentFacade));
exports.DatabaseFacade = DatabaseFacade;

//# sourceMappingURL=database.js.map
