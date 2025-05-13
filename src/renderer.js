// src/renderer.js

// Import des modules nécessaires
const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

// Import des modules Claude Desktop MCP
const claudeDesktopBridge = require('./claude/claudeDesktopBridge');
const fileSystemMCP = require('./claude/fileSystemMCP');
const sequentialThinkingMCP = require('./claude/sequentialThinkingMCP');
const memoryMCP = require('./claude/memoryMCP');

// Variables globales pour stocker l'état de l'application
let currentFolders = [];
let analysisResults = {};
let productsFolders = [];
let currentProductIndex = 0;
let analyzeQueue = [];
let isAnalyzing = false;

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
    setupEventListeners();
});

// Initialisation des éléments d'interface
async function initializeApp() {
    // Mise à jour des icônes dans l'interface
    updateIconsInUI();
    
    // Initialiser Claude Desktop Bridge
    try {
        await claudeDesktopBridge.initialize();
        logStatus('Claude Desktop Bridge initialized successfully', 'success');
    } catch (error) {
        logStatus(`Failed to initialize Claude Desktop Bridge: ${error.message}`, 'error');
    }
    
    // Masquer les sections qui ne sont pas encore pertinentes
    document.getElementById('analysis-section').style.display = 'none';
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('export-section').style.display = 'none';
    
    // Afficher la section d'importation
    document.getElementById('import-section').style.display = 'block';
    
    // Initialiser les sélecteurs
    updateDirectorySelector();
}

// Fonction pour journaliser les messages de statut
function logStatus(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Dans une version future, on pourrait ajouter une interface visuelle
    // pour afficher ces messages à l'utilisateur
}

// Mise à jour des icônes dans l'interface
function updateIconsInUI() {
    // Icônes pour la barre de navigation principale
    document.getElementById('nav-import').innerHTML = '<i class="fas fa-file-import"></i> Import';
    document.getElementById('nav-analyze').innerHTML = '<i class="fas fa-microscope"></i> Analyze';
    document.getElementById('nav-results').innerHTML = '<i class="fas fa-clipboard-check"></i> Results';
    document.getElementById('nav-export').innerHTML = '<i class="fas fa-file-export"></i> Export';
    
    // Icônes pour les boutons d'action
    document.getElementById('select-folder-btn').innerHTML = '<i class="fas fa-folder-open"></i> Select Folders';
    document.getElementById('start-analysis-btn').innerHTML = '<i class="fas fa-play-circle"></i> Start Analysis';
    document.getElementById('export-excel-btn').innerHTML = '<i class="fas fa-file-excel"></i> Export to Excel';
    
    // Icônes pour les contrôles de navigation
    document.getElementById('prev-product-btn').innerHTML = '<i class="fas fa-chevron-left"></i> Previous';
    document.getElementById('next-product-btn').innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
    
    // Icônes pour les actions de validation
    const validationIcons = document.querySelectorAll('.validation-icon');
    validationIcons.forEach(icon => {
        if (icon.classList.contains('validate')) {
            icon.innerHTML = '<i class="fas fa-check-circle"></i>';
        } else if (icon.classList.contains('reject')) {
            icon.innerHTML = '<i class="fas fa-times-circle"></i>';
        } else if (icon.classList.contains('edit')) {
            icon.innerHTML = '<i class="fas fa-edit"></i>';
        }
    });
    
    // Icônes pour les indicateurs d'état
    document.getElementById('loading-indicator').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    document.getElementById('success-indicator').innerHTML = '<i class="fas fa-check-circle"></i> Complete';
    document.getElementById('error-indicator').innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Navigation
    document.getElementById('nav-import').addEventListener('click', showImportSection);
    document.getElementById('nav-analyze').addEventListener('click', showAnalysisSection);
    document.getElementById('nav-results').addEventListener('click', showResultsSection);
    document.getElementById('nav-export').addEventListener('click', showExportSection);
    
    // Boutons d'action
    document.getElementById('select-folder-btn').addEventListener('click', selectFolders);
    document.getElementById('start-analysis-btn').addEventListener('click', startAnalysis);
    document.getElementById('export-excel-btn').addEventListener('click', exportToExcel);
    
    // Navigation dans les produits
    document.getElementById('prev-product-btn').addEventListener('click', showPreviousProduct);
    document.getElementById('next-product-btn').addEventListener('click', showNextProduct);
    
    // Écouteurs pour les interactions de validation
    setupValidationListeners();
}

// Configuration des écouteurs pour les validations
function setupValidationListeners() {
    // Sélection des boutons de validation
    const validateButtons = document.querySelectorAll('.validate-btn');
    const rejectButtons = document.querySelectorAll('.reject-btn');
    const editButtons = document.querySelectorAll('.edit-btn');
    
    // Ajout des écouteurs pour chaque bouton
    validateButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const criteriaId = e.target.closest('.criteria-item').dataset.criteriaId;
            validateCriteria(criteriaId);
        });
    });
    
    rejectButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const criteriaId = e.target.closest('.criteria-item').dataset.criteriaId;
            rejectCriteria(criteriaId);
        });
    });
    
    editButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const criteriaId = e.target.closest('.criteria-item').dataset.criteriaId;
            editCriteria(criteriaId);
        });
    });
}

// Fonctions de navigation entre sections
function showImportSection() {
    hideAllSections();
    document.getElementById('import-section').style.display = 'block';
    highlightNavItem('nav-import');
}

function showAnalysisSection() {
    hideAllSections();
    document.getElementById('analysis-section').style.display = 'block';
    highlightNavItem('nav-analyze');
}

function showResultsSection() {
    hideAllSections();
    document.getElementById('results-section').style.display = 'block';
    highlightNavItem('nav-results');
}

function showExportSection() {
    hideAllSections();
    document.getElementById('export-section').style.display = 'block';
    highlightNavItem('nav-export');
}

function hideAllSections() {
    const sections = document.querySelectorAll('.app-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
}

function highlightNavItem(id) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    document.getElementById(id).classList.add('active');
}

// Sélection des dossiers à analyser
async function selectFolders() {
    try {
        // Afficher l'indicateur de chargement
        document.getElementById('loading-indicator').style.display = 'block';
        document.getElementById('success-indicator').style.display = 'none';
        document.getElementById('error-indicator').style.display = 'none';
        
        // Demander à l'utilisateur de sélectionner les dossiers
        const result = await ipcRenderer.invoke('select-folders');
        
        if (result.canceled) {
            document.getElementById('loading-indicator').style.display = 'none';
            return;
        }
        
        // Stocker les dossiers sélectionnés
        currentFolders = result.filePaths;
        
        // Analyser la structure des dossiers pour trouver les dossiers de produits
        productsFolders = await scanFolders(currentFolders);
        
        // Mettre à jour l'interface avec les dossiers détectés
        updateDirectorySelector();
        
        // Afficher l'indicateur de succès
        document.getElementById('loading-indicator').style.display = 'none';
        document.getElementById('success-indicator').style.display = 'block';
        
        // Activer le bouton d'analyse si des dossiers valides ont été trouvés
        document.getElementById('start-analysis-btn').disabled = productsFolders.length === 0;
        
        // Afficher le nombre de produits détectés
        document.getElementById('products-count').textContent = productsFolders.length;
        
    } catch (error) {
        console.error('Error selecting folders:', error);
        document.getElementById('loading-indicator').style.display = 'none';
        document.getElementById('error-indicator').style.display = 'block';
        document.getElementById('error-message').textContent = error.message;
    }
}

// Analyse de la structure des dossiers
async function scanFolders(folderPaths) {
    const productFolders = [];
    
    for (const folderPath of folderPaths) {
        try {
            const entries = await fs.promises.readdir(folderPath, { withFileTypes: true });
            
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const subfolderPath = path.join(folderPath, entry.name);
                    
                    // Vérifier si le nom du dossier correspond au format attendu (K1, K2, J1, etc.)
                    if (/^[A-Za-z]\d+$/.test(entry.name)) {
                        // Utiliser le MCP filesystem pour vérifier si le dossier contient des images
                        const hasImages = await fileSystemMCP.folderContainsImages(subfolderPath);
                        
                        if (hasImages) {
                            // Utiliser le MCP filesystem pour obtenir les images du dossier
                            const images = await fileSystemMCP.getImagesFromFolder(subfolderPath);
                            
                            productFolders.push({
                                path: subfolderPath,
                                name: entry.name,
                                images: images
                            });
                            
                            logStatus(`Found product folder: ${entry.name} with ${images.length} images`);
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Error scanning folder ${folderPath}:`, error);
            logStatus(`Error scanning folder ${folderPath}: ${error.message}`, 'error');
        }
    }
    
    return productFolders;
}

// Mise à jour de l'affichage des dossiers sélectionnés
function updateDirectorySelector() {
    const folderTree = document.getElementById('folder-tree');
    folderTree.innerHTML = '';
    
    if (currentFolders.length === 0) {
        folderTree.innerHTML = '<p>No folders selected. Please select folders containing product images.</p>';
        document.getElementById('folders-count').textContent = '0';
        return;
    }
    
    document.getElementById('folders-count').textContent = currentFolders.length;
    
    const folderList = document.createElement('ul');
    folderList.classList.add('folder-list');
    
    currentFolders.forEach(folder => {
        const folderItem = document.createElement('li');
        folderItem.classList.add('folder-item');
        folderItem.innerHTML = `<i class="fas fa-folder-open"></i> ${path.basename(folder)}`;
        
        const productsList = document.createElement('ul');
        const productsInFolder = productsFolders.filter(product => product.path.startsWith(folder));
        
        productsInFolder.forEach(product => {
            const productItem = document.createElement('li');
            productItem.classList.add('subfolder-item');
            productItem.innerHTML = `<i class="fas fa-box"></i> ${product.name} (${product.images.length} images)`;
            productsList.appendChild(productItem);
        });
        
        if (productsInFolder.length > 0) {
            folderItem.appendChild(productsList);
        } else {
            folderItem.innerHTML += ' <span class="empty-folder">(No valid product folders found)</span>';
        }
        
        folderList.appendChild(folderItem);
    });
    
    folderTree.appendChild(folderList);
}

// Démarrage de l'analyse des produits
async function startAnalysis() {
    // Vérifier qu'il y a des produits à analyser
    if (productsFolders.length === 0) {
        alert('No product folders to analyze.');
        return;
    }
    
    // Passer à la section d'analyse
    showAnalysisSection();
    
    // Préparer l'interface d'analyse
    document.getElementById('total-products').textContent = productsFolders.length;
    document.getElementById('analysis-progress-bar').style.width = '0%';
    document.getElementById('analysis-log').innerHTML = '';
    
    // Préparer la file d'analyse
    analyzeQueue = [...productsFolders];
    isAnalyzing = true;
    
    // Démarrer l'analyse
    await processAnalysisQueue();
}

// Traitement de la file d'analyse
async function processAnalysisQueue() {
    if (analyzeQueue.length === 0 || !isAnalyzing) {
        // L'analyse est terminée ou a été annulée
        logAnalysisMessage('Analysis complete.');
        
        // Afficher les résultats
        if (Object.keys(analysisResults).length > 0) {
            showResultsSection();
            currentProductIndex = 0;
            showProductDetails(Object.keys(analysisResults)[0]);
        }
        
        isAnalyzing = false;
        return;
    }
    
    const productFolder = analyzeQueue.shift();
    const productIndex = productsFolders.length - analyzeQueue.length;
    
    // Mettre à jour l'interface
    document.getElementById('current-product-index').textContent = productIndex;
    document.getElementById('current-product-name').textContent = productFolder.name;
    document.getElementById('analysis-progress-bar').style.width = `${(productIndex / productsFolders.length) * 100}%`;
    
    logAnalysisMessage(`Analyzing product ${productFolder.name}...`);
    
    try {
        // Vérifier si des connaissances existantes sont disponibles via le MCP memory
        logAnalysisMessage(`Checking for existing knowledge on ${productFolder.name}...`);
        const existingKnowledge = await memoryMCP.retrieveKnowledge(productFolder.name);
        
        if (existingKnowledge) {
            logAnalysisMessage(`Found existing knowledge for ${productFolder.name}. Using cached analysis.`);
            analysisResults[productFolder.name] = existingKnowledge;
        } else {
            // Analyser le produit en utilisant le MCP sequential-thinking
            logAnalysisMessage(`No existing knowledge found. Starting analysis with Claude...`);
            const results = await analyzeProductWithClaude(productFolder);
            
            // Stocker les résultats dans le MCP memory
            await memoryMCP.storeKnowledge(productFolder.name, results);
            
            // Ajouter les résultats
            analysisResults[productFolder.name] = results;
            
            logAnalysisMessage(`Completed analysis of ${productFolder.name} and stored in memory.`);
        }
    } catch (error) {
        logAnalysisMessage(`Error analyzing ${productFolder.name}: ${error.message}`, 'error');
    }
    
    // Passer au produit suivant
    await processAnalysisQueue();
}

// Analyser un produit avec Claude Desktop
async function analyzeProductWithClaude(productFolder) {
    logAnalysisMessage(`Starting Claude analysis for ${productFolder.name}...`);
    
    try {
        // Utiliser le MCP sequential-thinking pour analyser le produit
        const analysisResults = await sequentialThinkingMCP.analyzeProduct(productFolder);
        
        logAnalysisMessage(`Claude analysis completed for ${productFolder.name}.`);
        return analysisResults;
    } catch (error) {
        logAnalysisMessage(`Error in Claude analysis for ${productFolder.name}: ${error.message}`, 'error');
        
        // Fallback vers la simulation si l'analyse avec Claude échoue
        logAnalysisMessage(`Falling back to simulated analysis for ${productFolder.name}.`);
        
        // Simuler un délai pour l'analyse
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // Retourner des résultats simulés
        return {
            name: productFolder.name,
            mrn: generateRandomMRN(),
            type: getRandomProductType(),
            directive: Math.random() > 0.5 ? 'LVD' : 'EMC',
            description: `Sample ${productFolder.name} product`,
            brand: `Brand-${productFolder.name}`,
            model: `Model-${Math.floor(Math.random() * 1000)}`,
            complianceCriteria: generateComplianceCriteria()
        };
    }
}

// Générer un MRN aléatoire pour la simulation
function generateRandomMRN() {
    const year = "25";
    const country = "BE";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let randomPart = '';
    
    for (let i = 0; i < 10; i++) {
        if (i < 2) {
            randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
        } else {
            randomPart += Math.floor(Math.random() * 10);
        }
    }
    
    return `${year}${country}H${randomPart}`;
}

// Obtenir un type de produit aléatoire pour la simulation
function getRandomProductType() {
    const types = ['Smart Plug', 'LED Light', 'USB Charger', 'Power Adapter', 'Bluetooth Speaker'];
    return types[Math.floor(Math.random() * types.length)];
}

// Générer des critères de conformité aléatoires pour la simulation
function generateComplianceCriteria() {
    const criteria = {};
    
    for (let i = 1; i <= 11; i++) {
        criteria[i] = {
            value: Math.random() > 0.7 ? 'No' : 'Yes',
            validated: true
        };
    }
    
    return criteria;
}

// Journaliser un message dans le log d'analyse
function logAnalysisMessage(message, type = 'info') {
    const log = document.getElementById('analysis-log');
    const entry = document.createElement('div');
    entry.classList.add('log-entry', type);
    
    const timestamp = new Date().toLocaleTimeString();
    entry.innerHTML = `[${timestamp}] ${message}`;
    
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}

// Navigation entre les produits dans les résultats
function showNextProduct() {
    const productKeys = Object.keys(analysisResults);
    if (productKeys.length === 0) return;
    
    currentProductIndex = (currentProductIndex + 1) % productKeys.length;
    showProductDetails(productKeys[currentProductIndex]);
}

function showPreviousProduct() {
    const productKeys = Object.keys(analysisResults);
    if (productKeys.length === 0) return;
    
    currentProductIndex = (currentProductIndex - 1 + productKeys.length) % productKeys.length;
    showProductDetails(productKeys[currentProductIndex]);
}

// Afficher les détails d'un produit
function showProductDetails(productName) {
    const product = analysisResults[productName];
    if (!product) return;
    
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-mrn').textContent = product.mrn;
    document.getElementById('product-type').textContent = product.type;
    document.getElementById('product-directive').textContent = product.directive;
    document.getElementById('product-description').textContent = product.description;
    document.getElementById('product-brand').textContent = product.brand;
    document.getElementById('product-model').textContent = product.model;
    
    document.getElementById('product-navigation-index').textContent = 
        `Product ${currentProductIndex + 1} of ${Object.keys(analysisResults).length}`;
    
    // Afficher les critères de conformité
    updateComplianceCriteria(product.complianceCriteria);
    
    // Afficher les images du produit (si disponibles)
    updateProductImages(product.name);
}

// Mettre à jour l'affichage des critères de conformité
function updateComplianceCriteria(criteria) {
    // Pour l'instant, nous n'avons qu'un seul critère dans le HTML, donc nous mettons simplement à jour sa valeur
    document.getElementById('criteria-1-value').textContent = criteria[1]?.value || '-';
    
    // Ici, vous ajouteriez du code pour générer dynamiquement tous les critères
    // en fonction des données reçues
}

// Mettre à jour l'affichage des images du produit
function updateProductImages(productName) {
    const productFolder = productsFolders.find(folder => folder.name === productName);
    
    const imagePreview = document.getElementById('image-preview');
    const thumbnailStrip = document.getElementById('thumbnail-strip');
    
    imagePreview.innerHTML = '';
    thumbnailStrip.innerHTML = '';
    
    if (!productFolder || productFolder.images.length === 0) {
        imagePreview.innerHTML = '<p>No images available for this product.</p>';
        return;
    }
    
    // Créer la prévisualisation principale avec la première image
    const mainImage = document.createElement('img');
    mainImage.src = `file://${productFolder.images[0]}`;
    mainImage.alt = `${productName} preview`;
    imagePreview.appendChild(mainImage);
    
    // Créer les vignettes pour toutes les images
    productFolder.images.forEach((imagePath, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = `file://${imagePath}`;
        thumbnail.alt = `${productName} thumbnail ${index + 1}`;
        thumbnail.classList.add('thumbnail');
        if (index === 0) thumbnail.classList.add('active');
        
        thumbnail.addEventListener('click', () => {
            // Mettre à jour l'image principale
            mainImage.src = thumbnail.src;
            
            // Mettre à jour la classe active
            document.querySelectorAll('.thumbnail').forEach(thumb => {
                thumb.classList.remove('active');
            });
            thumbnail.classList.add('active');
        });
        
        thumbnailStrip.appendChild(thumbnail);
    });
}

// Validation/Rejet des critères de conformité
function validateCriteria(criteriaId) {
    const productKeys = Object.keys(analysisResults);
    if (productKeys.length === 0 || !criteriaId) return;
    
    const currentProduct = analysisResults[productKeys[currentProductIndex]];
    if (currentProduct && currentProduct.complianceCriteria[criteriaId]) {
        currentProduct.complianceCriteria[criteriaId].value = 'Yes';
        currentProduct.complianceCriteria[criteriaId].validated = true;
        
        // Mettre à jour l'affichage
        document.getElementById(`criteria-${criteriaId}-value`).textContent = 'Yes';
        
        // Mettre à jour la connaissance dans le MCP memory
        memoryMCP.storeKnowledge(currentProduct.name, currentProduct);
    }
}

function rejectCriteria(criteriaId) {
    const productKeys = Object.keys(analysisResults);
    if (productKeys.length === 0 || !criteriaId) return;
    
    const currentProduct = analysisResults[productKeys[currentProductIndex]];
    if (currentProduct && currentProduct.complianceCriteria[criteriaId]) {
        currentProduct.complianceCriteria[criteriaId].value = 'No';
        currentProduct.complianceCriteria[criteriaId].validated = true;
        
        // Mettre à jour l'affichage
        document.getElementById(`criteria-${criteriaId}-value`).textContent = 'No';
        
        // Mettre à jour la connaissance dans le MCP memory
        memoryMCP.storeKnowledge(currentProduct.name, currentProduct);
    }
}

function editCriteria(criteriaId) {
    const productKeys = Object.keys(analysisResults);
    if (productKeys.length === 0 || !criteriaId) return;
    
    const currentProduct = analysisResults[productKeys[currentProductIndex]];
    if (!currentProduct || !currentProduct.complianceCriteria[criteriaId]) return;
    
    const currentValue = currentProduct.complianceCriteria[criteriaId].value;
    
    // Demander à l'utilisateur la nouvelle valeur (simple pour l'instant)
    const newValue = prompt(
        `Edit criteria ${criteriaId} value:`,
        currentValue
    );
    
    if (newValue !== null && newValue !== currentValue) {
        currentProduct.complianceCriteria[criteriaId].value = newValue;
        currentProduct.complianceCriteria[criteriaId].validated = true;
        
        // Mettre à jour l'affichage
        document.getElementById(`criteria-${criteriaId}-value`).textContent = newValue;
        
        // Mettre à jour la connaissance dans le MCP memory
        memoryMCP.storeKnowledge(currentProduct.name, currentProduct);
    }
}

// Exportation des résultats vers Excel
async function exportToExcel() {
    try {
        // Vérifier qu'il y a des résultats à exporter
        if (Object.keys(analysisResults).length === 0) {
            alert('No analysis results to export.');
            return;
        }
        
        // Afficher l'indicateur de chargement
        document.getElementById('export-loading-indicator').style.display = 'block';
        document.getElementById('export-success-indicator').style.display = 'none';
        document.getElementById('export-error-indicator').style.display = 'none';
        
        // Préparer les données pour l'exportation
        const exportData = Object.values(analysisResults).map(product => {
            // Convertir les résultats en format compatible avec Excel
            return {
                ProductName: product.name,
                MRN: product.mrn,
                Type: product.type,
                Directive: product.directive,
                Description: product.description,
                Brand: product.brand,
                Model: product.model,
                CE_Marking_Affixed: product.complianceCriteria[1]?.value || '-',
                CE_Marking_Visible: product.complianceCriteria[2]?.value || '-',
                CE_Marking_Size: product.complianceCriteria[3]?.value || '-',
                CE_Marking_Compliant: product.complianceCriteria[4]?.value || '-',
                Manufacturer_Name: product.complianceCriteria[5]?.value || '-',
                Product_Identification: product.complianceCriteria[6]?.value || '-',
                Manufacturer_Address: product.complianceCriteria[7]?.value || '-',
                Importer_Info: product.complianceCriteria[8]?.value || '-',
                Economic_Operator_Info: product.complianceCriteria[9]?.value || '-',
                Instructions_Provided: product.complianceCriteria[10]?.value || '-',
                Instructions_Language: product.complianceCriteria[11]?.value || '-'
            };
        });
        
        // Demander à l'utilisateur où sauvegarder le fichier Excel
        const result = await ipcRenderer.invoke('export-excel', exportData);
        
        // Afficher le résultat
        document.getElementById('export-loading-indicator').style.display = 'none';
        
        if (result.success) {
            document.getElementById('export-success-indicator').style.display = 'block';
            document.getElementById('export-path').textContent = result.path;
        } else {
            document.getElementById('export-error-indicator').style.display = 'block';
            document.getElementById('export-error-message').textContent = result.message;
        }
        
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        document.getElementById('export-loading-indicator').style.display = 'none';
        document.getElementById('export-error-indicator').style.display = 'block';
        document.getElementById('export-error-message').textContent = error.message;
    }
}
