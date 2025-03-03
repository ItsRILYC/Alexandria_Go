'use strict';

let roster = []; // Array van spelers: { id, name }
let currentTraining = { date: new Date().toISOString().split('T')[0], records: {} };
let seasons = [];
let currentSeason = null; // Actief seizoen

// Laad data uit localStorage
const loadData = () => {
  roster = JSON.parse(localStorage.getItem('roster')) || generateDefaultRoster();
  seasons = JSON.parse(localStorage.getItem('seasons')) || [];
  currentSeason = seasons.length ? seasons[seasons.length - 1] : null;
};

// Sla data op in localStorage
const saveData = () => {
  localStorage.setItem('roster', JSON.stringify(roster));
  localStorage.setItem('seasons', JSON.stringify(seasons));
};

// Genereer standaard rooster van 21 spelers
const generateDefaultRoster = () => (
  Array.from({ length: 21 }, (_, i) => ({ id: i + 1, name: `Speler ${i + 1}` }))
);

// Render de trainingsdag
const renderTraining = () => {
  document.getElementById('training-date').textContent = currentTraining.date;
  const presentList = document.getElementById('present-list');
  const absentList = document.getElementById('absent-list');
  presentList.innerHTML = '';
  absentList.innerHTML = '';

  roster.forEach(player => {
    const li = document.createElement('li');
    li.textContent = `${player.id}. ${player.name}`;
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!currentTraining.records[player.id];
    checkbox.addEventListener('change', () => {
      currentTraining.records[player.id] = checkbox.checked;
      // Tussentijds opslaan (optioneel)
      localStorage.setItem('currentTraining', JSON.stringify(currentTraining));
      updateLiveStats();
      renderTraining();
    });
    li.prepend(checkbox);
    (checkbox.checked ? absentList : presentList).appendChild(li);
  });
};

// Update de live statistieken
const updateLiveStats = () => {
  const total = roster.length;
  const absentCount = Object.values(currentTraining.records).filter(Boolean).length;
  const presentCount = total - absentCount;
  document.getElementById('live-present-perc').textContent = ((presentCount / total) * 100).toFixed(1);
  document.getElementById('live-absent-perc').textContent = ((absentCount / total) * 100).toFixed(1);
};

// Start een nieuw seizoen
const startNewSeason = () => {
  const startDate = prompt('Voer de startdatum van het seizoen in (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
  if (startDate) {
    currentSeason = { startDate, trainingDays: [] };
    seasons.push(currentSeason);
    saveData();
  }
};

// Opslaan van de trainingsdag en toevoegen aan het actieve seizoen
document.getElementById('btn-save-training').addEventListener('click', () => {
  if (!currentSeason) startNewSeason();
  currentSeason.trainingDays.push({ date: currentTraining.date, records: { ...currentTraining.records } });
  currentTraining = { date: new Date().toISOString().split('T')[0], records: {} };
  saveData();
  renderTraining();
  updateLiveStats();
  alert('Trainingsdag opgeslagen en toegevoegd aan het huidige seizoen!');
});

// Roster beheer
const renderRoster = () => {
  const rosterList = document.getElementById('roster-list');
  rosterList.innerHTML = '';
  roster.forEach(player => {
    const li = document.createElement('li');
    li.textContent = `${player.id}. ${player.name}`;

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Bewerk';
    editBtn.addEventListener('click', () => {
      const newName = prompt(`Nieuwe naam voor ${player.name}:`, player.name);
      if (newName) {
        player.name = newName;
        saveData();
        renderRoster();
        renderTraining();
      }
    });
    li.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Verwijder';
    deleteBtn.addEventListener('click', () => {
      if (confirm(`Weet je zeker dat je ${player.name} wilt verwijderen?`)) {
        roster = roster.filter(p => p.id !== player.id);
        saveData();
        renderRoster();
        renderTraining();
      }
    });
    li.appendChild(deleteBtn);

    rosterList.appendChild(li);
  });
};

document.getElementById('player-form').addEventListener('submit', e => {
  e.preventDefault();
  const nameInput = document.getElementById('player-name');
  const name = nameInput.value.trim();
  if (name) {
    const newId = roster.length ? Math.max(...roster.map(p => p.id)) + 1 : 1;
    roster.push({ id: newId, name });
    nameInput.value = '';
    saveData();
    renderRoster();
    renderTraining();
  }
});

// Navigatie tussen secties
const showSection = sectionId => {
  ['training-section', 'roster-section', 'history-section', 'season-detail-section']
    .forEach(id => document.getElementById(id).classList.add('hidden'));
  document.getElementById(sectionId).classList.remove('hidden');
};

document.getElementById('btn-training').addEventListener('click', () => showSection('training-section'));
document.getElementById('btn-roster').addEventListener('click', () => {
  showSection('roster-section');
  renderRoster();
});
document.getElementById('btn-history').addEventListener('click', () => {
  showSection('history-section');
  renderHistory();
});
document.getElementById('btn-back-history').addEventListener('click', () => showSection('history-section'));

// Render de geschiedenis van seizoenen
const renderHistory = () => {
  const seasonList = document.getElementById('season-list');
  seasonList.innerHTML = '';
  seasons.forEach((season, index) => {
    const li = document.createElement('li');
    li.textContent = `Seizoen van ${season.startDate} tot ${season.endDate || 'heden'} – Trainingsdagen: ${season.trainingDays.length}`;
    li.addEventListener('click', () => renderSeasonDetail(index));
    seasonList.appendChild(li);
  });
};

// Render detail van een specifiek seizoen
const renderSeasonDetail = seasonIndex => {
  const season = seasons[seasonIndex];
  const seasonInfo = document.getElementById('season-info');
  seasonInfo.innerHTML = `
    <p>Startdatum: ${season.startDate}</p>
    <p>Einddatum: ${season.endDate || 'Heden'}</p>
    <p>Aantal trainingsdagen: ${season.trainingDays.length}</p>
  `;
  
  const totalPlayers = roster.length;
  const totalAbsentDays = season.trainingDays.reduce((sum, day) => sum + Object.values(day.records).filter(Boolean).length, 0);
  const totalChecks = season.trainingDays.length * totalPlayers;
  const overallAbsentPerc = ((totalAbsentDays / totalChecks) * 100).toFixed(1);
  const overallPresentPerc = (100 - overallAbsentPerc).toFixed(1);
  
  seasonInfo.innerHTML += `
    <p>Algemeen Aanwezig: ${overallPresentPerc}%</p>
    <p>Algemeen Afwezig: ${overallAbsentPerc}%</p>
    <h3>Per Speler Statistieken:</h3>
    <ul>
      ${roster.map(player => {
        const absentCount = season.trainingDays.reduce((count, day) => count + (day.records[player.id] ? 1 : 0), 0);
        const perc = ((absentCount / season.trainingDays.length) * 100).toFixed(1);
        return `<li>${player.id}. ${player.name}: Afwezig ${perc}%</li>`;
      }).join('')}
    </ul>
  `;
  
  showSection('season-detail-section');
  document.getElementById('btn-export-pdf').onclick = () => exportSeasonToPDF(season);
};

// Exporteer seizoen naar PDF met jsPDF
const exportSeasonToPDF = season => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Seizoen Overzicht", 10, 20);
  doc.setFontSize(12);
  doc.text(`Startdatum: ${season.startDate}`, 10, 30);
  doc.text(`Einddatum: ${season.endDate || 'Heden'}`, 10, 40);
  doc.text(`Aantal trainingsdagen: ${season.trainingDays.length}`, 10, 50);
  
  const totalPlayers = roster.length;
  const totalAbsentDays = season.trainingDays.reduce((sum, day) => sum + Object.values(day.records).filter(Boolean).length, 0);
  const totalChecks = season.trainingDays.length * totalPlayers;
  const overallAbsentPerc = ((totalAbsentDays / totalChecks) * 100).toFixed(1);
  const overallPresentPerc = (100 - overallAbsentPerc).toFixed(1);
  doc.text(`Algemeen Aanwezig: ${overallPresentPerc}%`, 10, 60);
  doc.text(`Algemeen Afwezig: ${overallAbsentPerc}%`, 10, 70);
  
  let yPos = 80;
  doc.text("Per Speler Statistieken:", 10, yPos);
  yPos += 10;
  roster.forEach(player => {
    const absentCount = season.trainingDays.reduce((count, day) => count + (day.records[player.id] ? 1 : 0), 0);
    const perc = ((absentCount / season.trainingDays.length) * 100).toFixed(1);
    doc.text(`${player.id}. ${player.name}: Afwezig ${perc}%`, 10, yPos);
    yPos += 10;
  });
  
  doc.save(`Seizoen_${season.startDate}_tot_${season.endDate || 'Heden'}.pdf`);
};

loadData();
renderTraining();
updateLiveStats();
showSection('training-section');
