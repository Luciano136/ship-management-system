const API = "http://localhost:3000";

let portsCache = [];
let shipsCache = [];
let movementsCache = [];

// NAV
function showTab(tab) {

    document.querySelectorAll(".tab")
        .forEach(t => t.classList.remove("active"));

    document.getElementById(tab)
        .classList.add("active");

    document.querySelectorAll("nav button")
        .forEach(b => b.classList.remove("active"));

    document.getElementById(`btn-${tab}`)
        .classList.add("active");
}

// LOAD DATA
async function loadData() {

    const portsRes = await fetch(`${API}/ports`);
    portsCache = await portsRes.json();

    const shipsRes = await fetch(`${API}/ships`);
    shipsCache = await shipsRes.json();

    const movRes = await fetch(`${API}/movements`);
    movementsCache = await movRes.json();

    renderPorts();
    renderShips();
    fillPortSelect();
    fillShipSelect();
    renderHistory();
    showTab("ports");
}

// PORTS
async function createPort() {
    const name = document.getElementById("portName").value;
    if (!name) return;

    await fetch(`${API}/ports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
    });

    document.getElementById("portName").value = "";
    loadData();
}

function renderPorts() {
    const list = document.getElementById("portsList");
    list.innerHTML = "";

    portsCache.forEach(port => {

        const shipsInPort = shipsCache.filter(
            s => s.currentPortId == port.id
        );

        list.innerHTML += `
        <div class="card">
            ⚓ <b>${port.name}</b><br>

            ${
                shipsInPort.length
                ? shipsInPort.map(s => `🚢 ${s.name}`).join("<br>")
                : "<i>No ships</i>"
            }
        </div>
        `;
    });
}

// SHIPS
async function createShip() {
    const name = document.getElementById("shipName").value;
    const currentPortId = document.getElementById("portSelect").value;
    const maxWeight = document.getElementById("shipMaxWeight").value;

    if (!name || !maxWeight) return;

    await fetch(`${API}/ships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, currentPortId, maxWeight })
    });

    document.getElementById("shipName").value = "";
    document.getElementById("shipMaxWeight").value = "";

    loadData();
}

function renderShips() {
    const list = document.getElementById("shipsList");
    list.innerHTML = "";

    shipsCache.forEach(ship => {

        const total = ship.cargo.reduce(
            (a, c) => a + c.weight,
            0
        );

        const available = ship.maxWeight - total;

        const currentPort =
            portsCache.find(
                p => p.id === ship.currentPortId
            );

        const destinationPort =
            portsCache.find(
                p => p.id === ship.destinationPortId
            );

        list.innerHTML += `
        <div class="card">

            🚢 <b>${ship.name}</b><br>

            ⚓ Port:
            ${currentPort?.name || "-"}<br>

            🎯 Destination:
            ${destinationPort?.name || "-"}<br>

            <br>

            ⚖️ Used:
            ${total}/${ship.maxWeight} kg<br>

            📦 Available:
            ${available} kg<br>

            <br>

            ${
                ship.cargo.length
                ? `
                    📦 Cargo:<br>
                    ${ship.cargo
                        .map(c =>
                            `• ${c.name} (${c.weight}kg)`
                        )
                        .join("<br>")
                    }
                `
                : "<i>No cargo loaded</i>"
            }

            <hr>

            <select id="dest-${ship.id}">
                ${
                    portsCache
                        .filter(
                            p => p.id !== ship.currentPortId
                        )
                        .map(
                            p => `
                                <option value="${p.id}">
                                    ${p.name}
                                </option>
                            `
                        )
                        .join("")
                }
            </select>

            <button onclick="setDestination(${ship.id})">
                Set Destination
            </button>

        </div>
        `;
    });
}

// SELECTS
function fillPortSelect() {
    const select = document.getElementById("portSelect");
    select.innerHTML = "";

    portsCache.forEach(p => {
        select.innerHTML += `<option value="${p.id}">${p.name}</option>`;
    });
}

function fillShipSelect() {
    const select = document.getElementById("shipSelect");
    select.innerHTML = "";

    shipsCache.forEach(s => {
        select.innerHTML += `<option value="${s.id}">${s.name}</option>`;
    });
}

// DESTINATION + HISTORY
async function setDestination(shipId) {
    const select = document.getElementById(`dest-${shipId}`);

    const res = await fetch(`${API}/ships/${shipId}/destination`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            destinationPortId: select.value
        })
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.error);
        return;
    }

    loadData();
}

// CARGO
async function addCargo() {
    const shipId = document.getElementById("shipSelect").value;
    const name = document.getElementById("cargoName").value;
    const weight = document.getElementById("cargoWeight").value;

    const res = await fetch(`${API}/ships/${shipId}/cargo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, weight })
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.error);
        return;
    }

    document.getElementById("cargoName").value = "";
    document.getElementById("cargoWeight").value = "";

    loadData();
}

// HISTORY
function renderHistory() {
    const list = document.getElementById("historyList");
    list.innerHTML = "";

    if (movementsCache.length === 0) {
        list.innerHTML = "<p>No movements yet</p>";
        return;
    }

    movementsCache.slice().reverse().forEach(m => {

        const from = portsCache.find(p => p.id == m.fromPortId);
        const to = portsCache.find(p => p.id == m.toPortId);

        const totalWeight = m.cargo.reduce((a, c) => a + c.weight, 0);

        list.innerHTML += `
        <div class="card">

            🚢 <b>${m.shipName}</b><br>

            ⚓ ${from?.name || "?"} → ${to?.name || "?"}<br>
            🕒 ${new Date(m.date).toLocaleString()}<br>

            <hr>

            📦 <b>Cargo manifest:</b><br>

            ${
                m.cargo.length === 0
                ? "<i>No cargo</i>"
                : m.cargo.map(c => `• ${c.name} (${c.weight}kg)`).join("<br>")
            }

            <br>
            ⚖️ Total: ${totalWeight} kg
        </div>
        `;
    });
}

// INIT
loadData();
