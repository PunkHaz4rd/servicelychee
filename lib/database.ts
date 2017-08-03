import { PlumFacade, ValidationPlumError } from "microplum";
import { Document, Model } from "mongoose";
import * as flat from "flat";


class DocumentFacade<T extends Document> extends PlumFacade {
    constructor(public DbModel: Model<T>, act?: (args: any) => Promise<any>, args?: { [key: string]: any }) {
        super(act, args);
    }

    protected async _callSync(id: string, data: { [key: string]: any } = {}, current?: { [key: string]: any }): Promise<any> {
        // empty no sync by default
        return Promise.resolve();
    }

    protected async _sync(model: T, current?: { [key: string]: any }): Promise<any> {
        if (this._hasSync() && !model["_sync"]) {
            let error = await model.validate();
            if (error) {
                console.log(`[Validation ERR] DB validation <= ${JSON.stringify(error)}`);
                throw new ValidationPlumError({}, "Db validation errors");
            }
            let data: any = (model && model.toObject) ? model.toObject() : {};
            return this._callSync(model._id, data, current);
        }
        return Promise.resolve();
    }

    protected _hasSync(): boolean {
        return !this.args.noSync && this.DbModel.schema["paths"]["_sync"];
    }

    protected _doSync(update: { [key: string]: any }): boolean {
        return this._hasSync() && Object.keys(update)
                .filter(key => !key.startsWith("_") || key === "_deactivated")
                .length > 0;
    }

    protected _name(): string {
        return this.args.role;
    }

    protected prepareInputForWriting(input: { [key: string]: any }): void {
        input._modified = Date.now();
        if (this._doSync(input)) {
            input._sync = (this.args.syncId) ? this.args.syncId : null;
            input._link = (this.args.linkId) ? this.args.linkId : null;
        } else {
            this.args.noSync = true;
        }
    }

    public async create(input: { [key: string]: any }): Promise<T> {
        input._sync = (this.args.syncId) ? this.args.syncId : null;
        let model = new this.DbModel(input);
        let remoteData = await this._sync(model, null);
        if (remoteData) {
            let flattenData: any = flat.flatten(remoteData);
            for(let [key, value] of Object.entries(flattenData)) {
                model.set(key, value);
            }
            //model.set(remoteData);
        }
        return model.save();
    }

    protected async _update(model: T, update: { [key: string]: any }): Promise<T> {
        if (model) {
            let current = (model && model.toObject) ? model.toObject() : {};
            for(let [key, value] of Object.entries(flat.flatten(update))) {
                model.set(key, value);
            }
            if (model.isModified()) {
                let remoteData = await this._sync(model, current);
                if (remoteData) {
                    let flattenData: any = flat.flatten(remoteData);
                    for (let [key, value] of Object.entries(flattenData)) {
                        model.set(key, value);
                    }
                }

                return model.save();
            } else {
                return Promise.resolve(model);
            }
        } else {
            return this.create(update);
        }
    }

    public async update(conditions: { [key: string]: any }, update: { [key: string]: any }): Promise<T[]> {
        this.prepareInputForWriting(update);
        let models: T[] = await this.find(conditions);
        return Promise.all(models.map(async model => this._update(model, update)));
    }

    public async updateOne(conditions: { [key: string]: any }, update: { [key: string]: any }): Promise<T> {
        this.prepareInputForWriting(update);
        let model: T = await this.findOne(conditions);
        return this._update(model, update);
    }

    public async updateById(id: string, update: { [key: string]: any }): Promise<T> {
        this.prepareInputForWriting(update);
        let model = await this.findById(id);
        return this._update(model, update);
    }

    public async find(query: { [key: string]: any } = {}): Promise<T[]> { // returns [] of not found
        query._deactivated = null;
        return this.DbModel
            .find(query)
            .exec();
    }

    public async findOne(query: { [key: string]: any } = {}): Promise<T> { // returns null if not found
        query._deactivated = null;
        return this.DbModel
            .findOne(query)
            .exec();
    }

    public async findById(id: string): Promise<T> {
        return this.DbModel
            .findById(id)
            .exec()
            .then(doc => (doc && !doc["_deactivated"]) ? doc : null);
    }

    public async remove(conditions: { [key: string]: any } = {}): Promise<T[]> {
        return this.update(conditions, {
            _deactivated: Date.now(),
            _sync: (this.args.syncId) ? this.args.syncId : null
        });
        //return this.DbModel
        //    .findByIdAndRemove(id)
        //    .exec();
    }

    public async removeOne(conditions: { [key: string]: any } = {}): Promise<T> {
        return this.updateOne(conditions, {
            _deactivated: Date.now(),
            _sync: (this.args.syncId) ? this.args.syncId : null
        });
        //return this.DbModel
        //    .findByIdAndRemove(id)
        //    .exec();
    }

    public async removeById(id: string): Promise<T> {
        return this.updateById(id, {
            _deactivated: Date.now(),
            _sync: (this.args.syncId) ? this.args.syncId : null
        });
        //return this.DbModel
        //    .findByIdAndRemove(id)
        //    .exec();
    }

    public async clean(): Promise<T[]> {
        return this.remove({});
    }

}

export class DatabaseFacade<T> extends DocumentFacade<T & Document> {

}
