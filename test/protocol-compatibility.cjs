const {test}=require('node:test');
const assert=require('node:assert/strict');
const protocol=require('../lib/protocol');
const fixtures=require('./legacy-wire.json');
for(const {name,values,wire} of fixtures) test(name+' preserves v5 wire values',()=>{
 const Type=protocol[name];const old=Type.decode(Buffer.from(wire,'base64'));
 const fresh=Type.decode(new Type(values).toBuffer());
 for(const [key,value] of Object.entries(values)) assert.deepEqual(fresh[key],old[key]);
 assert.deepEqual(Type.decode(new Type(old).toBuffer()),old);
});
