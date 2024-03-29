# Mongoose based MongoDB driver for dc-api-core

[![NPM](https://nodei.co/npm/dc-api-mongo.png)](https://npmjs.com/package/dc-api-mongo)

Provides `mongo` database driver and session store.

## Dependencies

* [dc-api-core](https://github.com/DimaCrafter/dc-api-core)
* [Mongoose](https://github.com/Automattic/mongoose)

---

## Installation

1) Install package - `npm i dc-api-mongo --save` or `yarn add dc-api-mongo`
2) Add `dc-api-mongo` to `plugins` array in `config.json`
3) Fill `db` field in `config.json` by template
4) Create directory `models` in back-end root
5) Create directory `mongo` in `models`
6) Done!

---

## `config.json` template

| Field                | Default       | Description                   |
|----------------------|---------------|-------------------------------|
| `db.mongo.uri`       | Autogenerated | MongoDB URI                   |
| `db.mongo.host`      | Required      | Database hostname             |
| `db.mongo.name`      | Required      | Database name                 |
| `db.mongo.port`      | `27017`       | Database port                 |
| `db.mongo.user`      | Optional      | Database username             |
| `db.mongo.pass`      |               | and password                  |
| `db.mongo.nonStrict` | `[]`          | List of models without schema |
| `db.mongo.srv`       | `false`       | If `true` using SRV record    |
| `db.mongo.*`         | Optional      | Query parameters in URI       |

## Example configuration

```json
{
    "db": {
        "mongo.billing": {
            "uri": " mongodb+srv://admin:password@project-00000.provider.mongodb.net/billing?authSource=admin&retryWrites=true&w=majority"
        },
        "mongo.control-panel"
            "host": "project-00000.provider.mongodb.net",
            "user": "admin",
            "pass": "password",
            "name": "control-panel",
            "srv": true,
            "authSource": "admin",
            "retryWrites": true,
            "w": "majority"
        }
    }
}
```

## Creating model

1) Create file `ModelName.js` in `models/mongo` directory
2) Fill model file.
3) Done!

Example:

```js
module.exports = {
    // Any mongoose schema constuctions allowed
    field: { type: String, required: true },
    otherField: { type: Number, default: Date.now() + 1000 * 60 },

    // Second argument of schema constuctor
    // new Schema(..., $options)
    $options: { strict: false },

    // Register default auto-increment field "uid"
    $increment: 'uid',
    // Same with options
    $increment: { field: 'uid', start: 1 },

    // Mongoose virtual fields
    $virtuals: {
        timestamp: {
            // schema.virtual('timestamp').get(<this function>)
            get () {
                // `document.timestamp` will return creation time in ms
                return this._id.getTimestamp().getTime();
            }
        }
    }
};
```

Other examples you can find in [Mongoose Docs](https://mongoosejs.com/docs/guide.html).
