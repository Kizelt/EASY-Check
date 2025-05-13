// src/utils/excelExporter.js

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

class ExcelExporter {
  constructor() {
    // Configuration des colonnes
    this.columns = [
      { header: 'Product Name', key: 'ProductName', width: 15 },
      { header: 'MRN', key: 'MRN', width: 20 },
      { header: 'Type', key: 'Type', width: 20 },
      { header: 'Directive', key: 'Directive', width: 10 },
      { header: 'Description', key: 'Description', width: 30 },
      { header: 'Brand/Manufacturer', key: 'Brand', width: 20 },
      { header: 'Model/Type', key: 'Model', width: 15 },
      { header: 'CE Marking Affixed', key: 'CE_Marking_Affixed', width: 15 },
      { header: 'CE Marking Visible', key: 'CE_Marking_Visible', width: 15 },
      { header: 'CE Marking Size', key: 'CE_Marking_Size', width: 15 },
      { header: 'CE Marking Compliant', key: 'CE_Marking_Compliant', width: 15 },
      { header: 'Manufacturer Name', key: 'Manufacturer_Name', width: 15 },
      { header: 'Product Identification', key: 'Product_Identification', width: 15 },
      { header: 'Manufacturer Address', key: 'Manufacturer_Address', width: 15 },
      { header: 'Importer Info', key: 'Importer_Info', width: 15 },
      { header: 'Economic Operator Info', key: 'Economic_Operator_Info', width: 20 },
      { header: 'Instructions Provided', key: 'Instructions_Provided', width: 15 },
      { header: 'Instructions Language', key: 'Instructions_Language', width: 15 }
    ];
  }

  // Exporter des données vers un fichier Excel
  async exportToExcel(data, filePath) {
    try {
      console.log(`Exporting ${data.length} items to Excel: ${filePath}`);
      
      // Créer un nouveau workbook
      const workbook = new ExcelJS.Workbook();
      
      // Ajouter des méta-informations
      workbook.creator = 'EASY-Check';
      workbook.lastModifiedBy = 'EASY-Check Application';
      workbook.created = new Date();
      workbook.modified = new Date();
      
      // Créer une feuille pour les résultats
      const sheet = workbook.addWorksheet('Analysis Results');
      
      // Ajouter des colonnes
      sheet.columns = this.columns;
      
      // Ajouter les données
      sheet.addRows(data);
      
      // Appliquer des styles
      this.applyStyles(sheet);
      
      // Créer le répertoire de destination si nécessaire
      const directory = path.dirname(filePath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      
      // Enregistrer le workbook
      await workbook.xlsx.writeFile(filePath);
      
      console.log(`Excel file created successfully: ${filePath}`);
      return true;
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  }

  // Vérifier si un fichier Excel existe et ajouter des données à un fichier existant
  async appendToExcelIfExists(data, filePath) {
    try {
      if (fs.existsSync(filePath)) {
        console.log(`Appending to existing Excel file: ${filePath}`);
        
        // Lire le fichier existant
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        
        // Obtenir la première feuille ou en créer une nouvelle
        let sheet = workbook.getWorksheet('Analysis Results');
        if (!sheet) {
          sheet = workbook.addWorksheet('Analysis Results');
          sheet.columns = this.columns;
          this.applyStyles(sheet);
        }
        
        // Ajouter les nouvelles données
        sheet.addRows(data);
        
        // Enregistrer le workbook
        await workbook.xlsx.writeFile(filePath);
        
        console.log(`Data appended to Excel file: ${filePath}`);
        return true;
      } else {
        // Fichier n'existe pas, créer un nouveau
        return await this.exportToExcel(data, filePath);
      }
    } catch (error) {
      console.error('Error appending to Excel:', error);
      throw error;
    }
  }

  // Appliquer des styles au workbook
  applyStyles(sheet) {
    // Style d'en-tête
    sheet.getRow(1).font = {
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3498DB' }
    };
    
    // Bordures pour toutes les cellules
    sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Centrer les valeurs 'Yes'/'No'
        if (cell.value === 'Yes' || cell.value === 'No') {
          cell.alignment = { horizontal: 'center' };
          
          // Couleur de fond pour Yes/No
          if (cell.value === 'Yes') {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE6F7E9' } // Vert pâle
            };
          } else if (cell.value === 'No') {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFBE6E6' } // Rouge pâle
            };
          }
        }
      });
    });
    
    // Ajuster la hauteur des lignes
    sheet.getRow(1).height = 25;
    
    // Gel des volets
    sheet.views = [
      { state: 'frozen', xSplit: 1, ySplit: 1, activeCell: 'B2' }
    ];
    
    // Filtres automatiques
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: sheet.columns.length }
    };
  }
}

module.exports = new ExcelExporter();
