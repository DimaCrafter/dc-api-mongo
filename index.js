const ROOT = process.cwd();
const mongoose = require('mongoose');
const EventEmitter = require('events');
const {Schema} = mongoose;
const mongooseAI = require('mongoose-auto-increment');

class MongoDB extends EventEmitter {
    constructor(conf, confName) {
        super();
        !conf.port && (conf.port = 27017);
        const uri = `mongodb://${conf.user?`${conf.user}:${conf.pass}@`:''}${conf.host}:${conf.port}/${conf.name}`;
        this.conn = mongoose.createConnection(uri, {
            useCreateIndex: true,
            useNewUrlParser: true
        }, err => this.emit('connected', err));
        mongooseAI.initialize(this.conn);
        this.confName = confName;
    }

    getModel (name) {
        if(name in this.conn.models) return this.conn.models[name];
        try {
            var schemaRaw = {...require(`${ROOT}/models/${this.confName}/${name}.js`)};
        } catch {
            this.emit('no-model', name);
            return;
        }

        let schemaData = {
            virtuals: schemaRaw.virtuals || {}
        };

        delete schemaRaw.virtuals;
        // Parsing auto-increment options
        switch(typeof schemaRaw.increment) {
            case 'string':
                schemaData.increment = {
                    model: name,
                    field: schemaRaw.increment
                };
                break;
            case 'object':
                schemaData.increment = {...schemaRaw.increment, ...{model: name}};
                break;
        }
        delete schemaRaw.increment;

        const schema = new Schema(schemaRaw);
        // Parsing virtuals
        Object.keys(schemaData.virtuals).forEach(key => {
            schema.virtual(key)
                .get(schemaData.virtuals[key].get)
                .set(schemaData.virtuals[key].set);
        });
        // Enabling auto-increment plugin if necessary
        schemaData.increment && schema.plugin(mongooseAI.plugin, schemaData.increment);
        return this.conn.model(name, schema);
    }
}

module.exports = core => core.register('db', MongoDB, 'mongo');
