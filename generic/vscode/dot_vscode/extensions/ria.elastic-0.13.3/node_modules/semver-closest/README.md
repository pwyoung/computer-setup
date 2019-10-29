[![Travis](https://img.shields.io/travis/pastelsky/semver-closest.svg)]()
[![npm](https://img.shields.io/npm/v/semver-closest.svg)]()

Find the closest semver formatted version (`<major>.<minor>.<patch>`) from  a list of semver formatted versions

## Examples
```js
const closestSemver = require('semver-closest')

closestSemver('1.2.0', ['1.1.9', '1.2.0', '1.2.1'])
// returns '1.2.0'

closestSemver('1.2.0', ['1.1.9', '1.3.1', '1.2.1'])
// returns '1.1.9'

closestSemver('2.2.0', ['4.1.9', '10.3.1', '3.2.1'])
// returns '3.2.1'
```