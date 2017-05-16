###### TBON Version 1, mimetype application/x-tbon1
# TBON Specification
TBON is an efficient text based object serialization format, modelled after JSON but focusing on size instead of human readability.

TBON being text based is easier to parse than MessagePack but in some cases is not as efficient.

TBON is compatible with JSON, so stringify - parse cycle with TBON produces the same result as JSON.


## Format
Like JSON, TBON supports Objects, Arrays, Strings, Booleans, Numbers and null.

Objects and Arrays start with "(", "[", "{" or "|" and end with "|", "}", "]" or "}".

Root is auto detected so top level Object / Array must not have parentheses, brackets, braces or pipe.


## Parentheses, brackets, braces and pipe
Double parentheses "((" and "))" may be encoded as "[" and "]".

Quad parentheses "((((" and "))))" may be encoded as "{" and "}".

Closing followed Opening parentheses ")(" may be encoded as "|".

Parentheses, brackets and braces do not need to be matching, so "((]" is valid encoding.


### Object
Contains Key - Value pairs.

Key is separated from Value by : if Value is String or Number, otherwise no separator is needed.

Key - Value pairs are separated from each other by \` in case previous Value was a String or Number.

Empty Object is encoded as ~ without parentheses, brackets or braces.


### Array
Contains Values.

Values are separated by \` in case previous Value was a String or Number.

Empty Array is encoded as ^ without parentheses, brackets or braces.


### Value
Value may be Object, Array, String, Number, Boolean or null.


### String
May contain any unicode character.

Characters :?!+^~\`{[(|)]} need to be escaped with backslash (\\) or the whole String may be double quoted.

Double quotes ("), control characters (\\n\\b\\r\\f\\t) and backslash (\\) need to be escaped with a backslash (\\).


### Number
Numbers follow the same format as JSON.

As TBON has only one way of storing Values, Strings that can be interpreted as numbers must be quoted.


### Boolean / null
True is encoded as +, False is encoded as ! and null is encoded as ?.

