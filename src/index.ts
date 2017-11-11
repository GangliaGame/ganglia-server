import * as _ from 'lodash'
import * as express from 'express'
const app = express()

const ENEMY_ADVANCE_TIME = 3000
const POINTS_PER_ENEMY = 25
const NUM_STARTING_ENEMIES = 4
const GRID_SIZE = 15
const NUM_BAYS = 2
const PORTS_PER_BAY = 4 // also change SequenceComponent type

type timestamp = number
type seconds = number

type Weapon = {
  name: string,
  color: 'pink' | 'blue' | 'white' | 'black',
  sequence: Sequence,
  duration: seconds,
}

const weapons: Array<Weapon> = [
  {
    name: 'Disruptor Beam',
    sequence: [[3,'*','*',2],['*','*','*','*']],
    duration: 10,
    color: 'blue',
  },
  {
    name: 'Pulse Bomb',
    sequence: [[3,null,0,null],['*','*','*','*']],
    duration: 10,
    color: 'pink',
  },
  {
    name: 'Phasers',
    sequence: [[3,null,null,0],['*','*','*','*']],
    duration: 10,
    color: 'black',
  },
  {
    name: 'Photon Torpedos',
    sequence: [[3,null,null,1],['*','*','*','*']],
    duration: 10,
    color: 'white',
  },
]

enum EnemyKind {
  Blue = 'blue',
  Pink = 'pink',
  White = 'white',
  Black = 'black',
}

type EnemyID = number

type Enemy = {
  x: number,
  y: number,
  kind: string,
  id: EnemyID,
  isDestroyed: boolean,
}

type Port = {
  wire?: number,
  isOnline: boolean,
}

type Bay = Array<Port>

type SequenceComponent = number | '*' | null

type Sequence = Array<Array<SequenceComponent>>

type GameState = {
  bays: Array<Bay>,
  enemies: Array<Enemy>,
  weaponStartTime?: timestamp,
  weapon?: Weapon,
  gameOver: boolean,
  gameWon: boolean,
  score: number,
  gameStarted: boolean,
  gameStartTime?: timestamp,
}

function newGameState(): GameState {
  const makeBay = (size: number): Bay => _.range(size).map(() => ({
  	wire: null,
  	isOnline: true,
  }))
  const startingEnemies = _.times(NUM_STARTING_ENEMIES, i => newEnemy(i))
  return {
    bays: _.range(NUM_BAYS).map(() => makeBay(PORTS_PER_BAY)),
    enemies: startingEnemies,
    weapon: null,
    weaponStartTime: null,
    gameOver: false,
    gameWon: false,
    gameStarted: false,
    gameStartTime: Date.now(),
    score: 0,
  }
}

function activeWeapon(bays: Array<Bay>, weapons: Array<Weapon>): Weapon | null {
  const componentMatches = ([a, b]: [SequenceComponent, SequenceComponent]) => (a === '*') || (b === '*') || (a === b)
  const sequenceMatches = (A: Sequence, B: Sequence) => _.zip(_.flatten(A), _.flatten(B)).every(componentMatches)
  const baysToSequence = (bays: Array<Bay>) => bays.map(bay => bay.map(({wire}) => wire))
  const weapon = weapons.find(({sequence}) => sequenceMatches(baysToSequence(bays), sequence))
  // No weapon active
  if (!weapon) {
    return null
  }
  return weapon
}

function newEnemy(id: EnemyID): Enemy {
  const randomXPosition: number = _.random(GRID_SIZE - 1)
  const randomEnemyKind: string = _.sample(_.keys(EnemyKind))
  return {
    id,
    x: randomXPosition,
    y: 0,
    kind: randomEnemyKind,
    isDestroyed: false,
  }
}

function advanceEnemies(state: GameState): GameState {
  let newState = _.cloneDeep(state)
  const advanceEnemy = (enemy: Enemy): Enemy => {
    if (enemy.isDestroyed) return enemy
    enemy.y = Math.min(enemy.y + 1, 14)
    if (enemy.y === GRID_SIZE) {
      state.gameOver = true
    }
    return enemy
  }
  newState.enemies = state.enemies.map(advanceEnemy)
  return newState
}

function addEnemy(state: GameState): GameState {
  let newState = _.cloneDeep(state)
  const nextEnemyId: EnemyID = _.max(_.map(state.enemies, 'id')) + 1
  newState.enemies = _.concat(state.enemies, newEnemy(nextEnemyId))
  return newState
}

function gameTick(state: GameState) {
  if (!state.gameStarted || state.gameOver) return;
  if (state.weaponStartTime && state.weapon) {
    const weaponMillisRemaining = Date.now() - state.weaponStartTime
    const didWeaponExpire = weaponMillisRemaining > state.weapon.duration * 1000
    if (didWeaponExpire) {
      state.weapon = null
      state.weaponStartTime = null
    }
  }
}

function gameAdvanceTick(state: GameState) {
  if (!state.gameStarted || state.gameOver) return
  if (state.gameStartTime) {
    advanceEnemies(state)
  }
}

function destroyEnemy(id: EnemyID, state: GameState): GameState {
  let newState = _.cloneDeep(state)
  newState.enemies = state.enemies.map(enemy => {
    if (enemy.id === id) {
      enemy.isDestroyed = true
      state.score += POINTS_PER_ENEMY
    }
    return enemy
  })
  newState.gameWon = newState.enemies.every(enemy => enemy.isDestroyed)
  return newState
}

// set CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

app.get('/state', (req, res) => {
	res.json(state)
})

app.get('/connect/wire/:wire/port/:port/bay/:bay', (req, res) => {
	const wire = Number(req.params.wire)
	const bay = Number(req.params.bay)
	const port = Number(req.params.port)
	console.log(`⭕️  Connected wire ${wire} to port ${port} bay ${bay}`)
	state.bays[bay][port].wire = wire
  if (!state.gameOver) {
    state.gameStarted = true
  }
  state.weapon = activeWeapon(state.bays, weapons)
  if (state.weapon) {
    state.weaponStartTime = Date.now()
  }
	res.json(state)
})

app.get('/disconnect/port/:port/bay/:bay', (req, res) => {
	const bay = Number(req.params.bay)
	const port = Number(req.params.port)
	const wire = state.bays[bay][port].wire
	if (wire === null) {
		console.log(`⚠️  WARNING: no wire is plugged in to ${port} bay ${bay}`)
	} else {
		console.log(`❌  Disconnected wire ${String(wire)} from port ${port} bay ${bay}`)
		state.bays[bay][port].wire = null
	}
  state.weapon = activeWeapon(state.bays, weapons)
	res.json(state)
})

app.get('/destroy/enemy/:enemyId', (req, res) => {
  const enemyId = Number(req.params.enemyId)
  console.log(`💥  Destroyed enemy with id ${enemyId}`)
  state = destroyEnemy(enemyId, state)
  res.json(state)
})

app.get('/newGame', (req, res) => {
  state = newGameState()
  res.json(state)
})

const port = process.env.PORT || 9000
app.listen(port, () => {
  console.log(`👾  Serving on port ${port}`)
})

let state = newGameState()

setInterval(() => gameTick(state), 10)
setInterval(() => gameAdvanceTick(state), ENEMY_ADVANCE_TIME)
