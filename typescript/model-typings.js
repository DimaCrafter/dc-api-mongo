function mapClassToType (type) {
    switch (type?.name) {
        case 'String':
            return 'string';
        case 'Number':
            return 'number';
        case 'Boolean':
            return 'boolean';
        case 'Array':
            return 'any[]';
        case 'Object':
            return 'Record<string, any>';
        case 'ObjectId':
            return 'ObjectId';
        default:
            return 'any';
    }
}

/**
 * Generates a TypeScript interface based on a given schema object.
 * @param {string} schemaName The name of the schema.
 * @param {object} schema The schema object.
 * @return {{ code: string, type: string }}
 */
exports.provideSchemaType = (schemaName, schema) => {
    const processProperties = (obj, indent = '\t') => {
        let result = '';
        if (!obj._id) {
            result += `${indent}_id: ObjectId;\n`;
        }

        for (const key in obj) {
            const value = obj[key];
            const optional = (value.required || value.default !== undefined) ? '' : '?';

            if ('default' in value) {
                result += `${indent}/** Default: ${JSON.stringify(value.default).replace(/\"/g, "'")} */\n`;
            }

            let tsType;
            if (typeof value.type === 'object' && value.type !== Object) {
                tsType = `{\n${processProperties(value, indent + '\t')}${indent}}'`;
            } else if (value.type === Array && !value.enum) {
                tsType = 'any[]';
            } else if (value.enum) {
                tsType = value.enum.map(v => `'${v}'`).join(' | ');
                if (value.type === Array) {
                    tsType += '[]';
                }
            } else {
                tsType = mapClassToType(value.type);
            }

            result += `${indent}${key}${optional}: ${tsType};\n`;
        }

        return result;
    };

    return {
        code: `export interface ${schemaName} {\n${processProperties(schema)}}`,
        type: `Model<${schemaName}>`
    };
}

exports.provideModelImports = () => {
    return `import { Model } from 'mongoose'\nimport { ObjectId } from 'mongodb'`;
}
