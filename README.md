# Harbor Flow

Deze map bevat een eerste MVP van een logistieke boat tracking app. De focus ligt op het volgen van schepen, ETA's, vertragingen en aankomsten per haven of terminal.

## Wat er nu in zit

- Een React/Vite frontend met een dashboard voor aankomsten, ETA's en operationele status.
- Mock scheepsdata in `src/data/vessels.js` zodat de app direct bruikbaar is.
- GitHub Pages deployment via `.github/workflows/deploy-pages.yml`.
- Een `.nojekyll` bestand in `public/` zodat GitHub Pages de build-output correct serveert.

## Lokaal starten

1. Installeer dependencies met `npm install`.
2. Start de ontwikkelserver met `npm run dev`.
3. Maak een productiebuild met `npm run build`.

## Publiceren via GitHub Pages

1. Maak een nieuwe GitHub repository aan.
2. Push deze map naar de `main` branch.
3. Open in GitHub: `Settings` > `Pages`.
4. Kies `GitHub Actions` als source.
5. De workflow bouwt de app en publiceert de inhoud van `dist/`.

## Doorbouwen naar echte tracking

De huidige data is mockdata. De volgende logische stap is een koppeling met een echte AIS-, terminal- of port-API, zodat je werkelijke posities, aankomsttijden en wijzigingen kunt tonen.