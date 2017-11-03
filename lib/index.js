'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();

var ENEMY_ADVANCE_TIME = 3000;
var POINTS_PER_ENEMY = 25;
var NUM_STARTING_ENEMIES = 4;
var GRID_SIZE = 15;
var NUM_BAYS = 2;
var PORTS_PER_BAY = 4; // also change SequenceComponent type

var weapons = [{
  name: 'Disruptor Beam',
  sequence: [[3, '*', '*', 2], ['*', '*', '*', '*']],
  duration: 10,
  color: 'blue'
}, {
  name: 'Pulse Bomb',
  sequence: [[3, null, 0, null], ['*', '*', '*', '*']],
  duration: 10,
  color: 'pink'
}, {
  name: 'Phasers',
  sequence: [[3, null, null, 0], ['*', '*', '*', '*']],
  duration: 10,
  color: 'black'
}, {
  name: 'Photon Torpedos',
  sequence: [[3, null, null, 1], ['*', '*', '*', '*']],
  duration: 10,
  color: 'white'
}];

var enemyKinds = {
  Blue: 'blue',
  Pink: 'pink',
  White: 'white',
  Black: 'black'
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
    weaponStartTime: null,
    gameOver: false,
    gameStarted: false,
    gameStartTime: Date.now(),
    score: 0
  };
}

function activeWeapon(bays, weapons) {
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
  var weapon = weapons.find(function (_ref4) {
    var sequence = _ref4.sequence;
    return sequenceMatches(baysToSequence(bays), sequence);
  });
  // No weapon active
  if (!weapon) {
    return null;
  }
  return weapon;
}

function newEnemy(id) {
  var randomXPosition = _lodash2.default.random(GRID_SIZE - 1);
  var randomEnemyKind = _lodash2.default.sample(_lodash2.default.values(enemyKinds));
  return {
    id: id,
    x: randomXPosition,
    y: 0,
    kind: randomEnemyKind,
    isDestroyed: false
  };
}

function advanceEnemies(state) {
  var newState = _lodash2.default.cloneDeep(state);
  var advanceEnemy = function advanceEnemy(enemy) {
    if (enemy.isDestroyed) return;
    enemy.y += 1;
    if (enemy.y === GRID_SIZE) {
      state.gameOver = true;
    }
    return enemy;
  };
  newState.enemies = state.enemies.map(advanceEnemy);
  return newState;
}

function addEnemy(state) {
  var newState = _lodash2.default.cloneDeep(state);
  var nextEnemyId = _lodash2.default.max(_lodash2.default.map(state.enemies, 'id')) + 1;
  newState.enemies = _lodash2.default.concat(state.enemies, newEnemy(nextEnemyId));
  return newState;
}

function gameTick(state) {
  if (!state.gameStarted || state.gameOver) return;
  if (state.weaponStartTime && state.weapon) {
    var weaponMillisRemaining = Date.now() - state.weaponStartTime;
    var didWeaponExpire = weaponMillisRemaining > state.weapon.duration * 1000;
    if (didWeaponExpire) {
      state.weapon = null;
      state.weaponStartTime = null;
    }
  }
}

function gameAdvanceTick(state) {
  if (!state.gameStarted || state.gameOver) return;
  if (state.gameStartTime) {
    advanceEnemies(state);
  }
}

function destroyEnemy(id, state) {
  var newState = _lodash2.default.cloneDeep(state);
  newState.enemies = state.enemies.map(function (enemy) {
    if (enemy.id === id) {
      enemy.isDestroyed = true;
      state.score += POINTS_PER_ENEMY;
    }
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
  if (!state.gameOver) {
    state.gameStarted = true;
  }
  state.weapon = activeWeapon(state.bays, weapons);
  if (state.weapon) {
    state.weaponStartTime = Date.now();
  }
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
  state.weapon = activeWeapon(state.bays, weapons);
  res.json(state);
});

app.get('/destroy/enemy/:enemyId', function (req, res) {
  var enemyId = Number(req.params.enemyId);
  console.log('\uD83D\uDCA5  Destroyed enemy with id ' + enemyId);
  state = destroyEnemy(enemyId, state);
  res.json(state);
});

app.get('/newGame', function (req, res) {
  state = newGameState();
});

var port = process.env.PORT || 9000;
app.listen(port, function () {
  console.log('\uD83D\uDC7E  Serving on port ' + port);
});

var state = newGameState();

setInterval(function () {
  return gameTick(state);
}, 10);
setInterval(function () {
  return gameAdvanceTick(state);
}, ENEMY_ADVANCE_TIME);