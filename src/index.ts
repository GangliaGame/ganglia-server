// import * as _ from 'lodash'
import * as express from 'express'
const app = express()

type timestamp = number

enum Color {
  red = 1,
  orange,
  yellow,
  green,
  blue,
  purple
}

type Weapon = {
  name: string
  color: Color,
}

const weapons: Array<Weapon> = [
  {
    name: 'Xanar Shells',
    color: Color.red,
  },
  {
    name: 'Plasma Field',
    color: Color.green,
  },
  {
    name: 'High-Energy Pulse Laser',
    color: Color.blue,
  },
  {
    name: 'Neutrino Torpedos',
    color: Color.yellow,
  },
]

// function weaponOfColorName(name: keyof typeof Color): Weapon | undefined {
//   return weapons.find(weapon => weapon.color === Color[name])
// }

function weaponOfColor(color: Color): Weapon | undefined {
  return weapons.find(weapon => weapon.color === color)
}

type GameState = {
  weapon: Weapon | null,
  gameOver: boolean,
  gameWon: boolean,
  gameStarted: boolean,
  gameStartTime?: timestamp,
}

function newGameState(): GameState {
  return {
    weapon: null,
    gameOver: false,
    gameWon: false,
    gameStarted: false,
    gameStartTime: Date.now(),
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
  state.weapon = null
  res.json(state)
})

app.get('/weapon/enable/:colorName', (req, res) => {
  const colorName: keyof typeof Color = req.params.colorName
  state.weapon = weaponOfColor(Color[colorName]) || state.weapon
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
