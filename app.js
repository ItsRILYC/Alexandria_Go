// Globale data (kan later vervangen worden door een IndexedDB- of uitgebreidere opslag)
let roster = [];  // Array van speler objecten { id, name }
let currentTraining = { date: new Date().toISOString().split('T')[0], records: {} }; 
// records: { playerId: true (absent) / false (present) }
let seasons = []; // Array met seizoenen

// Initialisatie: laad data uit localStorage (indien aanwezig)
function loadData() {
  roster = JSON.parse(localStorage.getItem('roster')) || generateDefaultRoster();
  seasons = JSON.parse(localStorage.getItem('seasons')) || [];
}

function saveData() {
  localStorage.setItem('roster', JSON.stringify(roster));
  localStorage.setItem('seasons', JSON.stringify(seasons));
}

// Genereer een standaard rooster met 21 spelers
function generateDefaultRoster() {
  let defaultRoster = [];
  for (let i = 1; i <= 21; i++) {
    defaultRoster.push({ id: i, name: 'Speler ' + i });
  }
  return defaultRoster;
}

// UI-updates voor de trainingsdag
function renderTraining() {
  document.getElementById('training-date').textContent = currentTraining.date;
  const presentList = document.getElementById('present-list');
  const absentList = document.getElementById('absent-list');
  presentList.innerHTML = '';
  absentList.innerHTML = '';
  
  // Sorteer op id
  roster.forEach(player => {
    const li = document.createElement('li');
    li.textContent = player.id + '. ' + player.name;
    // Checkbox: standaard aan (aanwezig). Bij checken verplaats naar afwezig.
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = currentTraining.records[player.id] || false;
    checkbox.addEventListener('change', () => {
      currentTraining.records[player.id] = checkbox.checked;
      renderTraining();
      updateLiveStats();
    });
    li.prepend(checkbox);
    
    if (checkbox.checked) {
      absentList.appendChild(li);
    } else {
      presentList.appendChild(li);
    }
  });
}

// Bereken en update de live statistieken
function updateLiveStats() {
  let total = roster.length;
  let absentCount = Object.values(currentTraining.records).filter(val => val).length;
  let presentCount = total - absentCount;
  document.getElementById('live-present-perc').textContent = ((presentCount / total) * 100).toFixed(1);
  document.getElementById('live-absent-perc').textContent = ((absentCount / total) * 100).toFixed(1);
}

// Opslaan van de trainingsdag (definitief vastzetten)
document.getElementById('btn-save-training').addEventListener('click', () => {
  // Voeg de huidige trainingsdag toe aan een lopend seizoen of start een nieuw seizoen als gewenst
  let season = getCurrentSeason();
  if (!season) {
    // Nieuwe seizoen starten: vraag om startdatum
    let startDate = prompt('Voer startdatum van het seizoen in (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    season = { startDate, trainingDays: [] };
    seasons.push(season);
  }
  season.trainingDays.push({ date: currentTraining.date, records: { ...currentTraining.records } });
  // Reset de trainingsdag voor de volgende keer
  currentTraining = { date: new Date().toISOString().split('T')[0], records: {} };
  saveData();
  renderTraining();
  updateLiveStats();
  alert('Trainingsdag opgeslagen!');
});

// Haal het huidige (lopende) seizoen op (laatste in de array)
function getCurrentSeason() {
  if (seasons.length === 0) return null;
  return seasons[seasons.length - 1];
}

// Roster beheer UI
function renderRoster() {
  const rosterList = document.getElementById('roster-list');
  rosterList.innerHTML = '';
  roster.forEach(player => {
    const li = document.createElement('li');
    li.textContent = player.id + '. ' + player.name;
    
    // Bewerken knop
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Bewerk';
    editBtn.addEventListener('click', () => {
      let newName = prompt('Nieuwe naam voor ' + player.name + ':', player.name);
      if (newName) {
        player.name = newName;
        saveData();
        renderRoster();
        renderTraining();
      }
    });
    li.appendChild(editBtn);
    
    // Verwijder knop
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Verwijder';
    deleteBtn.addEventListener('click', () => {
      if (confirm('Weet je zeker dat je ' + player.name + ' wilt verwijderen?')) {
        roster = roster.filter(p => p.id !== player.id);
        saveData();
        renderRoster();
        renderTraining();
      }
    });
    li.appendChild(deleteBtn);
    
    rosterList.appendChild(li);
  });
}

// Toevoegen van een speler
document.getElementById('player-form').addEventListener('submit', e => {
  e.preventDefault();
  const nameInput = document.getElementById('player-name');
  const name = nameInput.value.trim();
  if (name !== '') {
    // Bepaal een nieuwe unieke id (max id + 1)
    const newId = roster.length > 0 ? Math.max(...roster.map(p => p.id)) + 1 : 1;
    roster.push({ id: newId, name });
    nameInput.value = '';
    saveData();
    renderRoster();
    renderTraining();
  }
});

// Navigatie tussen secties
document.getElementById('btn-training').addEventListener('click', () => {
  showSection('training-section');
});
document.getElementById('btn-roster').addEventListener('click', () => {
  showSection('roster-section');
  renderRoster();
});
document.getElementById('btn-history').addEventListener('click', () => {
  showSection('history-section');
  renderHistory();
});
document.getElementById('btn-back-history').addEventListener('click', () => {
  showSection('history-section');
});

function showSection(sectionId) {
  ['training-section', 'roster-section', 'history-section', 'season-detail-section'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
  document.getElementById(sectionId).classList.remove('hidden');
}

// Geschiedenis renderen
function renderHistory() {
  const seasonList = document.getElementById('season-list');
  seasonList.innerHTML = '';
  seasons.forEach((season, index) => {
    const li = document.createElement('li');
    li.textContent = `Seizoen van ${season.startDate} tot ${season.endDate || 'heden'} – Trainingsdagen: ${season.trainingDays.length}`;
    // Klik om details te bekijken
    li.addEventListener('click', () => {
      renderSeasonDetail(index);
    });
    seasonList.appendChild(li);
  });
}

// Seizoen detail weergeven met statistieken
function renderSeasonDetail(seasonIndex) {
  const season = seasons[seasonIndex];
  const seasonInfo = document.getElementById('season-info');
  seasonInfo.innerHTML = `<p>Startdatum: ${season.startDate}</p>
                          <p>Einddatum: ${season.endDate || 'Heden'}</p>
                          <p>Aantal trainingsdagen: ${season.trainingDays.length}</p>`;
  
  // Bereken totaal percentages over het seizoen
  let totalPlayers = roster.length;
  let totalAbsentDays = 0;
  season.trainingDays.forEach(day => {
    totalAbsentDays += Object.values(day.records).filter(val => val).length;
  });
  let totalChecks = season.trainingDays.length * totalPlayers;
  let overallAbsentPerc = ((totalAbsentDays / totalChecks) * 100).toFixed(1);
  let overallPresentPerc = (100 - overallAbsentPerc).toFixed(1);
  
  seasonInfo.innerHTML += `<p>Algemeen Aanwezig: ${overallPresentPerc}%</p>
                           <p>Algemeen Afwezig: ${overallAbsentPerc}%</p>`;
  
  // Per speler statistiek (optioneel, per jouw specificatie)
  let perPlayerStats = '<h3>Per Speler Statistieken:</h3><ul>';
  roster.forEach(player => {
    let absentCount = 0;
    season.trainingDays.forEach(day => {
      if (day.records[player.id]) absentCount++;
    });
    let perc = ((absentCount / season.trainingDays.length) * 100).toFixed(1);
    perPlayerStats += `<li>${player.id}. ${player.name}: Afwezig ${perc}%</li>`;
  });
  perPlayerStats += '</ul>';
  seasonInfo.innerHTML += perPlayerStats;
  
  // Toon detailsectie
  showSection('season-detail-section');
  
  // Zet export knop actie
  document.getElementById('btn-export-pdf').onclick = () => exportSeasonToPDF(season);
}

// PDF exporteren met jsPDF
function exportSeasonToPDF(season) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Seizoen Overzicht", 10, 20);
  doc.setFontSize(12);
  doc.text(`Startdatum: ${season.startDate}`, 10, 30);
  doc.text(`Einddatum: ${season.endDate || 'Heden'}`, 10, 40);
  doc.text(`Aantal trainingsdagen: ${season.trainingDays.length}`, 10, 50);
  
  // Algemene percentages (zelfde berekening als eerder)
  let totalPlayers = roster.length;
  let totalAbsentDays = 0;
  season.trainingDays.forEach(day => {
    totalAbsentDays += Object.values(day.records).filter(val => val).length;
  });
  let totalChecks = season.trainingDays.length * totalPlayers;
  let overallAbsentPerc = ((totalAbsentDays / totalChecks) * 100).toFixed(1);
  let overallPresentPerc = (100 - overallAbsentPerc).toFixed(1);
  doc.text(`Algemeen Aanwezig: ${overallPresentPerc}%`, 10, 60);
  doc.text(`Algemeen Afwezig: ${overallAbsentPerc}%`, 10, 70);
  
  // Per speler statistieken (optioneel)
  let yPos = 80;
  doc.text("Per Speler Statistieken:", 10, yPos);
  yPos += 10;
  roster.forEach(player => {
    let absentCount = 0;
    season.trainingDays.forEach(day => {
      if (day.records[player.id]) absentCount++;
    });
    let perc = ((absentCount / season.trainingDays.length) * 100).toFixed(1);
    doc.text(`${player.id}. ${player.name}: Afwezig ${perc}%`, 10, yPos);
    yPos += 10;
  });
  
  doc.save(`Seizoen_${season.startDate}_tot_${season.endDate || 'Heden'}.pdf`);
}

// Initialisatie
loadData();
renderTraining();
updateLiveStats();
showSection('training-section');
