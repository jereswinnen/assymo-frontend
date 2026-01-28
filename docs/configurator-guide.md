# Configurator - Prijsberekening & Admin Flow

## Concept: Vanafprijs Model

De configurator toont een **indicatieve vanafprijs** die omhoog gaat naarmate de klant opties selecteert. Er is geen maximum - de prijs wordt bepaald na een plaatsbezoek.

```
Vanafprijs = Basisprijs + Geselecteerde opties
```

---

## Admin Flow

### 1. Catalogus beheren (`/admin/content/configurator` → Catalogus tab)

Catalogus items zijn herbruikbare prijscomponenten:

| Veld | Voorbeeld |
|------|-----------|
| Naam | "Eik" |
| Categorie | "Houtsoorten" |
| Vanafprijs | €28 |
| Eenheid | Per m² / Per m / Per stuk |

**Eenheden bepalen de berekening:**
- `Per m²` → prijs × (lengte × hoogte)
- `Per m` → prijs × lengte
- `Per stuk` → vaste prijs

### 2. Configurator item aanmaken (`/admin/content/configurator` → Items tab)

Een configurator item is een productcategorie (bijv. "Poorten", "Carports"):

- **Naam**: Weergavenaam voor klant
- **Slug**: URL-vriendelijke identifier

### 3. Vragen & opties instellen (klik op item → vragenlijst)

**Per item stel je in:**
- **Vanafprijs**: Basisprijs voor dit item (bijv. €2.000)
- **Vragen**: De stappen die de klant doorloopt

**Vraagtypen:**
| Type | Gebruik |
|------|---------|
| Enkelvoudige keuze | Eén optie selecteren (houtsoort, stijl) |
| Meervoudige keuze | Meerdere opties selecteren (extra's) |
| Getal | Afmetingen (lengte, hoogte) |
| Tekst | Vrije invoer (opmerkingen) |

**Optie prijzen:**
- Koppel aan catalogus item (herbruikbaar, met eenheid)
- Of: handmatige prijs invoeren (vaste toeslag)

---

## Prijsberekening Voorbeeld

**Setup:**
- Poorten vanafprijs: €2.000
- Eik (catalogus): €28/m²
- Schuifpoort (catalogus): €1.800 per stuk

**Klant selecteert:**
- Lengte: 5m
- Hoogte: 1.5m
- Houtsoort: Eik
- Type: Schuifpoort

**Berekening:**
```
Basisprijs:           €2.000
Eik (5 × 1.5 = 7.5m²) €  210  (€28 × 7.5)
Schuifpoort:          €1.800
─────────────────────────────
Vanafprijs:           €4.010
```

---

## Klantflow

1. Klant opent `/configurator`
2. Selecteert productcategorie
3. Beantwoordt vragen (afmetingen, opties)
4. Vult contactgegevens in
5. Ziet samenvatting met **"Vanaf €X.XXX"**
6. Optioneel: plant direct een afspraak

---

## Technische notities

- Prijzen worden opgeslagen in **centen** (€28 = 2800)
- Afmetingen worden herkend via vraagsleutel (`lengte`, `hoogte`, `breedte`)
- API endpoint: `POST /api/configurator/calculate`
- Breakdown is niet zichtbaar voor klanten (alleen vanafprijs)
