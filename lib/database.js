"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const microplum_1 = require("microplum");
class DocumentFacade extends microplum_1.PlumFacade {
    constructor(DbModel, act, args) {
        super(act, args);
        this.DbModel = DbModel;
    }
    async _callSync(id, data = {}) {
        // empty no sync by default
    }
    async _sync(model) {
        if (this._hasSync() && !model["_sync"]) {
            let error = await model.validate();
            if (error) {
                console.log(`[Validation ERR] DB validation <= ${JSON.stringify(error)}`);
                throw new microplum_1.ValidationPlumError({}, "Db validation errors");
            }
            let data = {};
            if (model && model.toObject) {
                data[this._name()] = model.toObject();
            }
            await this._callSync(model._id, data);
        }
        return Promise.resolve();
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
    async create(input) {
        input._sync = (this.args.syncId) ? this.args.syncId : null;
        let model = new this.DbModel(input);
        await this._sync(model);
        return model.save();
    }
    async update(conditions, update) {
        this.prepareInputForWriting(update);
        let models = await this.find(conditions);
        return Promise.all(models.map(async (model) => {
            model.set(update);
            if (model.isModified()) {
                await this._sync(model);
                return model.save();
            }
            else {
                return Promise.resolve(model);
            }
        }));
    }
    async updateOne(conditions, update) {
        this.prepareInputForWriting(update);
        let model = await this.findOne(conditions);
        if (model) {
            model.set(update);
            if (model.isModified()) {
                await this._sync(model);
                return model.save();
            }
            else {
                return Promise.resolve(model);
            }
        }
        else {
            return this.create(update);
        }
    }
    async updateById(id, update) {
        this.prepareInputForWriting(update);
        let model = await this.findById(id);
        if (model) {
            model.set(update);
            if (model.isModified()) {
                await this._sync(model);
                return model.save();
            }
            else {
                return Promise.resolve(model);
            }
        }
        else {
            return this.create(update);
        }
    }
    async find(query = {}) {
        query._deactivated = null;
        return this.DbModel
            .find(query)
            .exec();
    }
    async findOne(query = {}) {
        query._deactivated = null;
        return this.DbModel
            .findOne(query)
            .exec();
    }
    async findById(id) {
        return this.DbModel
            .findById(id)
            .exec()
            .then(doc => (doc && !doc["_deactivated"]) ? doc : null);
    }
    async remove(conditions = {}) {
        return this.update(conditions, {
            _deactivated: Date.now(),
            _sync: (this.args.syncId) ? this.args.syncId : null
        });
        //return this.DbModel
        //    .findByIdAndRemove(id)
        //    .exec();
    }
    async removeOne(conditions = {}) {
        return this.updateOne(conditions, {
            _deactivated: Date.now(),
            _sync: (this.args.syncId) ? this.args.syncId : null
        });
        //return this.DbModel
        //    .findByIdAndRemove(id)
        //    .exec();
    }
    async removeById(id) {
        return this.updateById(id, {
            _deactivated: Date.now(),
            _sync: (this.args.syncId) ? this.args.syncId : null
        });
        //return this.DbModel
        //    .findByIdAndRemove(id)
        //    .exec();
    }
    async clean() {
        return this.remove({});
    }
}
class DatabaseFacade extends DocumentFacade {
}
exports.DatabaseFacade = DatabaseFacade;

//# sourceMappingURL=database.js.map
