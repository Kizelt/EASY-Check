// src/claude/memoryMCP.js

const { spawn } = require('child_process');

class MemoryMCP {
  constructor() {
    this.claudeMCPPath = process.env.CLAUDE_MCP_PATH || 'claude-mcp';
    this.namespace = 'easy-check'; // Namespace pour les données dans le MCP memory
    this.sessionCache = new Map(); // Cache local des données en mémoire
  }

  // Stocker des connaissances dans le MCP memory
  async storeKnowledge(key, data) {
    try {
      console.log(`Storing knowledge for key: ${key}`);
      
      // Préparer les données
      const fullKey = `${this.namespace}:${key}`;
      const serializedData = JSON.stringify(data);
      
      // Stocker dans le cache local
      this.sessionCache.set(fullKey, data);
      
      // Dans une implémentation réelle, nous stockerions dans le MCP memory
      // Simuler un stockage réussi
      return true;
    } catch (error) {
      console.error(`Error storing knowledge for key ${key}:`, error);
      return false;
    }
  }

  // Récupérer des connaissances depuis le MCP memory
  async retrieveKnowledge(key) {
    try {
      console.log(`Retrieving knowledge for key: ${key}`);
      
      // Construire la clé complète
      const fullKey = `${this.namespace}:${key}`;
      
      // Vérifier d'abord dans le cache local
      if (this.sessionCache.has(fullKey)) {
        console.log(`Found in local cache: ${key}`);
        return this.sessionCache.get(fullKey);
      }
      
      // Dans une implémentation réelle, nous récupérerions depuis le MCP memory
      // Pour l'instant, retourner null (pas de données trouvées)
      return null;
    } catch (error) {
      console.error(`Error retrieving knowledge for key ${key}:`, error);
      return null;
    }
  }

  // Vérifier si des connaissances existent pour une clé
  async hasKnowledge(key) {
    try {
      // Construire la clé complète
      const fullKey = `${this.namespace}:${key}`;
      
      // Vérifier d'abord dans le cache local
      if (this.sessionCache.has(fullKey)) {
        return true;
      }
      
      // Dans une implémentation réelle, nous vérifierions dans le MCP memory
      // Pour l'instant, retourner false
      return false;
    } catch (error) {
      console.error(`Error checking knowledge for key ${key}:`, error);
      return false;
    }
  }

  // Rechercher des connaissances similaires
  async findSimilarKnowledge(searchTerm) {
    try {
      console.log(`Searching for knowledge similar to: ${searchTerm}`);
      
      // Dans une implémentation réelle, nous rechercherions dans le MCP memory
      // Pour l'instant, simuler une recherche dans le cache local
      const results = [];
      
      this.sessionCache.forEach((value, key) => {
        if (key.includes(searchTerm) || 
            (value.type && value.type.includes(searchTerm)) || 
            (value.brand && value.brand.includes(searchTerm))) {
          results.push({
            key: key.replace(`${this.namespace}:`, ''),
            data: value
          });
        }
      });
      
      return results;
    } catch (error) {
      console.error(`Error searching for similar knowledge to ${searchTerm}:`, error);
      return [];
    }
  }

  // Supprimer des connaissances
  async deleteKnowledge(key) {
    try {
      console.log(`Deleting knowledge for key: ${key}`);
      
      // Construire la clé complète
      const fullKey = `${this.namespace}:${key}`;
      
      // Supprimer du cache local
      this.sessionCache.delete(fullKey);
      
      // Dans une implémentation réelle, nous supprimerions du MCP memory
      return true;
    } catch (error) {
      console.error(`Error deleting knowledge for key ${key}:`, error);
      return false;
    }
  }

  // Mettre à jour des connaissances
  async updateKnowledge(key, updater) {
    try {
      // Récupérer les données existantes
      const existingData = await this.retrieveKnowledge(key);
      
      if (!existingData) {
        throw new Error(`No existing data found for key: ${key}`);
      }
      
      // Appliquer la fonction de mise à jour
      const updatedData = updater(existingData);
      
      // Stocker les données mises à jour
      return await this.storeKnowledge(key, updatedData);
    } catch (error) {
      console.error(`Error updating knowledge for key ${key}:`, error);
      return false;
    }
  }

  // Exécuter une commande du MCP memory
  async executeCommand(command, args = []) {
    return new Promise((resolve, reject) => {
      const process = spawn(this.claudeMCPPath, ['memory', command, ...args]);
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Command failed with exit code ${code}: ${stderr}`));
        }
      });
    });
  }
}

module.exports = new MemoryMCP();
