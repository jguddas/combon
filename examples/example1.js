var TBON = require('../');

function CustomObj(id, name, color) {
  this.id = id;
  this.name = name;
  this.color = color;
}

CustomObj.prototype.toJSON = function () {
  return 'CustomObj:' + this.id + ',' + this.name + ',' + this.color;
};

function revive(key, value) {
  var m;
  if (typeof value === 'string' && (m = value.match(/^CustomObj:(.*)/))) {
    var d = m[1].split(',');
    return new CustomObj(d[0], d[1], d[2]);
  }
  return value;
}

var data = {
  example: 'data',
  arr: ['blue', 'red'],
  empty: [{}, []],
  num: 100,
  custom: new CustomObj('0100', 'John', 'Green'),
};

var str = TBON.stringify(data);
console.log(str);

var parsed = TBON.parse(str, revive);

console.log(parsed);

console.log('Match:', JSON.stringify(parsed) === JSON.stringify(data));
