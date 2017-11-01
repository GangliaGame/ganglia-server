'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();

var port = process.env.PORT || 9000;

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var NUM_BAYS = 2;
var PORTS_PER_BAY = 4;

var makeBay = function makeBay(size) {
  return Array(size).fill().map(function (_, i) {
    return {
      wire: null,
      isOnline: true
    };
  });
};

var bays = Array(NUM_BAYS).fill().map(function () {
  return makeBay(4);
});

// null => no wire present
// undefined => wildcard
// n => wire n
var combos = [{
  name: 'REBOOT',
  sequence: [[0, 1, null, null], [0, 1, null, null]]
}, {
  name: 'BOOST_SHIELDS',
  sequence: [['*', '*', 2, 3], ['*', '*', '*', '*']]
}, {
  name: 'BOOST_SHIELDS',
  sequence: [['*', '*', '*', '*'], ['*', '*', 2, 3]]
}, {
  name: 'BAY_0_EMPTY',
  sequence: [[null, null, null, null], ['*', '*', '*', '*']]
}, {
  name: 'PHASERS',
  sequence: [[0, 1, 2, '*'], ['*', '*', '*', '*']]
}];

var componentMatches = function componentMatches(_ref) {
  var _ref2 = _slicedToArray(_ref, 2),
      a = _ref2[0],
      b = _ref2[1];

  return a === '*' || b === '*' || a === b;
};
var sequenceMatches = function sequenceMatches(A, B) {
  return _lodash2.default.zip(_lodash2.default.flatten(A), _lodash2.default.flatten(B)).every(componentMatches);
};
var baysToSequence = function baysToSequence(bays) {
  return bays.map(function (bay) {
    return bay.map(function (_ref3) {
      var wire = _ref3.wire;
      return wire;
    });
  });
};
var getCombos = function getCombos(bays, combos) {
  return combos.filter(function (_ref4) {
    var sequence = _ref4.sequence;
    return sequenceMatches(baysToSequence(bays), sequence);
  }).map(function (_ref5) {
    var name = _ref5.name;
    return name;
  });
};

var serializeState = function serializeState(bays, combos) {
  return { bays: bays, combos: getCombos(bays, combos) };
};
var sendStateAsJson = function sendStateAsJson(res) {
  return res.json(serializeState(bays, combos));
};

app.get('/connect/wire/:wire/port/:port/bay/:bay', function (req, res) {
  var wire = Number(req.params.wire);
  var bay = Number(req.params.bay);
  var port = Number(req.params.port);
  console.log('connected wire ' + wire + ' to port ' + port + ' bay ' + bay);
  bays[bay][port].wire = wire;
  sendStateAsJson(res);
});

app.get('/disconnect/port/:port/bay/:bay', function (req, res) {
  var bay = Number(req.params.bay);
  var port = Number(req.params.port);
  var wire = bays[bay][port].wire;
  if (wire === null) {
    console.log('WARNING: no wire is plugged in to ' + port + ' bay ' + bay);
  } else {
    console.log('disconnected wire ' + String(wire) + ' from port ' + port + ' bay ' + bay);
    bays[bay][port].wire = null;
  }
  sendStateAsJson(res);
});

app.get('/state', function (req, res) {
  sendStateAsJson(res);
});

app.listen(port, function () {
  addAlreadyPluggedInDevices();
  console.log('Serving on port ' + port + ' \uD83D\uDE43');
});