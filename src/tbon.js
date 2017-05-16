/*   __ ___.                   *
 * _/  |\_ |__   ____   ____   *
 * \   __\ __ \ /  _ \ /    \  *
 *  |  | | \_\ (  <_> )   |  \ *
 *  |__| |___  /\____/|___|  / *
 *  (c) 2017 \/  toyboy    \/  */
(function (root, mod) {
  if (typeof module === 'object' && module.exports) {
    module.exports = mod;
  } else if (typeof define === 'function' && define.amd) {
    define(function () { return mod; });
  } else root.TBON = mod;
})(this, (function () {
  function TBON() {};

  var re = {
    stringIllegal: /[:?!+^~`{[(|)\]}]/,
    controlEscape: /[\n\r\t\b\f"\\]/g,
    controlUnescape: /\\[nrtbf"\\]/g,
  };

  var isArray = Array.isArray, concat = Array.prototype.concat;
  var push = Array.prototype.push, ObjectKeys = Object.keys, splice = Array.prototype.splice;

  TBON.parse = function (input, reviver) {
    if (!input || typeof input !== 'string') err('invalidInput');

    var parse = /([":?!+^~`{[(|)\]}])/g, tbon = '' + input;
    var parent = [], node, m, pos = 0, part = key = objKey = '';
    var create = true, inArray = quoted = inString = false;

    function createNode(count, obj) {
      create = false;

      if (node) {
        push.call(parent, node);
        if (!!key || obj) {
          insertNode({}, true);
          inArray = false;
        } else {
          insertNode([], true);
          inArray = true;
        }
      } else {
        if (!!key || obj) {
          inArray = false;
          node = {};
        } else {
          inArray = true;
          node = [];
        }
      }

      if (--count) createNode(count);
    }

    function insertNode(value, setNode) {
      if (inArray) {
        if (setNode) {
          if (!!objKey) err('arrKeys');
          node = node[push.call(node, value) - 1];
        } else {
          if (!!key) err('arrKeys');
          push.call(node, value);
        }
      } else {
        if (setNode) {
          if (!objKey) err('objKeys');
          node[objKey] = value;
          node = node[objKey];
          objKey = '';
        } else {
          if (!key) err('objKeys');
          node[key] = value;
          key = '';
        }
      }
      inValue = false;
    }

    function closeNode(count) {
      node = parent.pop();
      if (!node) err('endObj');
      inArray = isArray(node) ? true : false;
      if (--count) closeNode(count);
    }

    function err(type) {
      var msg = '';
      switch (type) {
        case 'invalidInput': msg = 'Invalid input'; break;
        case 'arrKeys': msg = 'Syntax error: Array does not allow keys'; break;
        case 'objKeys': msg = 'Syntax error: Object requires keys'; break;
        case 'endObj': msg = 'Syntax error: Unexpected end of Object'; break;
        case 'endInput': msg = 'Syntax error: Unexpected end of Input'; break;
      }
      if (m && m.index) {
        var errPos = m.index - 60 < 0 ? m.index : 60;
        msg += '\n' + tbon.substring(pos - errPos, m.index + 19) + '\n';
        msg += Array(61).join('-').substring(0, errPos) + '^\n';
      }
      throw Error(msg);
    }

    function setValue(value, isString) {
      if (create) createNode(1);
      if (quoted || isString) insertNode(parseValue(value, quoted));
      else insertNode(value, false);
    }

    function startNode(count) {
      if (create) createNode(1, part !== '');
      if (!inArray) objKey = part;
      else if (pos !== m.index) setValue(part, true);
      if (count) createNode(count);
      create = true;
    }

    function emptyNode(node) {
      if (create || !inArray) key = part;
      else if (pos !== m.index) setValue(part, true);
      quoted = false;
      setValue(node, false);
    }

    function specialNode(value) {
      if (create || !inArray) key = part;
      else if (pos !== m.index) setValue(part, true);
      quoted = false;
      setValue(value, false);
    }

    function endNode(count) {
      if (pos !== m.index) setValue(part, true);
      closeNode(count);
    }

    while (m = parse.exec(tbon)) {
      if (tbon[m.index - 1] === '\\') continue;
      if (m[1] === '"') {
        if (inString) quoted = true;
        inString = !inString;
        continue;
      }

      if (inString) continue;

      part = quoted ? tbon.substring(pos + 1, m.index - 1) : tbon.substring(pos, m.index);

      if (m[1] === '(') {        // Start Obj
        startNode();
      } else if (m[1] === '[') { // Start Obj x2
        startNode(1);
      } else if (m[1] === '{') { // Start Obj x4
        startNode(3);
      } else if (m[1] === '|') { // Close & Start Obj
        endNode(1);
        create = true;
      } else if (m[1] === '}') { // Close Obj x4
        endNode(4);
      } else if (m[1] === ']') { // Close Obj x2
        endNode(2);
      } else if (m[1] === ')') { // Close Obj
        endNode(1);
      } else if (m[1] === '~') { // Empty Object
        emptyNode({});
      } else if (m[1] === '^') { // Empty Array
        emptyNode([]);
      } else if (m[1] === '`') { // Value-Key/Value separator
        setValue(part, true);
      } else if (m[1] === ':') { // Key-String/Number separator
        key = part;
      } else if (m[1] === '!') { // False
        specialNode(false);
      } else if (m[1] === '+') { // True
        specialNode(true);
      } else if (m[1] === '?') { // Null
        specialNode(null);
      } else throw Error('Unknown parse error'); // We should never get here..
      pos = m.index + 1;
      quoted = false;
    }

    if (!parent || parent.length > 0 || inString) err('endInput');

    var m = quoted ? tbon.slice(pos + 1, -1) : tbon.slice(pos);
    if (m && m !== '') setValue(m, true);

    if (isArray(node) && node.length === 1) {
      return reviver ? revive(node[0], reviver) : node[0];
    }
    return reviver ? revive(node, reviver) : node;
  };

  TBON.stringify = function (obj, replacer) {
    if (obj === undefined) return undefined;

    var tbon = [], start = 0, end = 0, pos = 0, four = 0, two = 0, one = 0, replacerFn = (typeof replacer === 'function');

    function isValue(t, n) {
      if (t === 'string') return true;
      if (t === 'number') return true;
      if (t === 'boolean') return true;
      if (t === 'undefined') return true;
      if (n === null) return true;
      if (n && n.toJSON) return true;
      return false;
    }

    function isSpecial(t, n) {
      if (t === 'boolean') return true;
      if (t === 'undefined') return true;
      if (n === null) return true;
      if (t === 'number' && !isFinite(n)) return true;
      return false;
    }

    function encodeParens(len, close) {
      if (len === 0) return;
      pos = tbon.length - 1;
      if (len === 1) push.call(tbon, close ? ')' : '(');
      else if (len === 2) push.call(tbon, close ? ']' : '[');
      else if (len === 3) {
        if (close) push.call(tbon, ']', ')');
        else push.call(tbon, '(', '[');
      } else if (len === 4) push.call(tbon, close ? '}' : '{');
      else {
        four = len / 4 | 0;
        two = (len - four * 4) / 2 | 0;
        one = len - four * 4 - two * 2;
        if (!close) {
          tbon = concat.call(tbon, (new Array(one + 1).join('(') + new Array(two + 1).join('[') +
                                   new Array(four + 1).join('{')).split(''));
        } else {
          tbon = concat.call(tbon, (new Array(four + 1).join('}') + new Array(two + 1).join(']') +
                                   new Array(one + 1).join(')')).split(''));
        }
      }
      if (close) end = 0;
      else start = 0;
      if (!close && tbon[pos] === ')' && tbon[pos + 1] === '(') splice.call(tbon, pos, 2, '|');
    }

    function encodeValue(t, o, key) {
      if (end > 0) encodeParens(end, true);
      if (start > 0) {
        encodeParens(start, false);
        start = 0;
      }
      if (key) encodeString(key);
      if (t === 'string') {
        if (o === '') {
          push.call(tbon, ':');
        } else if (o === '?' || o === '+' || o === '!' || !isNaN(+o)) {
          if (key) push.call(tbon, ':');
          push.call(tbon, '"' + o + '"');
        } else {
          if (key) push.call(tbon, ':');
          encodeString(o);
        }
      } else if (t === 'boolean') {
        push.call(tbon, o ? '+' : '!');
      } else if (t === 'number') {
        if (isNaN(o) || !isFinite(o)) push.call(tbon, '?');
        else push.call(tbon, key ? ':' : null, o);
      } else if (o && o.toJSON) {
        if (key) push.call(tbon, ':');
        push.call(tbon, '"' + o.toJSON() + '"');
      } else push.call(tbon, '?');
    }

    function encodeString(str) {
      if (str.match(re.stringIllegal)) {
        push.call(tbon, '"' + str.replace(re.controlEscape, escaper) + '"');
      } else {
        push.call(tbon, str.replace(re.controlEscape, escaper));
      }
    }

    function walkObj(o, key, skip, inArray) {
      var count = 0;
      if (key) {
        if (start > 0) encodeParens(start, false);
        encodeString(key);
      }

      if (!skip) start++;

      if (inArray) {
        var len = o.length;

        if (len === 0) {
          start--;
          if (end > 0) encodeParens(end, true);
          if (start > 0) encodeParens(start, false);
          push.call(tbon, '^');
          return;
        }

        for (var k = 0, lt, lo, t; k < len; k++) {
          t = typeof o[k];
          if (lt && isValue(lt, lo) && !isSpecial(lt, lo)) push.call(tbon, '`');
          if (walk(o[k], k, false, true)) {
            count++;
            lt = t;
            lo = o[k];
          } else lt = null;
        }
      } else {
        var keys = ObjectKeys(o);

        if (keys.length === 0) {
          start--;
          if (end > 0) encodeParens(end, true);
          if (start > 0) encodeParens(start, false);
          push.call(tbon, '~');
          return;
        }

        var lt, lo, t, k;

        for (k in keys) {
          t = typeof o[keys[k]];
          if (lt && isValue(lt, lo) && !isSpecial(lt, lo)) push.call(tbon, '`');
          if (end > 0) encodeParens(end, true);
          if (walk(o[keys[k]], keys[k], false, false)) {
            count++;
            lt = t;
            lo = o[keys[k]];
          } else lt = null;
        }
      }

      if (count === 0) {
        start--;
      } else if (!skip) end++;
    }

    function walk(o, key, skip, skipKey) {
      if (replacer) {
        if (replacerFn) {
          o = replacer(key, o);
          if (o === undefined) return false;
        } else if (!skipKey && replacer.indexOf(key) === -1) return false;
      }
      t = typeof o;
      if (isValue(t, o)) encodeValue(t, o, skipKey ? undefined : key);
      else if (isArray(o)) walkObj(o, skipKey ? undefined : key, skip, true);
      else if (o.toJSON) encodeValue(t, o, skipKey ? undefined : key);
      else walkObj(o, skipKey ? undefined : key, skip, false);
      return true;
    }

    walk(obj, '', !isValue(typeof obj), true);
    if (end > 0) encodeParens(end, true);

    return tbon.join('');
  };

  function parseValue(val, forceString) {
    val = val.replace(re.controlUnescape, escaper);
    if (!forceString && val !== '' && !isNaN(+val)) val = +val;
    return val;
  }

  function escaper(chr) {
    switch (chr) {
      case '\\': return '\\\\';
      case '\\\\': return '\\';
      case '"': return '\\"';
      case '\\"': return '"';
      case '\n': return '\\n';
      case '\\n': return '\n';
      case '\r': return '\\r';
      case '\\r': return '\r';
      case '\t': return '\\t';
      case '\\t': return '\t';
      case '\b': return '\\b';
      case '\\b': return '\b';
      case '\f': return '\\f';
      case '\\f': return '\f';
    }
  }

  function revive(data, reviver) {
    function walk(node, key, value) {
      var el = value ? value : node;
      if (Array.isArray(el)) {
        el = walkObj.call(el, true);
      } else if (typeof el === 'object' && Object.keys(el).length > 0) {
        el = walkObj.call(el, false);
      }
      if (key !== undefined) return reviver.call(node, key, el);
      return el;
    }

    function walkObj(isArray) {
      if (isArray) {
        for (var i = 0, len = this.length; i < len; i++) {
          this[i] = walk(this, '' + i, this[i]);
          if (!this[i]) delete this[i];
        }
      } else {
        var keys = Object.keys(this), k;
        for (k in keys) {
          this[keys[k]] = walk(this, keys[k], this[keys[k]]);
          if (!this[keys[k]]) delete this[keys[k]];
        }
      }
      return this;
    }

    return walk(data);
  }

  return TBON;
})());

