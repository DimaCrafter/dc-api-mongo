/**
 * @param {import('mongoose').Schema} schema
 * @param {string} model
 * @param {{ field: string, start: number }} options
 */
exports.applyAutoIncrement = (schema, model, options) => {
	schema.pre('save', async function (next) {
		/** @type {import('mongoose').Document} */
		const doc = this;

		if (doc.isNew) {
			const indexesCollection = doc.db.collection('auto-increment-indexes');
			const index = await indexesCollection.findOne({ model, field: options.field });
			if (index) {
				doc[options.field] = options.start + index.counter++;
				indexesCollection.updateOne({ _id: index._id }, { $set: { counter: index.counter } });
			} else {
				doc[options.field] = options.start;
				indexesCollection.insertOne({ model, field: options.field, counter: 1 });
			}
		}

		next();
	});
};
