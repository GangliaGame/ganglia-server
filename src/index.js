//@flow
import _ from 'lodash'
import type { $Request } from 'express';
import express from 'express'
const app = express()

const port = process.env.PORT || 9000

type Sequence = Array<Array<'*' | number | null>>

type Port = {
  wire: ?number,
  isOnline: boolean,
}

type Bay = Array<Port>

type Combo = {
  name: string,
  sequence: Sequence,
}

app.use(function(req: $Request, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
})

const NUM_BAYS = 2
const PORTS_PER_BAY = 4

const makeBay = (size : number): Bay => Array(size).fill().map((_, i): Port => ({
	wire: null,
	isOnline: true,
}))

let bays: Array<Bay> = Array(NUM_BAYS).fill().map(() => makeBay(4))

// null => no wire present
// undefined => wildcard
// n => wire n
let combos: Array<Combo> = [
  {
    name: 'REBOOT',
    sequence: [[0,1,null,null],[0,1,null,null]],
  },
  {
    name: 'BOOST_SHIELDS',
    sequence: [['*','*',2,3],['*','*','*','*']],
  },
  {
    name: 'BOOST_SHIELDS',
    sequence: [['*','*','*','*'],['*','*',2,3]],
  },
  {
    name: 'BAY_0_EMPTY',
    sequence: [[null,null,null,null],['*','*','*','*']],
  },
  {
    name: 'PHASERS',
    sequence: [[0,1,2,'*'],['*','*','*','*']],
  },
]

const componentMatches = ([a, b]) => (a === '*') || (b === '*') || (a === b)
const sequenceMatches = (A, B) => _.zip(_.flatten(A), _.flatten(B)).every(componentMatches)
const baysToSequence = bays => bays.map(bay => bay.map(({wire}) => wire))
const getCombos = (bays, combos) =>
  combos
  .filter(({sequence}) => sequenceMatches(baysToSequence(bays), sequence))
  .map(({name}) => name)

const serializeState = (bays, combos) => ({ bays, combos: getCombos(bays, combos) })
const sendStateAsJson = res => res.json(serializeState(bays, combos))

app.get('/connect/wire/:wire/port/:port/bay/:bay', (req: $Request, res) => {
	const wire = Number(req.params.wire)
	const bay = Number(req.params.bay)
	const port = Number(req.params.port)
	console.log(`connected wire ${wire} to port ${port} bay ${bay}`)
	bays[bay][port].wire = wire
	sendStateAsJson(res)
})

app.get('/disconnect/port/:port/bay/:bay', (req: $Request, res) => {
	const bay = Number(req.params.bay)
	const port = Number(req.params.port)
	const wire = bays[bay][port].wire
	if (wire === null) {
		console.log(`WARNING: no wire is plugged in to ${port} bay ${bay}`)
	} else {
		console.log(`disconnected wire ${String(wire)} from port ${port} bay ${bay}`)
		bays[bay][port].wire = null
	}
	sendStateAsJson(res)
})

app.get('/state', (req: $Request, res) => {
	sendStateAsJson(res)
})

app.listen(port, function () {
  console.log(`Serving on port ${port} 🙃`)
})
