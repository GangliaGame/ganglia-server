"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import * as _ from 'lodash'
const express = require("express");
const app = express();
var Color;
(function (Color) {
    Color[Color["red"] = 1] = "red";
    Color[Color["orange"] = 2] = "orange";
    Color[Color["yellow"] = 3] = "yellow";
    Color[Color["green"] = 4] = "green";
    Color[Color["blue"] = 5] = "blue";
    Color[Color["purple"] = 6] = "purple";
})(Color || (Color = {}));
const weapons = [
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
];
// function weaponOfColorName(name: keyof typeof Color): Weapon | undefined {
//   return weapons.find(weapon => weapon.color === Color[name])
// }
function weaponOfColor(color) {
    return weapons.find(weapon => weapon.color === color);
}
function newGameState() {
    return {
        weapon: null,
        gameOver: false,
        gameWon: false,
        gameStarted: false,
        gameStartTime: Date.now(),
    };
}
// set CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
app.get('/state', (req, res) => {
    res.json(state);
});
app.get('/weapon/disable', (req, res) => {
    state.weapon = null;
    res.json(state);
});
app.get('/weapon/enable/:colorName', (req, res) => {
    const colorName = req.params.colorName;
    state.weapon = weaponOfColor(Color[colorName]) || state.weapon;
    res.json(state);
});
app.get('/newGame', (req, res) => {
    state = newGameState();
    res.json(state);
});
const port = process.env.PORT || 9000;
app.listen(port, () => {
    console.log(`👾  Serving on port ${port}`);
});
let state = newGameState();
//# sourceMappingURL=index.js.map