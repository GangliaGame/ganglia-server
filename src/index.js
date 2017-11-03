//@flow
import _ from 'lodash'
import type { $Request } from 'express';
import express from 'express'
const app = express()

const NUM_STARTING_ENEMIES = 5
const GRID_SIZE = 15
const NUM_BAYS = 2
const PORTS_PER_BAY = 4 // also change SequenceComponent type

const weapons = {
  Phasers: 'Phasers',
  PulseBomb: 'Pulse Bomb',
  DisruptorBeam: 'Disruptor Beam',
}

const combos: $ReadOnlyArray<Combo> = [
  {
    weapon: 'DisruptorBeam',
    sequence: [[0,'*','*',3],['*','*','*','*']],
  },
  {
    weapon: 'PulseBomb',
    sequence: [[null,null,1,3],['*','*','*','*']],
  },
  {
    weapon: 'Phasers',
    sequence: [[3,2,null,null],['*','*','*','*']],
  },
]

type Weapon = $Keys<typeof weapons>

const enemyKinds = {
  Green: 'green',
  Orange: 'orange',
  Purple: 'purple',
}

type EnemyKind = $Keys<typeof enemyKinds>

type EnemyID = number

type Enemy = {
  x: number,
  y: number,
  kind: EnemyKind,
  id: EnemyID,
  isDestroyed: boolean,
}

type Port = {
  wire: ?number,
  isOnline: boolean,
}

type Bay = Array<Port>

type SequenceComponent = 0 | 1 | 2 | 3 | '*' | null

type Sequence = Array<Array<SequenceComponent>>

type Combo = {
  weapon: Weapon,
  sequence: Sequence,
}

type GameState = {
  bays: Array<Bay>,
  enemies: Array<Enemy>,
  weapon: ?Weapon,
  gameOver: boolean,
  score: number,
}

function newGameState(): GameState {
  const makeBay = (size: number): Bay => Array(size).fill().map(() => ({
  	wire: null,
  	isOnline: true,
  }))
  const startingEnemies = _.times(NUM_STARTING_ENEMIES, i => newEnemy(i))
  return {
    bays: Array(NUM_BAYS).fill().map(() => makeBay(PORTS_PER_BAY)),
    enemies: startingEnemies,
    weapon: null,
    gameOver: false,
    score: 0,
  }
}

function activeWeapon(bays: Array<Bay>, combos: $ReadOnlyArray<Combo>): ?Weapon {
  const componentMatches = ([a, b]) => (a === '*') || (b === '*') || (a === b)
  const sequenceMatches = (A, B) => _.zip(_.flatten(A), _.flatten(B)).every(componentMatches)
  const baysToSequence = bays => bays.map(bay => bay.map(({wire}) => wire))
  const activeCombo = combos.find(({sequence}) => sequenceMatches(baysToSequence(bays), sequence))
  return activeCombo ? activeCombo.weapon : null
}

function newEnemy(id: EnemyID): Enemy {
  const randomXPosition: number = _.random(GRID_SIZE)
  const randomEnemyKind: EnemyKind = _.sample(_.values(enemyKinds))
  return {
    id,
    x: randomXPosition,
    y: 0,
    kind: randomEnemyKind,
    isDestroyed: false,
  }
}

function addEnemy(state: GameState): GameState {
  let newState = _.cloneDeep(state)
  const nextEnemyId: EnemyID = _.max(_.map(state.enemies, 'id')) + 1
  newState.enemies = _.concat(state.enemies, newEnemy(nextEnemyId))
  return newState
}

function destroyEnemy(id: EnemyID, state: GameState): GameState {
  let newState = _.cloneDeep(state)
  newState.enemies = state.enemies.map(enemy => {
    if (enemy.id === id) enemy.isDestroyed = true
    return enemy
  })
  return newState
}

// set CORS headers
app.use((req: $Request, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

app.get('/state', (req: $Request, res) => {
	res.json(state)
})

app.get('/connect/wire/:wire/port/:port/bay/:bay', (req: $Request, res) => {
	const wire = Number(req.params.wire)
	const bay = Number(req.params.bay)
	const port = Number(req.params.port)
	console.log(`⭕️  Connected wire ${wire} to port ${port} bay ${bay}`)
	state.bays[bay][port].wire = wire
  state.weapon = activeWeapon(state.bays, combos)
	res.json(state)
})

app.get('/disconnect/port/:port/bay/:bay', (req: $Request, res) => {
	const bay = Number(req.params.bay)
	const port = Number(req.params.port)
	const wire = state.bays[bay][port].wire
	if (wire === null) {
		console.log(`⚠️  WARNING: no wire is plugged in to ${port} bay ${bay}`)
	} else {
		console.log(`❌  Disconnected wire ${String(wire)} from port ${port} bay ${bay}`)
		state.bays[bay][port].wire = null
	}
  state.weapon = activeWeapon(state.bays, combos)
	res.json(state)
})

app.get('/destroy/enemy/:enemyId', (req: $Request, res) => {
  const enemyId = Number(req.params.enemyId)
  console.log(`💥  Destroyed enemy with id ${enemyId}`)
  state = destroyEnemy(enemyId, state)
  res.json(state)
})

const port = process.env.PORT || 9000
app.listen(port, () => {
  console.log(`👾  Serving on port ${port}`)
})

let state = newGameState()
