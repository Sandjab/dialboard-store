# Contribuer au Dialboard Store

1. **Crée ton dashboard** dans le designer Dialboard.
2. **Exporte-le en `.dboard`** via « Publier » (renseigne nom / description / domaine / tags) — le bloc `meta` est rempli pour toi. (À défaut, ajoute-le à la main, voir plus bas.)
3. **Ajoute le fichier** sous `entries/<ton-pseudo-github>/<slug>.dboard`.
4. **Ouvre une Pull Request.** La CI (`build-index --check`) valide ; corrige les erreurs signalées. Un mainteneur relit et merge. `index.json` se régénère automatiquement au merge.

## Format `.dboard` (v2)
```json
{
  "version": 2,
  "meta": {
    "name": "Nom affiché",
    "author": "ton-pseudo-github",
    "description": "Une phrase.",
    "domain": "time|weather|finance|system|home|transit|health|fun|other",
    "tags": ["mot", "clé"],
    "requires": "Ce qu'il faut brancher (source, POST /secrets…). Vide si zéro-config."
  },
  "layout": { /* … ton layout … */ },
  "assets": { "bg": {}, "image": {}, "aimg": {} }
}
```

## Règles (vérifiées par la CI)
- `layout` conforme au schéma partagé (`schema/layout.schema.json`).
- Toute `place.ref` résout vers un composant existant.
- `meta.name/author/description/domain` non vides ; `domain` dans l'enum.
- Taille du `.dboard` ≤ 512 Ko.
- Pas de secret/PII (jetons, mots de passe) — utilise des variables (`$ha_token`) alimentées côté device via `POST /secrets`.
