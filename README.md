# 🎹 PianoFlow

**Apprends le piano gratuitement** avec un moteur d'apprentissage adaptatif.

## ✨ Fonctionnalités

- 🎹 **Clavier interactif** — souris, toucher, et clavier physique (détection auto AZERTY/QWERTY)
- 🔊 **Synthèse audio** — sons de piano réalistes via Web Audio API (zéro fichier externe)
- 📚 **13+ leçons progressives** — notes blanches → dièses → intervalles → gammes → accords → mélodies
- 🧠 **Moteur adaptatif** — la difficulté s'ajuste automatiquement selon tes performances
- 📊 **XP / Niveaux / Streaks** — progression persistante avec tableau de bord
- 👂 **Ear training** — entraîne ton oreille musicale
- 📱 **Responsive** — fonctionne sur desktop et mobile

## 🛠️ Stack technique

- **Vue 3** + Composition API + `<script setup>`
- **TypeScript** — typage strict du domaine musical
- **Vite** — build ultra-rapide
- **Aucune dépendance runtime** — tout est natif (Web Audio API, localStorage)

## 🏗️ Architecture

```
src/
├── types/           # Interfaces TypeScript du domaine
├── composables/     # Logique métier réutilisable
│   ├── useAudio.ts        # Synthétiseur piano (Web Audio)
│   ├── useMusicTheory.ts  # Notes, gammes, accords, intervalles
│   ├── useLessons.ts      # Système de leçons progressives
│   └── useAdaptive.ts     # Moteur d'apprentissage adaptatif
├── components/      # Composants Vue
│   ├── AppHeader.vue      # Barre de stats (niveau, XP, série)
│   ├── PianoKeyboard.vue  # Clavier interactif
│   ├── ExerciseArea.vue   # Zone d'exercice
│   ├── LessonList.vue     # Liste des leçons
│   ├── LessonComplete.vue # Écran de fin de leçon
│   └── StatsDashboard.vue # Tableau de bord
└── App.vue          # Orchestrateur principal
```

## 🚀 Démarrage

```bash
npm install
npm run dev
```

## 📦 Build

```bash
npm run build
npm run preview
```

## 📝 Parcours pédagogique

| Niveau | Contenu |
|--------|---------|
| 1-2 | Notes blanches (Do-Si) |
| 3-4 | Touches noires (dièses), toutes les notes |
| 5-6 | Octaves, intervalles |
| 7-9 | Gammes (Do majeur, majeures variées, mineures) |
| 10-11 | Accords (majeurs, mineurs) |
| 12 | Mélodies célèbres |
| 13 | Ear training |
| 14-15 | Pentatonique, accords de 7ème |

## 📄 Licence

MIT
