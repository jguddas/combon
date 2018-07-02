# COMBON
COMBON is an efficient text based object serialization format based on [TBON](https://github.com/empee/tbon).

COMBON is compatible with JSON, so stringify - parse cycle with COMBON produces the same result as JSON.

## Javascript implementation
This javascript implementation of COMBON is drop in replacement for JSON.

Only difference is that the 3rd parameter (whitespace) of JSON.stringify is not supported in COMBON.stringify.

## License
Both the [javascript implementation](src/combon.js) and the [specification](spec.md) are licensed under [MIT license](LICENSE).

