'use strict';

let roster = []; // Array van spelers: { id, name }
let currentTraining = { date: new Date().toISOString().split('T')[0], records: {} };
let seasons = [];
let currentSeason = null; // Actief seizoen

// Laad data uit localStorage en herstel trainingsdata als datum klopt
const loadData = () => {
  roster = JSON.parse(localStorage.getItem('roster')) || generateDefaultRoster();
  seasons = JSON.parse(localStorage.getItem('seasons')) || [];
  currentSeason = seasons.length ? seasons[seasons.length - 1] : null;

  const savedTraining = JSON.parse(localStorage.getItem('currentTraining'));
  const today = new Date().toISOString().split('T')[0];
  if (savedTraining && savedTraining.date === today) {
    currentTraining = savedTraining;
  } else {
    currentTraining = { date: today, records: {} };
    localStorage.removeItem('currentTraining');
  }
};

// Sla data op in localStorage
const saveData = () => {
  localStorage.setItem('roster', JSON.stringify(roster));
  localStorage.setItem('seasons', JSON.stringify(seasons));
  localStorage.setItem('currentTraining', JSON.stringify(currentTraining));
};

// Genereer standaard rooster van 21 spelers
const generateDefaultRoster = () =>
  Array.from({ length: 21 }, (_, i) => ({ id: i + 1, name: `Speler ${i + 1}` }));

// Render trainingsdag en update de tussentijds opgeslagen status
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
      saveData(); // Direct opslaan na elke wijziging
      updateLiveStats();
      renderTraining();
    });
    li.prepend(checkbox);
    (checkbox.checked ? absentList : presentList).appendChild(li);
  });
};

// Update live statistieken (zowel aantal als percentage)
const updateLiveStats = () => {
  const total = roster.length;
  const absentCount = Object.values(currentTraining.records).filter(Boolean).length;
  const presentCount = total - absentCount;
  const presentPerc = total ? ((presentCount / total) * 100).toFixed(1) : 0;
  const absentPerc = total ? ((absentCount / total) * 100).toFixed(1) : 0;
  document.getElementById('live-present').textContent = `Aanwezig: ${presentCount} / ${total} (${presentPerc}%)`;
  document.getElementById('live-absent').textContent = `Afwezig: ${absentCount} / ${total} (${absentPerc}%)`;
};

// Start een nieuw seizoen: vraag om begin- en einddatum
const startNewSeason = () => {
  const today = new Date().toISOString().split('T')[0];
  const startDate = prompt('Voer de startdatum van het seizoen in (YYYY-MM-DD):', today);
  const endDate = prompt('Voer de einddatum van het seizoen in (YYYY-MM-DD):', today);
  if (startDate && endDate && startDate <= endDate) {
    currentSeason = { startDate, endDate, trainingDays: [] };
    seasons.push(currentSeason);
    saveData();
  } else {
    alert('Ongeldige datums. Probeer het opnieuw.');
    startNewSeason();
  }
};

// Controleer of de trainingsdag binnen het actieve seizoen valt
const isTrainingInCurrentSeason = () => {
  if (!currentSeason) return false;
  return currentTraining.date >= currentSeason.startDate && currentTraining.date <= currentSeason.endDate;
};

// Opslaan van de trainingsdag en koppelen aan het actieve seizoen
document.getElementById('btn-save-training').addEventListener('click', () => {
  if (!currentSeason || !isTrainingInCurrentSeason()) {
    alert('De huidige trainingsdag valt buiten het actieve seizoen. Maak een nieuw seizoen aan.');
    startNewSeason();
    if (!isTrainingInCurrentSeason()) {
      alert('De trainingsdag valt nog steeds buiten de ingevoerde datums. Pas de datums aan.');
      return;
    }
  }
  currentSeason.trainingDays.push({ date: currentTraining.date, records: { ...currentTraining.records } });
  currentTraining = { date: new Date().toISOString().split('T')[0], records: {} };
  saveData();
  renderTraining();
  updateLiveStats();
  alert('Trainingsdag opgeslagen en toegevoegd aan het huidige seizoen!');
});

// Roster beheer: render, bewerken en verwijderen
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
    li.textContent = `Seizoen van ${season.startDate} tot ${season.endDate} – Trainingsdagen: ${season.trainingDays.length}`;
    li.addEventListener('click', () => renderSeasonDetail(index));
    seasonList.appendChild(li);
  });
};

// Render detail van een specifiek seizoen met statistieken (aantal én percentage)
const renderSeasonDetail = seasonIndex => {
  const season = seasons[seasonIndex];
  const seasonInfo = document.getElementById('season-info');
  const totalPlayers = roster.length;
  const totalTrainingDays = season.trainingDays.length;
  const totalAbsentDays = season.trainingDays.reduce((sum, day) => sum + Object.values(day.records).filter(Boolean).length, 0);
  const totalChecks = totalTrainingDays * totalPlayers;
  const overallAbsentPerc = totalChecks ? ((totalAbsentDays / totalChecks) * 100).toFixed(1) : 0;
  const overallPresentCount = totalChecks - totalAbsentDays;
  const overallPresentPerc = totalChecks ? ((overallPresentCount / totalChecks) * 100).toFixed(1) : 0;

  seasonInfo.innerHTML = `
    <p>Startdatum: ${season.startDate}</p>
    <p>Einddatum: ${season.endDate}</p>
    <p>Aantal trainingsdagen: ${totalTrainingDays}</p>
    <p>Algemeen Aanwezig: ${overallPresentCount} / ${totalChecks} (${overallPresentPerc}%)</p>
    <p>Algemeen Afwezig: ${totalAbsentDays} / ${totalChecks} (${overallAbsentPerc}%)</p>
    <h3>Per Speler Statistieken:</h3>
    <ul>
      ${roster.map(player => {
        const absentCount = season.trainingDays.reduce((count, day) => count + (day.records[player.id] ? 1 : 0), 0);
        const perc = totalTrainingDays ? ((absentCount / totalTrainingDays) * 100).toFixed(1) : 0;
        return `<li>${player.id}. ${player.name}: Afwezig ${absentCount} / ${totalTrainingDays} (${perc}%)</li>`;
      }).join('')}
    </ul>
  `;
  
  showSection('season-detail-section');
  document.getElementById('btn-export-pdf').onclick = () => exportSeasonToPDF(season);
};

// Exporteer seizoen naar PDF (inclusief aantallen en percentages)
const exportSeasonToPDF = season => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const totalPlayers = roster.length;
  const totalTrainingDays = season.trainingDays.length;
  const totalAbsentDays = season.trainingDays.reduce((sum, day) => sum + Object.values(day.records).filter(Boolean).length, 0);
  const totalChecks = totalTrainingDays * totalPlayers;
  const overallAbsentPerc = totalChecks ? ((totalAbsentDays / totalChecks) * 100).toFixed(1) : 0;
  const overallPresentCount = totalChecks - totalAbsentDays;
  const overallPresentPerc = totalChecks ? ((overallPresentCount / totalChecks) * 100).toFixed(1) : 0;

  doc.setFontSize(16);
  doc.text("Seizoen Overzicht", 10, 20);
  doc.setFontSize(12);
  doc.text(`Startdatum: ${season.startDate}`, 10, 30);
  doc.text(`Einddatum: ${season.endDate}`, 10, 40);
  doc.text(`Aantal trainingsdagen: ${totalTrainingDays}`, 10, 50);
  doc.text(`Algemeen Aanwezig: ${overallPresentCount} / ${totalChecks} (${overallPresentPerc}%)`, 10, 60);
  doc.text(`Algemeen Afwezig: ${totalAbsentDays} / ${totalChecks} (${overallAbsentPerc}%)`, 10, 70);
  
  let yPos = 80;
  doc.text("Per Speler Statistieken:", 10, yPos);
  yPos += 10;
  roster.forEach(player => {
    const absentCount = season.trainingDays.reduce((count, day) => count + (day.records[player.id] ? 1 : 0), 0);
    const perc = totalTrainingDays ? ((absentCount / totalTrainingDays) * 100).toFixed(1) : 0;
    doc.text(`${player.id}. ${player.name}: Afwezig ${absentCount} / ${totalTrainingDays} (${perc}%)`, 10, yPos);
    yPos += 10;
  });
  
  doc.save(`Seizoen_${season.startDate}_tot_${season.endDate}.pdf`);
};

loadData();
renderTraining();
updateLiveStats();
showSection('training-section');
