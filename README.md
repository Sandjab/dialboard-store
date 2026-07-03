# Dialboard Store

Catalogue communautaire **gratuit** de dashboards pour [Dialboard](https://github.com/Sandjab/Dialboard) — l'écran tactile rond à ~15 €.

Chaque dashboard est un fichier `.dboard` (JSON déclaratif : layout + éventuels assets). **Navigable et installable directement depuis le designer** (tiroir « Store »), ou téléchargeable ici.

## Installer un dashboard
Ouvre le designer Dialboard → tiroir **Store** → filtre par domaine, cherche, **Installe**. (Ou télécharge le `.dboard` et importe-le.)

## Contribuer
Voir [CONTRIBUTING.md](CONTRIBUTING.md). En bref : exporte ton dashboard en `.dboard` (avec le bloc `meta`) depuis le designer, ajoute-le sous `entries/<ton-pseudo>/`, ouvre une Pull Request. La CI valide ; un mainteneur relit. `index.json` est **généré** — ne l'édite pas à la main.

## Sûreté
Un `.dboard` est du **JSON déclaratif, sans exécution de code**. La CI rejette tout layout non conforme au schéma, aux métadonnées incomplètes ou surdimensionné.
