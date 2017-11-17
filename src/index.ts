// import * as _ from 'lodash'
import * as express from 'express'
const app = express()

type WeaponId = number
type EnergyId = number

type GameState = {
  weaponId: WeaponId | null
  energyId: EnergyId | null
  isGameWon: boolean
  isGameLost: boolean
  isGameStarted: boolean
}

function newGameState(): GameState {
  return {
    weaponId: null,
    energyId: null,
    isGameWon: false,
    isGameLost: false,
    isGameStarted: false
  }
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

app.get('/weapon/disable', (req, res) => {
  state.weaponId = null
  res.json(state)
})

app.get('/weapon/enable/:weaponId', (req, res) => {
  state.weaponId = Number(req.params.weaponId)
  res.json(state)
})

app.get('/energy/:energyId', (req, res) => {
  state.energyId = Number(req.params.energyId)
  res.json(state)
})

app.get('/game/new', (req, res) => {
  state = newGameState()
  res.json(state)
})

app.get('/game/start', (req, res) => {
  state.isGameStarted = true
  res.json(state)
})

app.get('/game/lost', (req, res) => {
  state.isGameLost = true
  res.json(state)
})

app.get('/game/won', (req, res) => {
  state.isGameWon = true
  res.json(state)
})

const port = process.env.PORT || 9000
app.listen(port, () => {
  console.log(`👾  Serving on port ${port}`)
})

let state = newGameState()
