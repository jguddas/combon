var assert = require('chai').assert;
var COMBON = require('../');

describe('Basic types', function () {
  it('Empty', function (done) {
    var data = undefined;
    var combon = COMBON.stringify(data);
    assert.isUndefined(combon);
    assert.equal(combon, JSON.stringify(data));
    done();
  });
  it('True', function (done) {
    var data = true;
    var combon = COMBON.stringify(data);
    assert.equal(combon, '+');
    assert.equal(JSON.stringify(COMBON.parse(combon)), JSON.stringify(data));
    done();
  });
  it('False', function (done) {
    var data = false;
    var combon = COMBON.stringify(data);
    assert.equal(combon, '!');
    assert.equal(JSON.stringify(COMBON.parse(combon)), JSON.stringify(data));
    done();
  });
  it('Null', function (done) {
    var data = null;
    var combon = COMBON.stringify(data);
    assert.equal(combon, '?');
    assert.equal(JSON.stringify(COMBON.parse(combon)), JSON.stringify(data));
    done();
  });
  it('Empty Array', function (done) {
    var data = [];
    var combon = COMBON.stringify(data);
    assert.equal(combon, '^');
    assert.equal(JSON.stringify(COMBON.parse(combon)), JSON.stringify(data));
    done();
  });
  it('Empty Object', function (done) {
    var data = {};
    var combon = COMBON.stringify(data);
    assert.equal(combon, '~');
    assert.equal(JSON.stringify(COMBON.parse(combon)), JSON.stringify(data));
    done();
  });
});

describe('Escapes', function () {
  ':?!+^~,{[(|)\]}'.split('').forEach(function (chr) {
    it('Escape ' + chr, function (done) {
      var data = chr;
      var combon = COMBON.stringify(data);
      assert.equal(combon, '"' + chr + '"');
      assert.equal(JSON.stringify(COMBON.parse(combon)), JSON.stringify(data));
      done();
    });
  });
  it('Escape "', function (done) {
    var data = '"';
    var combon = COMBON.stringify(data);
    assert.equal(combon, '\\"');
    assert.equal(JSON.stringify(COMBON.parse(combon)), JSON.stringify(data));
    done();
  });
  it('Escape \\', function (done) {
    var data = '\\';
    var combon = COMBON.stringify(data);
    assert.equal(combon, '\\\\');
    assert.equal(JSON.stringify(COMBON.parse(combon)), JSON.stringify(data));
    done();
  });
  it('Escaped Key and Value', function (done) {
    var data = { '()': ':?', '+': [true, false] };
    var combon = COMBON.stringify(data);
    assert.equal(combon, '"()":":?","+"(+!)');
    assert.equal(JSON.stringify(COMBON.parse(combon)), JSON.stringify(data));
    done();
  });
});

describe('Array / Object', function () {
  it('Simple Array', function (done) {
    var data = ['red', null, 'blue', , 'false', '?'];
    var combon = COMBON.stringify(data);
    assert.equal(combon, 'red,?blue,?false,"?"');
    assert.equal(JSON.stringify(COMBON.parse(combon)), JSON.stringify(data));
    done();
  });
  it('Simple Object', function (done) {
    var data = { red: 'blue', green: true, blue: null };
    var combon = COMBON.stringify(data);
    assert.equal(combon, 'red:blue,green+blue?');
    assert.equal(JSON.stringify(COMBON.parse(combon)), JSON.stringify(data));
    done();
  });
  it('Object + Array', function (done) {
    var data = [
      { number: 100, stringNumber: '100', array: [{ true: false, red: 'blue' }, [], ['?', '"green"', null, new Date(0)]] },
      [{ 100: 'blue', arr: [[[]]] }],
      true,
      'blue',
    ];
    var combon = COMBON.stringify(data);
    assert.equal(combon, '(number:100,stringNumber:"100",array[true!red:blue)^("?",\\"green\\",?"1970-01-01T00:00:00.000Z"])[100:blue`arr[^}+blue');
    assert.equal(JSON.stringify(COMBON.parse(combon)), JSON.stringify(data));
    done();
  });
});

describe('Reviver / Replacer', function () {
  it('Revive date', function (done) {
    var data = { message: 'This is a message', time: new Date() };
    var combon = COMBON.stringify(data);
    function reviver(key, value) {
      if (value.match(/^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+(?:[+-][0-2]\d:[0-5]\d|Z)$/)) {
        return new Date(value);
      }
      return value;
    }
    var result = COMBON.parse(combon, reviver);
    assert.equal(JSON.stringify(result), JSON.stringify(data));
    done();
  });
  it('Replacer / Select fields', function (done) {
    var data = [{ color: 'blue', animal: 'dog' }, { color: 'green' }];
    var combon = COMBON.stringify(data, ['animal']);
    assert.equal(combon, '(animal:dog)');
    done();
  });
  it('Replacer / Replace function', function (done) {
    var data = [{ color: 'blue', animal: 'dog' }, { color: 'green' }];
    function replacer(key, value) {
      if (key === 'color') return 'black';
      return value;
    }
    var combon = COMBON.stringify(data, replacer);
    assert.equal(combon, '(color:black,animal:dog|color:black)');
    done();
  });
});

describe('Errors', function () {
  it('Invalid input (object)', function (done) {
    assert.throws(function () {
      COMBON.parse({});
    }, Error);
    done();
  });
  it('Invalid input (Unexpected end of Object)', function (done) {
    assert.throws(function () {
      COMBON.parse('(false}');
    }, Error);
    done();
  });
  it('Invalid input (Unexpected end of Input, unmatched Object start/end count)', function (done) {
    assert.throws(function () {
      COMBON.parse('{false)');
    }, Error);
    done();
  });
  it('Invalid input (Unexpected end of Input, unmatched quoted string)', function (done) {
    assert.throws(function () {
      COMBON.parse('"true');
    }, Error);
    done();
  });
  it('Invalid input (Key in Array)', function (done) {
    assert.throws(function () {
      COMBON.parse('true,false:true');
    }, Error);
    done();
  });
  it('Invalid input (Object requires Keys)', function (done) {
    assert.throws(function () {
      COMBON.parse('true:false,true');
    }, Error);
    done();
  });
});

