'use sctrict'

var hasProp = {}.hasOwnProperty

module.exports = function inherits (child, parent) {
  for (var key in parent) {
    if (hasProp.call(parent, key)) child[key] = parent[key]
  }
  function Ctor () {
    this.constructor = child
  }
  Ctor.prototype = parent.prototype
  child.prototype = new Ctor()
  child.__super__ = parent.prototype
}
