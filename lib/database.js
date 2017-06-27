"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const microplum_1 = require("microplum");
class DocumentFacade extends microplum_1.PlumFacade {
    constructor(DbModel, act, args) {
        super(act, args);
        this.DbModel = DbModel;
    }
    _callSync(id, data = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            // empty no sync by default
        });
    }
    _sync(model) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._hasSync() && !model["_sync"]) {
                let error = yield model.validate();
                if (error) {
                    console.log(`[Validation ERR] DB validation <= ${JSON.stringify(error)}`);
                    throw new microplum_1.ValidationPlumError({}, "Db validation errors");
                }
                let data = {};
                if (model && model.toObject) {
                    data[this._name()] = model.toObject();
                }
                yield this._callSync(model._id, data);
            }
            return Promise.resolve();
        });
    }
    _hasSync() {
        return !this.args.noSync && this.DbModel.schema["paths"]["_sync"];
    }
    _doSync(update) {
        return this._hasSync() && Object.keys(update)
            .filter(key => !key.startsWith('_'))
            .length > 0;
    }
    _name() {
        return this.args.role;
    }
    prepareInputForWriting(input) {
        input._modified = Date.now();
        if (this._doSync(input)) {
            input._sync = (this.args.syncId) ? this.args.syncId : null;
            input._link = (this.args.linkId) ? this.args.linkId : null;
        }
        else {
            this.args.noSync = true;
        }
    }
    create(input) {
        return __awaiter(this, void 0, void 0, function* () {
            input._sync = (this.args.syncId) ? this.args.syncId : null;
            let model = new this.DbModel(input);
            yield this._sync(model);
            return model.save();
        });
    }
    update(conditions, update) {
        return __awaiter(this, void 0, void 0, function* () {
            this.prepareInputForWriting(update);
            let models = yield this.find(conditions);
            return Promise.all(models.map((model) => __awaiter(this, void 0, void 0, function* () {
                model.set(update);
                if (model.isModified()) {
                    yield this._sync(model);
                    return model.save();
                }
                else {
                    return Promise.resolve(model);
                }
            })));
        });
    }
    updateOne(conditions, update) {
        return __awaiter(this, void 0, void 0, function* () {
            this.prepareInputForWriting(update);
            let model = yield this.findOne(conditions);
            if (model) {
                model.set(update);
                if (model.isModified()) {
                    yield this._sync(model);
                    return model.save();
                }
                else {
                    return Promise.resolve(model);
                }
            }
            else {
                return this.create(update);
            }
        });
    }
    updateById(id, update) {
        return __awaiter(this, void 0, void 0, function* () {
            this.prepareInputForWriting(update);
            let model = yield this.findById(id);
            if (model) {
                model.set(update);
                if (model.isModified()) {
                    yield this._sync(model);
                    return model.save();
                }
                else {
                    return Promise.resolve(model);
                }
            }
            else {
                return this.create(update);
            }
        });
    }
    find(query = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            query._deactivated = null;
            return this.DbModel
                .find(query)
                .exec();
        });
    }
    findOne(query = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            query._deactivated = null;
            return this.DbModel
                .findOne(query)
                .exec();
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.DbModel
                .findById(id)
                .exec()
                .then(doc => (doc && !doc["_deactivated"]) ? doc : null);
        });
    }
    remove(conditions = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.update(conditions, {
                _deactivated: Date.now(),
                _sync: (this.args.syncId) ? this.args.syncId : null
            });
            //return this.DbModel
            //    .findByIdAndRemove(id)
            //    .exec();
        });
    }
    removeOne(conditions = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.updateOne(conditions, {
                _deactivated: Date.now(),
                _sync: (this.args.syncId) ? this.args.syncId : null
            });
            //return this.DbModel
            //    .findByIdAndRemove(id)
            //    .exec();
        });
    }
    removeById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.updateById(id, {
                _deactivated: Date.now(),
                _sync: (this.args.syncId) ? this.args.syncId : null
            });
            //return this.DbModel
            //    .findByIdAndRemove(id)
            //    .exec();
        });
    }
    clean() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.remove({});
        });
    }
}
class DatabaseFacade extends DocumentFacade {
}
exports.DatabaseFacade = DatabaseFacade;

//# sourceMappingURL=database.js.map
