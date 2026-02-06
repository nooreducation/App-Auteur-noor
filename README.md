# Auteur Noor - Éditeur de Cours Interactifs

Cette application permet de créer et modifier des parcours pédagogiques interactifs pour la plateforme Noor Education.

## Fonctionnalités
- ✨ **Éditeur Visuel** : Créez des diapositives de type SPLASH, STORY, MATCHING, etc.
- 📦 **Import SCORM** : Importez des dossiers SCORM 2004 (format mAuthor) et convertissez-les en modules modifiables.
- 🎨 **Design Premium** : Interface moderne basée sur les codes graphiques de Noor Education.
- 📱 **Semi-Responsive** : Prévisualisation adaptée aux tablettes et ordinateurs.

## Démarrage Rapide

1. Installez les dépendances :
   ```bash
   npm install
   ```

2. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

## Structure du Projet
- `src/pages/CourseEditor.jsx` : Le cœur de l'application avec la logique d'importation SCORM.
- `src/index.css` : Le système de design (Design System) complet.
- `src/pages/Dashboard.jsx` : Gestion des projets de cours.

## Importation SCORM
L'importation supporte actuellement les archives .zip contenant un fichier `imsmanifest.xml` et un dossier `pages/` avec un fichier `main.xml`. L'algorithme extrait les titres et les types d'activités pour reconstruire le cours dans l'éditeur.
