// @ts-nocheck
// I disabled TypeScript here because mongoose typings and documentation says different things

const mongoose = require('mongoose');
const { DatabaseDriver, registerDriver } = require('dc-api-core/db');
const AutoIncrement = require('./auto-increment');
const { parseModel } = require('./model');

const URI_EXCLUDE = ['host', 'port', 'user', 'pass', 'name', 'srv', 'uri'];
class MongoDB extends DatabaseDriver {
    constructor (config) {
        super();

        if (!config.uri) {
            if (config.srv && !config.port) config.port = 27017;
            const uri = [
                'mongodb',
                config.user ? (config.user + ':' + config.pass + '@') : '',
                config.host,
                !config.srv && config.port ? (':' + config.port) : '',
                '/' + config.name,
                '?'
            ];

            if (config.srv) uri[0] += '+srv';
            for (const key in config) {
                if (~URI_EXCLUDE.indexOf(key)) continue;
                uri[5] += key + '=' + config[key] + '&';
            }

            uri[0] += '://';
            // Remove ending ampersand from query string
            uri[5] = uri[5].slice(0, -1);

            config.uri = uri.join('');
        }

        this.config = config;
    }

    connect () {
        return new Promise((resolve, reject) => {
            /** @type {import('mongoose').Connection} */
            this.connection = mongoose.createConnection(this.config.uri, {
                useCreateIndex: true,
                useUnifiedTopology: true,
                useNewUrlParser: true
            }, error => {
                if (error) reject(error);
                else {
                    this.connection.once('disconnected', () => this.emit('disconnected'));
                    resolve(AutoIncrement.init(this.connection));
                }
            });
        });
    }

    /**
     * @param {string} basePath
     * @param {string} name
     * @returns {mongoose.Model<mongoose.Document>}
     */
    getModel (basePath, name) {
        if (name in this.connection.models) {
            return this.connection.models[name];
        }

        let schemaRaw;
        if (this.config.nonStrict && ~this.config.nonStrict.indexOf(name)) {
            schemaRaw = { $options: { strict: false } };
        } else {
            try {
                schemaRaw = {...require(`${basePath}/${name}.js`)};
            } catch (err) {
                throw err;
            }
        }

        const schema = parseModel(schemaRaw);
        return this.connection.model(name, schema);
    }

    /** Drop connected database */
    async drop () {
        await this.getConnectionAwaiter();
        return await this.connection.db.dropDatabase();
    }

    getConnectionAwaiter () {
        if (this.connection.readyState == this.connection.states.connecting) {
            return new Promise(resolve => this.connection.once('connected', resolve));
        }
    }

    // * Utils
    /**
     * Convert given Unix Timestamp to BSON ObjectId
     * @param {number | string | Date} timestamp
     */
    static ObjectIdFromTime (timestamp) {
        if (typeof timestamp == 'string') timestamp = new Date(timestamp).getTime();
        else if (timestamp instanceof Date) timestamp = timestamp.getTime();

        return (~~(timestamp / 1000)).toString(16) + '0000000000000000';
    }
}

module.exports = registerDriver(MongoDB, 'mongo');
