# TBON
TBON is an efficient text based object serialization format, modelled after JSON but focusing on size instead of human readability.

TBON being text based is easier to parse than MessagePack but in some cases is not as efficient.

TBON is compatible with JSON, so stringify - parse cycle with TBON produces the same result as JSON.


## Javascript implementation
This javascript implementation of TBON is drop in replacement for JSON.

Only difference is that since TBON is not supposed to be human readable the 3rd parameter (whitespace) of JSON.stringify is not supported in TBON.stringify.


## License
Both the [javascript implementation](src/tbon.js) and the [specification](spec.md) are licensed under [MIT license](LICENSE).

