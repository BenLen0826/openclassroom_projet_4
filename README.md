# Yoga App

Application de réservation de sessions de yoga, composée de deux parties :

| Partie | Dossier | Technologies | Documentation détaillée |
|---|---|---|---|
| Front-end | `front/` | Angular 19, Jest, Cypress | [front/README.md](front/README.md) |
| Back-end | `back/` | Java 21, Spring Boot 3.5, MySQL (Docker), JUnit 5, Mockito | [back/README.md](back/README.md) |

---

## 1. Prérequis

| Outil | Version | Utilisé par |
|---|---|---|
| Git | — | récupération du projet |
| Node.js / npm | Node 22 / npm 10 (versions utilisées pour le développement) | front |
| JDK | 21 | back |
| Maven | 3.9.3 ou plus | back |
| Docker Desktop (avec Docker Compose) | — | base de données MySQL du back |
| Google Chrome | — | tests end-to-end (Cypress) |

---

## 2. Installation

Cloner le projet :

```
git clone https://github.com/BenLen0826/openclassroom_projet_4.git
cd openclassroom_projet_4
```

Installer les dépendances du front :

```
cd front
npm install
```

Le back n'a pas besoin d'installation : Maven télécharge les dépendances au premier lancement.

---

## 3. Lancer l'application

L'application a besoin des deux parties : le front envoie ses requêtes `/api` au back (port 8080, voir `front/proxy.conf.json`).

1. **Démarrer Docker Desktop.**
2. **Démarrer le back**, dans un premier terminal :
   ```
   cd back
   mvn spring-boot:run
   ```
   Cette commande crée et démarre le conteneur MySQL, puis lance l'API sur `http://localhost:8080`.
3. **Au premier lancement seulement, créer le compte administrateur** dans la base de données
   (script `back/src/main/resources/sql/insert_user.sql`). La procédure pas à pas est dans [back/README.md](back/README.md#démarrage-du-back).
4. **Démarrer le front**, dans un second terminal :
   ```
   cd front
   npm run start
   ```
5. **Ouvrir** `http://localhost:4200` et se connecter avec le compte administrateur :
   - login : `yoga@studio.com`
   - mot de passe : `test!1234`

---

## 4. Lancer les tests et générer les rapports de couverture

Chaque commande de couverture **échoue si un indicateur est inférieur à 80 %**.

| Partie | Tests | Dossier | Commande (tests + rapport de couverture) | Rapport de couverture |
|---|---|---|---|---|
| Back | unitaires + intégration (JUnit 5, Mockito, Spring Boot Test, base H2 en mémoire) | `back/` | `mvn clean verify` | `back/target/site/jacoco/index.html` |
| Front | unitaires + intégration (Jest) | `front/` | `npm run test:coverage` | `front/coverage/jest/lcov-report/index.html` |
| Front | end-to-end (Cypress) | `front/` | `npm run e2e:ci` puis `npm run e2e:coverage` | `front/coverage/lcov-report/index.html` |

Remarques :
- Les tests du back n'ont besoin ni de Docker ni de MySQL : ils utilisent une base H2 en mémoire.
- Les tests end-to-end n'ont pas besoin du back (ses réponses sont simulées avec `cy.intercept`). Il faut en revanche
  **arrêter `npm run start`** avant de les lancer, car Cypress démarre lui-même l'application sur le port 4200.
- `npm run e2e:coverage` lit les données enregistrées par le dernier `npm run e2e:ci` : lancer d'abord la suite complète.
- Pour lancer les tests sans couverture, ou seulement une partie d'entre eux, voir les README de [front](front/README.md) et de [back](back/README.md#tests).

---

## 5. Résultats

| Partie | Tests | Dont intégration | Instructions / Statements | Branches | Lignes | Méthodes / Functions |
|---|---|---|---|---|---|---|
| Back (JaCoCo) | 101 | 38 (37,6 %) | 99,9 % | 98,5 % | 100 % | 100 % |
| Front, Jest | 115 | 45 (39,1 %) | 94,8 % | 100 % | 94,3 % | 100 % |
| Front, Cypress (E2E) | 37 | — | 99,5 % | 98,1 % | 99,4 % | 100 % |

Côté back, la complexité (99,3 %) et les classes (100 %) sont aussi au-dessus de 80 %.
Les packages `dto` et `payload` du back (objets de transport de données) ne sont pas testés et sont exclus du rapport.
