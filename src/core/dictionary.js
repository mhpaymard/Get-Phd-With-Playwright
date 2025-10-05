// Token dictionary loader / resolver (placeholder in-memory version)
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../../data/token-dictionary.json');

let state = { version: 1, disciplines: {}, subjects: {}, geos: {}, funding: {}, institutions: {}, phdTypes: {}, studyModes: {} };

function load() {
  if (fs.existsSync(FILE)) {
    try { state = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { /* ignore */ }
  }
  return state;
}

function save() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(state, null, 2));
}

function resolveDiscipline(idOrToken) {
  // Accept token directly
  if (state.disciplines[idOrToken]) return state.disciplines[idOrToken];
  // Linear scan tokens
  return Object.values(state.disciplines).find(d => d.id === idOrToken || d.token === idOrToken);
}

function addOrUpdate(entry) {
  if (!entry || !entry.token || !entry.type) return;
  const mapName = {
    discipline: 'disciplines',
    subject: 'subjects',
    geo: 'geos',
    funding: 'funding',
    institution: 'institutions',
    phdType: 'phdTypes',
    studyMode: 'studyModes'
  }[entry.type];
  if (!mapName) return;
  state[mapName][entry.token] = entry;
}

function findByToken(token) {
  for (const k of ['disciplines','subjects','geos','funding','institutions','phdTypes','studyModes']) {
    if (state[k][token]) return state[k][token];
  }
  return null;
}

module.exports = { load, save, resolveDiscipline, addOrUpdate, findByToken, getState: () => state };
