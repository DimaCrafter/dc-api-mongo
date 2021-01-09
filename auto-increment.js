/** @type {import('mongodb').Collection} */
let indexesCollection;

/** @argument conn {import('mongoose').Connection} */
module.exports.init = async conn => {
	const indexesInfo = await conn.db.listCollections({ name: 'auto-increment-indexes' }, { nameOnly: true }).next();
	if (!indexesInfo) {
		indexesCollection = await conn.db.createCollection('auto-increment-indexes');
	} else {
		indexesCollection = conn.db.collection('auto-increment-indexes');
	}
};

/** @argument schema {import('mongoose').Schema} */
module.exports.apply = (schema, options) => {
	schema.pre('save', async function (next) {
		/** @type {import('mongoose').Document} */
		const doc = this;
		if (doc.isNew) {
			const index = await indexesCollection.findOne({ model: options.model, field: options.field });
			if (index) {
				doc[options.field] = options.start + index.counter++;
				indexesCollection.updateOne({ _id: index._id }, { $set: { counter: index.counter } });
			} else {
				doc[options.field] = options.start;
				indexesCollection.insertOne({ model: options.model, field: options.field, counter: 1 });
			}
		}

		next();
	});
};
