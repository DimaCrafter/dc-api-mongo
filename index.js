const mongoose = require('mongoose');
const { Schema } = mongoose;
const EventEmitter = require('events');
const autoIncrement = require('./auto-increment');

const uriExclude = ['host', 'port', 'user', 'pass', 'name', 'srv', 'uri'];
class MongoDB extends EventEmitter {
    constructor (config) {
        super();
        let uri = config.uri;
        if (!uri) {
            if (config.srv && !config.port) config.port = 27017;
            uri = [
                'mongodb',
                config.user ? (config.user + ':' + config.pass + '@') : '',
                config.host,
                !config.srv && config.port ? (':' + config.port) : '',
                '/' + config.name,
                '?'
            ];

            if (config.srv) uri[0] += '+srv';
            for (const key in config) {
                if (~uriExclude.indexOf(key)) continue;
                uri[5] += key + '=' + config[key] + '&';
            }

            uri[0] += '://';
            // Remove ending ampersand from query string
            uri[5] = uri[5].slice(0, -1);
            uri = uri.join('');
        }

        this.config = config;
        /** @type {import('mongoose').Connection} */
        this.connection = mongoose.createConnection(uri, {
            useCreateIndex: true,
            useUnifiedTopology: true,
            useNewUrlParser: true
        }, async err => {
            if (!err) {
                await autoIncrement.init(this.connection);
            }

            this.emit('connected', err);
        });
    }

    getModel (basePath, modelName) {
        if (modelName in this.connection.models) {
            return this.connection.models[modelName];
        }

        let schemaRaw;
        if (this.config.nonStrict && ~this.config.nonStrict.indexOf(modelName)) {
            schemaRaw = { $options: { strict: false } };
        } else {
            try {
                schemaRaw = {...require(`${basePath}/${modelName}.js`)};
            } catch (err) {
                throw err;
            }
        }

        let schemaData = {
            virtuals: schemaRaw.$virtuals || {}
        };
        delete schemaRaw.$virtuals;

        // Parsing auto-increment options
        if (schemaRaw.$increment) {
            if (typeof schemaRaw.$increment == 'string') {
                schemaData.increment = {
                    field: schemaRaw.$increment,
                    start: 1
                };
            } else {
                schemaData.increment = schemaRaw.$increment;
                schemaData.increment.start = schemaData.increment.start || 1;
            }

            schemaRaw[schemaData.increment.field] = { type: Number, required: false };
            delete schemaRaw.$increment;
        }

        schemaData.options = schemaRaw.$options;
        delete schemaRaw.$options;

        const schema = new Schema(schemaRaw, schemaData.options);
        // Applying virtuals
        for (const key in schemaData.virtuals) {
            schema.virtual(key)
                .get(schemaData.virtuals[key].get)
                .set(schemaData.virtuals[key].set);
        }

        // Enabling auto-increment plugin if necessary
        if (schemaData.increment) {
            autoIncrement.apply(schema, schemaData.increment);
        }

        return this.connection.model(modelName, schema);
    }

    drop (cb) {
        const drop = () => this.connection.db.dropDatabase(cb);
        if (this.connection.readyState == this.connection.states.connecting) {
            this.connection.once('connected', drop);
        } else {
            drop();
        }
    }

    // Utils
    ObjectIdFromTime (timestamp) {
        if (typeof timestamp == 'string') timestamp = new Date(timestamp).getTime();
        else if (timestamp instanceof Date) timestamp = timestamp.getTime();

        return (~~(timestamp / 1000)).toString(16) + '0000000000000000';
    }
}

module.exports = core => core.db(MongoDB, 'mongo');
module.exports.ObjectIdFromTime = timestamp => {
    if (typeof timestamp == 'string') timestamp = new Date(timestamp).getTime();
    else if (timestamp instanceof Date) timestamp = timestamp.getTime();

    return (~~(timestamp / 1000)).toString(16) + '0000000000000000';
};
