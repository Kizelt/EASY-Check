// test-store.js
try {
  console.log('Tentative d\'importation de electron-store...');
  const Store = require('electron-store');
  console.log('Module importé avec succès. Type:', typeof Store);
  
  console.log('Tentative de création d\'une instance...');
  const store = new Store();
  console.log('Instance créée avec succès. Type:', typeof store);
  
  // Test des méthodes
  console.log('Test des méthodes set/get:');
  store.set('test', 'valeur de test');
  console.log('Valeur récupérée:', store.get('test'));
  
  console.log('Tout fonctionne correctement!');
} catch (error) {
  console.error('Erreur:', error);
}
