'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();

var NUM_STARTING_ENEMIES = 5;
var GRID_SIZE = 15;
var NUM_BAYS = 2;
var PORTS_PER_BAY = 4; // also change SequenceComponent type

var weapons = {
  Phasers: 'Phasers',
  PulseBomb: 'Pulse Bomb',
  DisruptorBeam: 'Disruptor Beam'
};

var combos = [{
  weapon: 'DisruptorBeam',
  sequence: [[0, '*', '*', 3], ['*', '*', '*', '*']]
}, {
  weapon: 'PulseBomb',
  sequence: [[null, null, 1, 3], ['*', '*', '*', '*']]
}, {
  weapon: 'Phasers',
  sequence: [[3, 2, null, null], ['*', '*', '*', '*']]
}];

var enemyKinds = {
  Green: 'green',
  Orange: 'orange',
  Purple: 'purple'
};

function newGameState() {
  var makeBay = function makeBay(size) {
    return Array(size).fill().map(function () {
      return {
        wire: null,
        isOnline: true
      };
    });
  };
  var startingEnemies = _lodash2.default.times(NUM_STARTING_ENEMIES, function (i) {
    return newEnemy(i);
  });
  return {
    bays: Array(NUM_BAYS).fill().map(function () {
      return makeBay(PORTS_PER_BAY);
    }),
    enemies: startingEnemies,
    weapon: null,
    gameOver: false,
    score: 0
  };
}

function activeWeapon(bays, combos) {
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
  var activeCombo = combos.find(function (_ref4) {
    var sequence = _ref4.sequence;
    return sequenceMatches(baysToSequence(bays), sequence);
  });
  return activeCombo ? activeCombo.weapon : null;
}

function newEnemy(id) {
  var randomXPosition = _lodash2.default.random(GRID_SIZE);
  var randomEnemyKind = _lodash2.default.sample(_lodash2.default.values(enemyKinds));
  return {
    id: id,
    x: randomXPosition,
    y: 0,
    kind: randomEnemyKind,
    isDestroyed: false
  };
}

function addEnemy(state) {
  var newState = _lodash2.default.cloneDeep(state);
  var nextEnemyId = _lodash2.default.max(_lodash2.default.map(state.enemies, 'id')) + 1;
  newState.enemies = _lodash2.default.concat(state.enemies, newEnemy(nextEnemyId));
  return newState;
}

function destroyEnemy(id, state) {
  var newState = _lodash2.default.cloneDeep(state);
  newState.enemies = state.enemies.map(function (enemy) {
    if (enemy.id === id) enemy.isDestroyed = true;
    return enemy;
  });
  return newState;
}

// set CORS headers
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/state', function (req, res) {
  res.json(state);
});

app.get('/connect/wire/:wire/port/:port/bay/:bay', function (req, res) {
  var wire = Number(req.params.wire);
  var bay = Number(req.params.bay);
  var port = Number(req.params.port);
  console.log('\u2B55\uFE0F  Connected wire ' + wire + ' to port ' + port + ' bay ' + bay);
  state.bays[bay][port].wire = wire;
  state.weapon = activeWeapon(state.bays, combos);
  res.json(state);
});

app.get('/disconnect/port/:port/bay/:bay', function (req, res) {
  var bay = Number(req.params.bay);
  var port = Number(req.params.port);
  var wire = state.bays[bay][port].wire;
  if (wire === null) {
    console.log('\u26A0\uFE0F  WARNING: no wire is plugged in to ' + port + ' bay ' + bay);
  } else {
    console.log('\u274C  Disconnected wire ' + String(wire) + ' from port ' + port + ' bay ' + bay);
    state.bays[bay][port].wire = null;
  }
  state.weapon = activeWeapon(state.bays, combos);
  res.json(state);
});

app.get('/destroy/enemy/:enemyId', function (req, res) {
  var enemyId = Number(req.params.enemyId);
  console.log('\uD83D\uDCA5  Destroyed enemy with id ' + enemyId);
  state = destroyEnemy(enemyId, state);
  res.json(state);
});

var port = process.env.PORT || 9000;
app.listen(port, function () {
  console.log('\uD83D\uDC7E  Serving on port ' + port);
});

var state = newGameState();