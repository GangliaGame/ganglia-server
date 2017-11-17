"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import * as _ from 'lodash'
const express = require("express");
const app = express();
function newGameState() {
    return {
        weaponLevel: 0,
        isGameWon: false,
        isGameLost: false,
        isGameStarted: false
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
app.get('/weapon/set/:weaponLevel', (req, res) => {
    const prevWeaponLevel = state.weaponLevel;
    state.weaponLevel = Number(req.params.weaponLevel);
    console.log(`🔫   weapon level ${prevWeaponLevel} -> ${state.weaponLevel}`);
    res.json(state);
});
app.get('/game/new', (req, res) => {
    state = newGameState();
    res.json(state);
});
app.get('/game/start', (req, res) => {
    state.isGameStarted = true;
    res.json(state);
});
app.get('/game/lost', (req, res) => {
    state.isGameLost = true;
    res.json(state);
});
app.get('/game/won', (req, res) => {
    state.isGameWon = true;
    res.json(state);
});
const port = process.env.PORT || 9000;
app.listen(port, () => {
    console.log(`👾  Serving on port ${port}`);
});
let state = newGameState();
//# sourceMappingURL=index.js.map