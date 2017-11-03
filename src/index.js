//@flow
import _ from 'lodash'
import type { $Request } from 'express';
import express from 'express'
const app = express()

const NUM_BAYS = 2
const PORTS_PER_BAY = 4 // also change SequenceComponent type

const weapons = {
  Phasers: 'Phasers',
  PulseBomb: 'Pulse Bomb',
  DisruptorBeam: 'Disruptor Beam',
}

const combos: $ReadOnlyArray<Combo> = [
  {
    name: 'REBOOT',
    sequence: [[0,1,null,null],[0,1,null,null]],
  },
  {
    name: weapons.DisruptorBeam,
    sequence: [[0,'*','*',3],['*','*','*','*']],
  },
  {
    name: weapons.PulseBomb,
    sequence: [[null,null,1,3],['*','*','*','*']],
  },
  {
    name: weapons.Phasers,
    sequence: [[3,2,null,null],['*','*','*','*']],
  },
]

type Weapon = $Keys<typeof weapons>

type ID = number

type Enemy = {
  x: number,
  y: number,
  kind: 'green' | 'orange' | 'purple',
  id: ID,
}

type Port = {
  wire: ?number,
  isOnline: boolean,
}

type Bay = Array<Port>

type SequenceComponent = 0 | 1 | 2 | 3 | '*' | null

type Sequence = Array<Array<SequenceComponent>>

type Combo = {
  name: string,
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
  return {
    bays: Array(NUM_BAYS).fill().map(() => makeBay(PORTS_PER_BAY)),
    enemies: [],
    weapon: null,
    gameOver: false,
    score: 0,
  }
}

function activeCombos(bays: Array<Bay>, combos: Array<Combo>) {
  const componentMatches = ([a, b]) => (a === '*') || (b === '*') || (a === b)
  const sequenceMatches = (A, B) => _.zip(_.flatten(A), _.flatten(B)).every(componentMatches)
  const baysToSequence = bays => bays.map(bay => bay.map(({wire}) => wire))

  return combos
  .filter(({sequence}) => sequenceMatches(baysToSequence(bays), sequence))
  .map(({name}) => name)
}

const destroyEnemy = (id: ID, state: GameState): GameState => {
  let newState = _.cloneDeep(state)
  newState.enemies = state.enemies.filter(enemy => enemy.id !== id)
  return newState
}

// set CORS headers
app.use((req: $Request, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

app.get('/connect/wire/:wire/port/:port/bay/:bay', (req: $Request, res) => {
	const wire = Number(req.params.wire)
	const bay = Number(req.params.bay)
	const port = Number(req.params.port)
	console.log(`connected wire ${wire} to port ${port} bay ${bay}`)
	state.bays[bay][port].wire = wire
	res.json(state)
})

app.get('/disconnect/port/:port/bay/:bay', (req: $Request, res) => {
	const bay = Number(req.params.bay)
	const port = Number(req.params.port)
	const wire = state.bays[bay][port].wire
	if (wire === null) {
		console.log(`WARNING: no wire is plugged in to ${port} bay ${bay}`)
	} else {
		console.log(`disconnected wire ${String(wire)} from port ${port} bay ${bay}`)
		state.bays[bay][port].wire = null
	}
	res.json(state)
})

app.get('/state', (req: $Request, res) => {
	res.json(state)
})

app.get('/destroy/enemy/:enemyId', (req: $Request, res) => {
  const enemyId = Number(req.params.enemyId)
  console.log(`destroyed enemy with id ${enemyId}`)
  state = destroyEnemy(enemyId, state)
  res.json(state)
})

const port = process.env.PORT || 9000
app.listen(port, () => {
  console.log(`Serving on port ${port} 👾`)
})

let state = newGameState()
