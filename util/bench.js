var TBON = require('../');
var msgpack = require('msgpack5')();
var msgpackLite = require('msgpack-lite');
var zlib = require('zlib');

var tests = [
  {
    page: 1,
    results: 500,
    images: [
      { id: 1, path: '/blaa/1.jpg', user: { id: 100, name: 'Jorma\n', online: false, gender: ['man', null, 'woman'] } },
      { id: 2, path: '/blaa/2.jpg', user: { id: 200, name: 'Pena\r', online: true } },
      { id: 3, path: '/blaa/3.jpg', user: { id: 300, name: 'Si\\mo' } },
      { id: 4, path: '/blaa/4.jpg', user: { id: 400, name: 'Veikko', profileImage: { id: 5, path: '/blaa/5.jpg', tags: ['kinky', 'stuff'] } } },
    ],
    nextPage: 'pageToken',
  },
  [
    { id: 1, path: '/blaa/1.jpg', user: { id: 6123918, name: 'Jorma', online: false, color: ['blue', 'red', null] } },
    { id: 2, path: '/blaa/2.jpg', user: { id: 0xdeadbeef, name: 'Pena', online: true } },
    { id: 3, path: '/blaa/3.jpg', user: { id: 300, name: 'Simo' } },
    { id: 4, path: '/blaa/4.jpg', user: { id: 400, name: 'Veikko' } },
  ],
  {
    true: false,
    arr: [{ a: 1, b: 2 }, { c: 3, d: [{ e: 4, f: 5 }] }, [], 'red', {}],
    blue: 'green',
  },
  'This is a string.',
  { compact: true, schema: 0 },
  null,
  [[[], {}], { t: [], a: {} }, false, { '~test': '^value' }],
  [[], [], {}, [], {}],
  [true, false],
  [
    {
      title: 'special cases',
      boolT: true,
      boolF: false,
      null: null,
      numberS: '100',
      stringTrue: 'true',
      stringt: '+',
      stringFalse: 'false',
      stringf: '-',
      stringNull: 'null',
      stringn: '?',
      date: new Date(),
    },
    {
      title: 'parens',
      arrValue: [true],
      arrEmpty: [],
      objEmpty: {},
      arrObjs: [{}, {}, {}, {}, {}],
      arrArrays: [[true], [true], [true], [true], [true]],
      arrCascade: [[[[[[[[[[true]]]]]]]]], [[[[[[[false]]]]]]]],
    },
    {
      title: 'escaped',
      'escape1()': true,
      '?': false,
      ':': null,
      ']': {},
      '!': ['escape2()', '?', false, ':', null, '!'],
      'escape3()': '?',
      'escape4()': [true, [false], 'string1', [true], 'string2'],
    },
  ],
  {
    int0: 0, int1: 1, 'int1-': -1, int8: 255, 'int8-': -255, int16: 256, 'int16-': -256,
    int32: 65536, 'int32-': -65536, nil: null, true: true, false: false, float: 0.5,
    'float-': -0.5, string0: '', string1: 'A', string4: 'foobarbaz',
    string8: 'Omnes viae Romam ducunt.',
    string16: 'L’homme n’est qu’un roseau, le plus faible de la nature ; mais c’est un roseau pensant. Il ne faut pas que l’univers entier s’arme pour l’écraser : une vapeur, une goutte d’eau, suffit pour le tuer. Mais, quand l’univers l’écraserait, l’homme serait encore plus noble que ce qui le tue, puisqu’il sait qu’il meurt, et l’avantage que l’univers a sur lui, l’univers n’en sait rien. Toute notre dignité consiste donc en la pensée. C’est de là qu’il faut nous relever et non de l’espace et de la durée, que nous ne saurions remplir. Travaillons donc à bien penser : voilà le principe de la morale.',
    array0: [],
    array1: ['foo'],
    array8: [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576],
    map0: {},
    map1: { foo: 'bar' },
  },
];

function runJSON(input) {
  var json = JSON.stringify(input);
  return {
    json: json,
    bytes: new Buffer(json).length,
    comp: zlib.deflateSync(json).length,
    match: true,
  };
}

function runTBON(input, json) {
  var tbon = TBON.stringify(input);
  return {
    bytes: new Buffer(tbon).length,
    comp: zlib.deflateSync(tbon).length,
    match: JSON.stringify(TBON.parse(tbon)) === json,
  };
}

function runMsgPack(input, json) {
  var msgPack = msgpack.encode(input);
  return {
    bytes: msgPack.length,
    comp: zlib.deflateSync(msgPack).length,
    match: JSON.stringify(msgpack.decode(msgPack)) === json,
  };
}

function runTest(input) {
  var json = runJSON(input);
  var tbon = runTBON(input, json.json);
  var msgPack = runMsgPack(input, json.json);
  return [json.bytes, json.comp, tbon.bytes, tbon.comp, tbon.match, msgPack.bytes, msgPack.comp, msgPack.match];
}

var totals = [0, 0, 0, 0, 0, 0, 0, 0];
console.log('test\tjson\tdeflate\ttbon\tdeflate\tmatch\tmsgpack\tdeflate\tmatch');
for (var i = 0; i <= tests.length; i++) {
  var test = tests[i] !== undefined ? tests[i] : tests;
  var res = runTest(test);
  res.forEach(function (v, i) {
    totals[i] += v;
  });
  res.unshift(i);
  console.log(res.join('\t'));
}
totals.unshift('total');
console.log(totals.join('\t'));

function runTimedTest(fn, param) {
  var count = 0;
  var t = Date.now();
  var duration = 3000;
  var tmp = '';
  while (true) {
    if (Date.now() - t >= duration) break;
    tmp = fn(param);
    count++;
  }
  return (count / (duration / 1000)) | 0;
}

console.log('\nEncode/Stringify operations / sec, * marks fastest');
console.log('test ' + pad('tbon', 9) + pad('msgpack5', 9) + 'msgpack-lite');
for (var i = 0; i <= tests.length; i++) {
  var test = tests[i] !== undefined ? tests[i] : tests;
  var result = {
    tbon: runTimedTest(function (obj) {
      return TBON.stringify(obj).length;
    }, test),
    msgpack: runTimedTest(function (obj) {
      return msgpack.encode(obj).length;
    }, test),
    msgpackLite: runTimedTest(function (obj) {
      return msgpackLite.encode(obj).length;
    }, test),
  };
  if (result.tbon > result.msgpack && result.tbon > result.msgpackLite) result.tbon += '*';
  else if (result.msgpack > result.msgpackLite) result.msgpack += '*';
  else result.msgpackLite += '*';

  console.log(pad(i, 5) + pad(result.tbon, 9) + pad(result.msgpack, 9) + result.msgpackLite);
}

console.log('\nDecode/Parse operations / sec, * marks fastest');
console.log('test ' + pad('tbon', 9) + pad('msgpack5', 9) + 'msgpack-lite');
for (var i = 0; i <= tests.length; i++) {
  var test = tests[i] !== undefined ? tests[i] : tests;
  var result = {
    tbon: runTimedTest(function (obj) {
      return TBON.parse(obj);
    }, TBON.stringify(test)),
    msgpack: runTimedTest(function (obj) {
      return msgpack.decode(obj);
    }, msgpack.encode(test)),
    msgpackLite: runTimedTest(function (obj) {
      return msgpackLite.decode(obj);
    }, msgpackLite.encode(test)),
  };
  if (result.tbon > result.msgpack && result.tbon > result.msgpackLite) result.tbon += '*';
  else if (result.msgpack > result.msgpackLite) result.msgpack += '*';
  else result.msgpackLite += '*';

  console.log(pad(i, 5) + pad(result.tbon, 9) + pad(result.msgpack, 9) + result.msgpackLite);
}

function pad(str, len) {
  return (str + new Array(len + 1).join(' ')).substring(0, len);
}
