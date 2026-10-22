const protobuf = require('protobufjs');
const definitions = require('./definitions.json');

// Translate the bundled v5 descriptor without changing field names or wire IDs.
function descriptor(message) {
	const fields = {};
	for (const field of message.fields) {
		const {name, keytype, ...value} = field;
		if (keytype) { value.keyType = keytype; delete value.rule; }
		fields[name] = value;
	}
	const nested = {};
	for (const value of message.enums || []) {
		nested[value.name] = {values: Object.fromEntries(value.values.map(v => [v.name, v.id]))};
	}
	return {fields, nested};
}

const root = new protobuf.Root();
const namespace = root.define(definitions.package);
for (const message of definitions.messages) {
	namespace.add(protobuf.Type.fromJSON(message.name, descriptor(message)));
}
for (const value of definitions.enums) {
	namespace.add(new protobuf.Enum(value.name, Object.fromEntries(value.values.map(v => [v.name, v.id]))));
}
root.resolveAll();

const protocol = {};
for (const type of namespace.nestedArray.filter(value => value instanceof protobuf.Type)) {
	class Message {
		constructor(values = {}) {
			for (const field of type.fieldsArray) this[field.name] = field.repeated ? [] : field.map ? {} : null;
			Object.assign(this, values);
		}
		toBuffer() { return Buffer.from(type.encode(type.fromObject(this)).finish()); }
		static decode(bytes) {
			return type.toObject(type.decode(bytes), {longs: Number, bytes: Buffer, arrays: true, objects: true});
		}
	}
	for (const value of type.nestedArray.filter(value => value instanceof protobuf.Enum)) {
		Message[value.name] = value.values;
	}
	protocol[type.name] = Message;
}
module.exports = protocol;
