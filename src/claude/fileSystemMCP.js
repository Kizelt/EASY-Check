// src/claude/fileSystemMCP.js

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class FileSystemMCP {
  constructor() {
    this.claudeMCPPath = process.env.CLAUDE_MCP_PATH || 'claude-mcp';
  }

  // Lire le contenu d'une image
  async readImage(imagePath) {
    try {
      // Vérifier si le fichier existe
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file does not exist: ${imagePath}`);
      }

      // Pour l'instant, nous retournons simplement le chemin du fichier
      // Dans une implémentation réelle, nous pourrions convertir l'image en base64
      // ou utiliser une autre méthode pour la passer à Claude Desktop
      return {
        path: imagePath,
        name: path.basename(imagePath),
        size: fs.statSync(imagePath).size,
        ext: path.extname(imagePath).toLowerCase()
      };
    } catch (error) {
      console.error(`Error reading image ${imagePath}:`, error);
      throw error;
    }
  }

  // Lire plusieurs images en parallèle
  async readMultipleImages(imagePaths) {
    try {
      return await Promise.all(imagePaths.map(imagePath => this.readImage(imagePath)));
    } catch (error) {
      console.error('Error reading multiple images:', error);
      throw error;
    }
  }

  // Vérifier si un dossier contient des images
  async folderContainsImages(folderPath) {
    try {
      const files = fs.readdirSync(folderPath);
      return files.some(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext);
      });
    } catch (error) {
      console.error(`Error checking folder for images ${folderPath}:`, error);
      return false;
    }
  }

  // Obtenir toutes les images d'un dossier
  async getImagesFromFolder(folderPath) {
    try {
      const files = fs.readdirSync(folderPath);
      const imagePaths = files
        .filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext);
        })
        .map(file => path.join(folderPath, file));
      
      return imagePaths;
    } catch (error) {
      console.error(`Error getting images from folder ${folderPath}:`, error);
      return [];
    }
  }

  // Exécuter une commande du MCP filesystem
  async executeCommand(command, args = []) {
    return new Promise((resolve, reject) => {
      const process = spawn(this.claudeMCPPath, ['filesystem', command, ...args]);
      
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

module.exports = new FileSystemMCP();
