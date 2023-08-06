const { Schema } = require('mongoose');
const { applyAutoIncrement } = require('./auto-increment');

/**
 * Convert dc-api-mongo model to mongoose schema
 * @param {object} raw Model description object
 */
module.exports.buildModel = (name, raw) => {
	let parsed = {
		virtuals: raw.$virtuals || {}
	};
	delete raw.$virtuals;

	// Parsing auto-increment options
	if (raw.$increment) {
		if (typeof raw.$increment == 'string') {
			parsed.increment = {
				field: raw.$increment,
				start: 1
			};
		} else {
			parsed.increment = raw.$increment;
			parsed.increment.start ||= 1;
		}

		raw[parsed.increment.field] = { type: Number, required: false };
		delete raw.$increment;
	}

	parsed.options = raw.$options;
	delete raw.$options;

	const schema = new Schema(raw, parsed.options);
	// Applying virtuals
	for (const key in parsed.virtuals) {
		schema.virtual(key)
			.get(parsed.virtuals[key].get)
			.set(parsed.virtuals[key].set);
	}

	// Enabling auto-increment plugin if necessary
	if (parsed.increment) {
		applyAutoIncrement(schema, name, parsed.increment);
	}

	return schema;
}
