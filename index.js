const ROOT = process.cwd();
const mongoose = require('mongoose');
const { Schema } = mongoose;
const EventEmitter = require('events');
const config = require('dc-api-core/config');
const mongooseAI = require('mongoose-auto-increment');

const uriExclude = ['host', 'port', 'user', 'pass', 'name', 'srv', 'uri'];
class MongoDB extends EventEmitter {
    constructor (conf, confName) {
        super();
        if (!conf.uri) {
            if (conf.srv && !conf.port) conf.port = 27017;
            const uri = [
                'mongodb',
                conf.user ? (conf.user + ':' + conf.pass + '@') : '',
                conf.host,
                !conf.srv ? (':' + conf.port) : '',
                '/' + conf.name,
                '?'
            ];

            if (conf.srv) uri[0] += '+srv';
            for (const key in conf) {
                if (~uriExclude.indexOf(key)) continue;
                uri[5] += key + '=' + conf[key] + '&';
            }

            uri[0] += '://';
            uri[5] = uri[5].slice(0, -1);
            conf.uri = uri.join('');
        }

        this.conn = mongoose.createConnection(conf.uri, {
            useCreateIndex: true,
            useUnifiedTopology: true,
            useNewUrlParser: true
        }, err => this.emit('connected', err));
        mongooseAI.initialize(this.conn);
        this.confName = confName;
    }

    getModel (name) {
        if (name in this.conn.models) return this.conn.models[name];
        let schemaRaw;
        if (config.db[this.confName] && (config.db[this.confName].nonStrict || []).indexOf(name) != -1) {
            schemaRaw = { initOpts: { strict: false } };
        } else {
            try {
                schemaRaw = {...require(`${ROOT}/models/${this.confName}/${name}.js`)};
            } catch {
                this.emit('no-model', name);
                return;
            }
        }

        let schemaData = {
            virtuals: schemaRaw.virtuals || {}
        };

        delete schemaRaw.virtuals;
        // Parsing auto-increment options
        switch (typeof schemaRaw.increment) {
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

        schemaData.initOpts = schemaRaw.initOpts;
        delete schemaRaw.initOpts;

        const schema = new Schema(schemaRaw, schemaData.initOpts);
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

    drop (cb) {
        const drop = () => this.conn.db.dropDatabase(cb);
        if (this.conn.readyState == this.conn.states.connecting) {
            this.conn.once('connected', drop);
        } else {
            drop();
        }
    }
}

module.exports = core => core.register('db', MongoDB, 'mongo');
