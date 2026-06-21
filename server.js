const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static("public"));

// DATA
let ports = [];
let ships = [];
let movements = [];

let nextPortId = 1;
let nextShipId = 1;
let nextMovementId = 1;

// PORTS
app.post("/ports", (req, res) => {
    const name = req.body.name;
    if (!name) return res.status(400).json({ error: "name required" });

    const port = {
        id: nextPortId++,
        name
    };

    ports.push(port);
    res.json(port);
});

app.get("/ports", (req, res) => {
    res.json(ports);
});

// SHIPS
app.post("/ships", (req, res) => {
    const ship = {
        id: nextShipId++,
        name: req.body.name,
        currentPortId: Number(req.body.currentPortId),
        destinationPortId: null,
        maxWeight: Number(req.body.maxWeight),
        cargo: []
    };

    ships.push(ship);
    res.json(ship);
});

app.get("/ships", (req, res) => {
    res.json(ships);
});

// DESTINATION + MOVEMENT HISTORY
app.post("/ships/:id/destination", (req, res) => {
    const ship = ships.find(s => s.id === Number(req.params.id));

    if (!ship) {
        return res.status(404).json({ error: "Ship not found" });
    }

    const toPortId = Number(req.body.destinationPortId);

    if (ship.currentPortId === toPortId) {
        return res.status(400).json({
            error: "Destination port must be different from current port"
        });
    }

    const fromPortId = ship.currentPortId;

    // Create cargo snapshot for trip manifest
    const cargoSnapshot = ship.cargo.map(c => ({ ...c }));

    // Save movement history
    movements.push({
        id: nextMovementId++,
        shipId: ship.id,
        shipName: ship.name,
        fromPortId,
        toPortId,
        cargo: cargoSnapshot,
        date: new Date().toISOString()
    });

    // update ship status
    ship.currentPortId = toPortId;
    ship.destinationPortId = null;

    // reset cargo
    ship.cargo = [];

    res.json(ship);
});

// MOVEMENTS
app.get("/movements", (req, res) => {
    res.json(movements);
});

// CARGO
app.post("/ships/:id/cargo", (req, res) => {
    const ship = ships.find(s => s.id === Number(req.params.id));

    if (!ship) {
        return res.status(404).json({ error: "Ship not found" });
    }

    const cargoItem = {
        id: Date.now(),
        name: req.body.name,
        weight: Number(req.body.weight)
    };

    const total = ship.cargo.reduce((a, c) => a + c.weight, 0);

    if (total + cargoItem.weight > ship.maxWeight) {
        return res.status(400).json({ error: "Over weight limit" });
    }

    ship.cargo.push(cargoItem);

    res.json(ship);
});

// =====================
app.listen(3000, () => {
    console.log("🚢 Server running on http://localhost:3000");
});
