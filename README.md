# EASY-Check

EASY-Check est une application de bureau pour automatiser l'analyse de conformité des produits électriques selon les directives européennes LVD (2014/35/UE) et EMC (2014/30/UE).

## Fonctionnalités

- Importation par lots de dossiers de photos de produits
- Analyse automatique des images avec Claude Desktop MCP
- Détection des informations clés (MRN, marque, modèle, etc.)
- Évaluation de 11 critères de conformité réglementaire
- Interface de validation et correction manuelle
- Exportation des résultats au format Excel
- Système d'apprentissage pour améliorer progressivement la précision

## Architecture

L'application utilise :
- Electron pour l'interface de bureau
- Les MCP (Model Context Protocol) de Claude Desktop :
  - Filesystem pour l'accès aux images
  - Sequential-thinking pour l'analyse structurée
  - Memory pour le stockage des connaissances

## Installation

1. Cloner ce dépôt
2. Installer les dépendances : `npm install`
3. Lancer l'application : `npx electron .` ou double-cliquer sur `launch.bat`

## Utilisation

1. Cliquer sur "Select Folders" pour importer des dossiers de photos
2. Lancer l'analyse avec "Start Analysis"
3. Consulter et valider les résultats dans l'onglet "Results"
4. Exporter les résultats au format Excel

## Structure des dossiers produits

Les photos doivent être organisées comme suit :
- Dossiers nommés selon le format "K1", "K2", "J1", etc.
- 5-10 photos par dossier, incluant :
  * Emballage avec numéro MRN
  * Produit complet
  * Marquages sur le produit
  * Instructions

## Développé par

(Votre nom ou entreprise)

## Licence

(Licence à définir)
