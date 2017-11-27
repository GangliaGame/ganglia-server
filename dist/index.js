"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
function newGameState() {
    return {
        weaponLevel: 0,
        isGameWon: false,
        isGameLost: false,
        isGameStarted: false,
        isShieldActive: false,
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
app.get('/shield/on', (req, res) => {
    state.isShieldActive = true;
    console.log(`🛡   shield -> on`);
    res.json(state);
});
app.get('/shield/off', (req, res) => {
    state.isShieldActive = false;
    console.log(`🛡   shield -> off`);
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
    console.log(`☠️   game lost`);
    state.isGameLost = true;
    res.json(state);
});
app.get('/game/won', (req, res) => {
    state.isGameWon = true;
    res.json(state);
});
io.on('connection', socket => {
    console.log('⚡️  a user connected');
    const broadcastEvents = ['move:up', 'move:down', 'move:stop'];
    broadcastEvents.map(event => socket.on(event, () => socket.broadcast.emit(event)));
    socket.on('disconnect', () => {
        console.log('🔌  a user disconnected');
    });
});
const port = process.env.PORT || 9000;
server.listen(port, () => {
    console.log(`👾  Serving on port ${port}`);
});
let state = newGameState();
//# sourceMappingURL=index.js.map