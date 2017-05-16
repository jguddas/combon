var TBON = require('../');

var data = [
  { day: 'monday', color: 'blue', animal: ['dog', 'cat'] },
  { day: 'tuesday', color: 'green', animal: ['cow', 'sheep'] },
  { day: 'wednesday', color: 'red', animal: 'jaguar' },
  [
    { day: 'tuesday', color: 'green', animal: ['cow', 'sheep'] },
    { day: 'wednesday', color: 'red', animal: 'jaguar' },
  ],
];

function replacer(key, value) {
  if (value === 'jaguar') {
    return { day: 'thursday', color: 'white', animal: 'lion' };
  }
  return value;
}

var str = TBON.stringify(data, replacer);
console.log(str);

var parsed = TBON.parse(str);
console.log(parsed);

console.log('Match:', JSON.stringify(parsed) === JSON.stringify(data, replacer));

str = TBON.stringify(data, ['day', 'color']);
console.log(str);

var parsed = TBON.parse(str);
console.log(parsed);

console.log('Match:', JSON.stringify(parsed) === JSON.stringify(data, ['day', 'color']));

