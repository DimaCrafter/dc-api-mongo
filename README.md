# MongoDB driver for `dc-api-core`

[![NPM](https://nodei.co/npm/dc-api-mongo.png)](https://npmjs.com/package/dc-api-mongo)

## Dependencies

* [dc-api-core](https://github.com/DimaCrafter/dc-api-core)
* [Mongoose](https://github.com/Automattic/mongoose)
* [mongoose-auto-increment](https://github.com/codetunnel/mongoose-auto-increment)

---

## Easy installation

1) Install package - `npm i dc-api-mongo --save` or `yarn add dc-api-mongo`
2) Add `dc-api-mongo` to `plugins` array in `config.json`
3) Fill `db` field in `config.json` by template
4) Done!

---

## `config.json` template

| Field                | Default       | Description                  |
|----------------------|---------------|------------------------------|
| `db.mongo.uri`       | Autogenerated | MongoDB URI                  |
| `db.mongo.host`      | Required      | Database hostname            |
| `db.mongo.name`      | Required      | Database name                |
| `db.mongo.port`      | `27017`       | Database port                |
| `db.mongo.user`      | Optional      | Database username            |
| `db.mongo.pass`      |               | and password                 |
| `db.mongo.nonStrict` | `[]`          | List of models without shema |
| `db.mongo.srv`       | `false`       | If `true` using SRV record   |
| `db.mongo.*`         | Optional      | Query parameters in URI      |

## Example configuration

```json
{
    "db": {
        "mongo.billing": {
            "uri": " mongodb+srv://admin:admin@project-00000.provider.mongodb.net/billing?authSource=admin&retryWrites=true&w=majority"
        },
        "mongo.control-panel"
            "host": "project-00000.provider.mongodb.net",
            "user": "admin",
            "pass": "admin",
            "name": "control-panel",
            "srv": true,
            "authSource": "admin",
            "retryWrites": true,
            "w": "majority"
        }
    }
}
```
