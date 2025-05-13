// test-electron.js
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Vérifier l'environnement
console.log('Répertoire courant:', process.cwd());
console.log('Contenu du répertoire:');
try {
  fs.readdirSync('.').forEach(file => {
    console.log(`- ${file}`);
  });
} catch (err) {
  console.error('Erreur lors de la lecture du répertoire:', err);
}

// Vérifier les fichiers principaux
console.log('\nVérification des fichiers principaux:');
['index.js', 'package.json', 'src/index.html', 'src/renderer.js'].forEach(file => {
  try {
    const stats = fs.statSync(file);
    console.log(`- ${file}: ${stats.size} octets`);
  } catch (err) {
    console.error(`- ${file}: ERREUR - ${err.message}`);
  }
});

// Tenter de lancer Electron
console.log('\nTentative de lancement d\'Electron:');
try {
  const electronPath = require('electron');
  console.log('Chemin d\'Electron:', electronPath);
  
  const result = spawnSync(electronPath, ['.'], { 
    stdio: 'pipe',
    encoding: 'utf-8'
  });
  
  console.log('Code de sortie:', result.status);
  if (result.error) {
    console.error('Erreur:', result.error);
  }
  if (result.stdout) {
    console.log('Sortie standard:', result.stdout);
  }
  if (result.stderr) {
    console.log('Erreur standard:', result.stderr);
  }
} catch (err) {
  console.error('Erreur lors du lancement d\'Electron:', err);
}
