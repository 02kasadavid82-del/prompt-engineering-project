# Etikus Döntéselőkészítő Szimulátor – Dilemmákkal

**Projekt dokumentáció**

**Forráskód:** [github.com/02kasadavid82-del/prompt-engineering-project](https://github.com/02kasadavid82-del/prompt-engineering-project)

---

## Tartalomjegyzék

1. [Projekt áttekintés](#1-projekt-áttekintés)
2. [Technikai megvalósítás](#2-technikai-megvalósítás)
3. [UI/UX döntések](#3-uiux-döntések)
4. [AI Prompt Engineering](#4-ai-prompt-engineering)
5. [Felhasznált promptok](#5-felhasznált-promptok)
6. [Összegzés](#6-összegzés)

---

## 1. Projekt áttekintés

A projekt egy webes **etikai dilemma szimulátor**, amelyben a felhasználó tíz gondosan megválasztott morális szituációra ad választ. A kvíz végén az alkalmazás az OpenAI API segítségével személyre szabott, „személyiségprofil"-jellegű kiértékelést készít a felhasználó döntéshozatali stílusáról.

Az AI által generált értékelés a következőket tartalmazza:

- rövid, frappáns főcím (*headline*) a felhasználó morális profiljáról,
- 3–5 mondatos viselkedéselemzés,
- 3–4 dinamikusan generált kategória,
- százalékos pontozás kategóriánként,
- magyarázó szöveg minden kategóriához.

Az AI integrációja azért volt különösen hasznos, mert a felhasználói válaszokra reagáló, kontextusra érzékeny, **természetes nyelvű kiértékelést statikus szabályrendszerrel nem lehet meggyőzően előállítani**. Az AI a strukturált bemenetből (címkék gyakorisága) értelmes, személyre szabott szöveges kimenetet képez.

---

## 2. Technikai megvalósítás

| Réteg | Technológia |
| --- | --- |
| Frontend | React (Vite) |
| Backend | Node.js + Express |
| Adattár | Lokális `dilemmas.json` fájl |
| AI integráció | OpenAI Chat Completions API |
| Stílus | Egyedi CSS design rendszer (framework nélkül) |
| Folyamatkezelés | `concurrently` (egyetlen `npm run dev` parancs) |

A két oldal közötti kommunikáció REST végpontokon keresztül történik, Vite dev-proxy-val:

- `GET /api/dilemmas` – visszaadja a 10 dilemmát,
- `POST /api/analyze` – továbbítja a felhasználó címkéit az OpenAI-nak, és JSON-ba szerializált értékelést ad vissza.

Adatbázist tudatosan nem használtam: a dilemmák statikus JSON fájlból töltődnek, a felhasználói előrehaladás (látott dilemmák) pedig `localStorage`-ben tárolódik, így új munkamenetnél új dilemmák kerülnek elő.

---

## 3. UI/UX döntések

A felület letisztult, **„editorial" hangulatú** dizájnt kapott — a gondolkodás csendes terét hivatott idézni, nem a tipikus „AI quiz" vizuális zaját.

- **Tipográfia**: *EB Garamond* (display) + *Manrope* (body) — klasszikus könyvszerű érzettel.
- **Színpaletta**: bone háttér (`#fbf9f4`), terrakotta accent (`#8c4d3c`), mohazöld másodlagos szín. Szándékosan **kerültem a sztereotip AI-s kék/lila gradient-eket**, mert azok azonnal sablonossá teszik a felületet.
- **Geometria**: 1 px-es vékony („hairline") szegélyek, szinte sarok nélküli formák (`border-radius` 0–4 px), nagy negatív tér.
- **Kvíz folyamat**: lineáris, egyetlen kérdés egy időben, vékony progress bar, „01 / 10" számláló. A visszalépés szándékosan hiányzik — a válasz őszinte marad.
- **Inspiráció**: a végleges dizájn a Google **Stitch** „The Quiet Room" projektje alapján készült. Nem egy az egyben másolva, hanem **irányadóként használva** (bento layout az eredmények oldalon, label-caps tipográfia, terrakotta editorial accent vonal).

---

## 4. AI Prompt Engineering

Ez a projekt két különböző szinten használja az AI-t: **(1) a fejlesztés során segédként** (Cursor IDE), és **(2) az alkalmazás logikájának részeként** (OpenAI az értékelés generálásához). A két szint közötti különbség kulcsfontosságú volt a munkamódszer kialakításában.

### 4.1. AI-asszisztált fejlesztés a Cursorban

A Cursor IDE Claude- és GPT-alapú *agentic* képességei lehetővé tették, hogy a fejlesztés nagy része **konkrét, jól megfogalmazott promptok formájában** történjen — nem csupán autocomplete-ként, hanem önálló, többlépéses feladatokat végrehajtó ügynökként. Az agent képes volt:

- olvasni a kódbázist és megérteni az architektúrát,
- több fájlt egyszerre szerkeszteni egy promptra,
- függőségeket telepíteni és parancsokat futtatni,
- a változtatások után lintet futtatni és hibákat javítani,
- felhasználói visszajelzések alapján iteratívan javítani.

Ez **nagyságrendekkel felgyorsította a fejlesztést**: az MVP első verziója egyetlen jól strukturált prompttal készült el; a teljes editorial design rendszer egyetlen redesign prompttal került be; az apró javítások mind 1–2 mondatos célzott promptokkal történtek.

### 4.2. Miért számít a prompt minősége

A munka során egyértelművé vált, hogy **a prompt minősége közvetlenül meghatározza a kód minőségét**. A jó prompt:

- **konkrét szerepet definiál** (pl. *„You are a senior full-stack developer"*),
- **strukturált követelményeket ad** számozott listákkal és alfejezetekkel,
- **megszorításokat is rögzít** (pl. *„Do NOT overengineer"*, *„no authentication, no database"*),
- **explicit output formátumot kér** (pl. szigorú JSON séma),
- **példákkal illusztrál**, ahol szükséges (pl. dilemma JSON struktúra mintával).

A homályos, általános promptok („csinálj egy quiz appot") szétfolyó, nem fenntartható kódot eredményeznek; a precíz promptok produkciós szintű kimenetet adnak. Ez ugyanúgy mérnöki készség, mint a tiszta kód írása.

### 4.3. Iteratív prompt fejlesztés

A projekt prompt-fejlesztése **hat jól elkülönülő fázisra** bomlik. Ezek nem előre megtervezett lépések voltak; a folyamat közben alakultak ki, és jól mutatják a prompt-iteráció valódi természetét — a **nyers ötlettől a kész, „production-ready" promptig**.

1. **Az alapötlet rögzítése és MVP-specifikáció kérése** (Prompt 1 & 2) — első lépésként egy kötetlen, beszélgetésszerű prompttal megfogalmaztam ChatGPT-nek a projekt ötletét, és kértem egy MVP-leírást. Ezt egy újabb, rövid prompttal alakítottam át **Cursor-ra szabott, technikai prompttá**. Ez a „prompt-of-prompt" megközelítés az AI-asszisztált munka egyik leghasznosabb mintája: az ember adja az ötletet, az AI strukturálja végrehajtható feladattá.

2. **Az értékelő-prompt iteratív polírozása** (Prompt 3 & 5) — a 3. prompt egy laza, beszélt nyelvű vázlat („write a prompt for the evaluation"), gépeléshibákkal és tisztázatlan részekkel. Az 5. prompt ennek **strukturált, JSON-séma-elvárású, „production-ready" változata**. A két verzió együttes szerepeltetése a dokumentumban szándékos: jól illusztrálja, hogy egy jó prompt ritkán születik első nekifutásra.

3. **Az MVP-prompt végrehajtása Cursorban** (Prompt 4) — a polírozott MVP-prompt egyetlen menetben létrehozta a teljes alkalmazás vázát: backend, frontend, JSON séma, OpenAI integráció, projekt struktúra. Ez volt a leglátványosabb produktivitási ugrás.

4. **Design-fázis: Stitch + Cursor együttműködés** (Prompt 6 & 7) — először a Google Stitch-ben generáltam dizájn-irányt (Prompt 6), majd a Cursor agent **adaptálta a meglévő alkalmazásra** a Stitch HTML kimenetét (Prompt 7). A *„not a 100% copy paste, just a direction"* kikötés alapvető volt, hogy a végeredmény ne legyen szolgai másolat.

5. **Apró Cursor-promptok az IDE-ben** — felhasználói visszajelzésekre adott kis, célzott javítások közvetlenül a Cursor chatben („the options are squeezed left", „the navigation links don't lead anywhere"). Ezek voltak a **leggyorsabb iterációk**: 1–2 mondatos prompt → kész javítás 10 másodperc alatt.

6. **Dokumentáció generálása** (Prompt 8) — a teljes projektdokumentáció egyetlen, részletesen strukturált meta-prompttal készült. A meta-prompt is része ennek a dokumentumnak az átláthatóság érdekében.

### 4.4. AI mint az alkalmazás magja

A fejlesztési AI mellett az **OpenAI az alkalmazás futásidejű logikájának is része**. A `/analyze` végpont a felhasználó válaszait (címkékkel együtt) elküldi a modellnek, amely strukturált JSON-t ad vissza. Itt a **prompt szigorú formátumelvárása kritikus**: a backend `JSON.parse`-olja a választ, így minden eltérés a sémától futásidejű hibát okozna. Ezért az 5. prompt mind a struktúrát (mező-mező), mind a viselkedést (*„Return ONLY the JSON. Do not include any extra text."*) explicit módon rögzíti.

### 4.5. Gyakorlati tanulságok

- Egy jól megfogalmazott prompt **többet ér, mint óra hosszú manuális kódolás**.
- Az AI **nem helyettesíti a tervezést, de drasztikusan felgyorsítja a végrehajtást**.
- A **strukturált output kérése** (JSON séma, példák, tiltások) drámaian csökkenti a hibaszázalékot.
- A **kicsi, fókuszált promptok** (1–3 mondat egy konkrét célra) gyorsabb iterációt tesznek lehetővé, mint egyetlen, mindent tartalmazó *megaprompt*.
- A **prompt is forráskód**: verziózni, dokumentálni, és felülvizsgálni érdemes, mint bármely más artefaktumot.

---

## 5. Felhasznált promptok

Az alábbiakban a projekt során használt összes lényeges prompt **eredeti angol formában** szerepel, hogy a folyamat átláthatóan reprodukálható legyen. A prompteket a fejlesztés **valós időrendi sorrendjében** közöljük: a kezdeti, beszélgetésszerű ötlet-promptokat (1–3) követik a végrehajtásra használt, kifinomult prompt-változatok (4–7), végül a dokumentációt generáló meta-prompt (8). A nyers és a polírozott változatok együttes közlése jól mutatja a prompt-engineering iteratív jellegét.

### Prompt 1 – Az alapötlet rögzítése és MVP-leírás kérése (ChatGPT)

```txt
I have a project due, with the title: etikus donteselokeszito szimulator - dilemmakkal. I imagined it as a website, that provides you with dilemas from a fixed database, and after, let's say 10 dilemas aswered, it shows you a screen, where your answers get analised by AI (I have an OpenAI api key for that). I think it should be like a quiz, where you can choose from the typical aswers to each dilema, aka a multiple choice quiz. create an MVP description for this.
```

---

### Prompt 2 – Az MVP-leírás Cursor-prompttá alakítása (ChatGPT)

```txt
create a prompt for cursor to code this
```

---

### Prompt 3 – Az értékelő-prompt nyers vázlata (ChatGPT)

```txt
write a prompt for the evaluation. as a result it should give a main summary/headline and 3-4 categories, where it rates x category in detail. the AI should decide what the category should be based on what's relevant. it can give percentages and whatever you think is fitting. write this as a prompt for cursor to change the existing OpenAI prompt.
```

---

### Prompt 4 – Polírozott MVP fejlesztési prompt (Cursor)

```txt
You are a senior full-stack developer. Build a simple MVP web application called:

"Etikus Döntéselőkészítő Szimulátor – Dilemmákkal"

## Goal

Create a minimal but functional ethical dilemma quiz app with AI-based analysis using the OpenAI API.

---

## Tech Stack

* Frontend: React (Vite)
* Backend: Node.js + Express
* Styling: simple CSS (no frameworks)
* Data: local JSON file (no database)

---

## Core Features

### 1. Quiz Flow

* Show 10 dilemmas one by one
* Each dilemma has:

  * scenario text
  * 3–4 multiple choice answers
* User must select one option to proceed
* Show progress (e.g., "Question 3 / 10")

---

### 2. Dilemma Data

Create a file: `/data/dilemmas.json`

Structure:
[
{
"id": 1,
"scenario": "You find a lost wallet with cash and ID inside. What do you do?",
"options": [
{ "text": "Return it with everything inside", "tags": ["altruistic", "honest"] },
{ "text": "Take the money and return the wallet", "tags": ["selfish", "pragmatic"] },
{ "text": "Ignore it and walk away", "tags": ["avoidant"] }
]
}
]

Create at least 10 dilemmas.

---

### 3. State Management

* Store user answers in React state
* Each answer should include selected option + tags

---

### 4. Backend API

Create Express server with:

#### GET /dilemmas

* Returns dilemmas JSON

#### POST /analyze

* Receives user answers
* Calls OpenAI API
* Returns analysis text

---

### 5. OpenAI Integration

Use environment variable:
OPENAI_API_KEY

Use latest OpenAI API (chat or responses API).

Prompt sent to OpenAI should be:

"You are an expert in ethical decision-making analysis.

A user answered 10 ethical dilemmas. Each answer has tags describing the nature of their choice.

Analyze their decision-making style.

Provide:

1. A short summary (3–5 sentences)
2. Key traits (bullet points)

Here are the tags:
[INSERT TAG LIST]"

Return only clean text.

---

### 6. Frontend Pages

#### Start Screen

* Title
* "Start Quiz" button

#### Quiz Screen

* Scenario text
* Multiple choice buttons
* Progress indicator

#### Result Screen

* Show loading spinner while waiting for AI
* Display AI-generated analysis
* "Restart" button

---

### 7. UX Requirements

* Clean and minimal UI
* No authentication
* No database
* No advanced styling

---

### 8. Project Structure

/frontend
/src
App.jsx
Quiz.jsx
Result.jsx

/backend
server.js
/data/dilemmas.json

---

### 9. Important Constraints

* Keep code simple and readable
* Do NOT overengineer
* Do NOT add unnecessary libraries
* Use functional React components
* Use fetch for API calls

---

### 10. Bonus (if easy)

* Add simple tag aggregation before sending to OpenAI
* Example: count frequency of tags

---

## Output

Generate:

1. Full backend code
2. Full frontend code
3. Instructions to run both

Make sure everything works together.
```

---

### Prompt 5 – Polírozott AI értékelési prompt (Cursor – az `/analyze` endpointba)

```txt
Replace the existing OpenAI prompt in the `/analyze` endpoint with the following improved version.

---

### New OpenAI Prompt

You are an expert in ethical decision-making, behavioral psychology, and moral philosophy.

A user has completed a series of ethical dilemmas. Each answer includes descriptive tags (e.g., altruistic, pragmatic, risk-averse, honest, selfish, etc.).

Your task is to analyze the user's overall decision-making style and generate a structured, insightful evaluation.

---

## Input

You will receive a list of tags representing the user's choices.

---

## Instructions

1. Identify meaningful behavioral patterns in the data.

2. Dynamically define 3–4 relevant evaluation categories based on the user's answers.

   * Do NOT use fixed categories
   * Choose categories that best describe the user's tendencies

3. For each category:

   * Give it a clear name
   * Assign a percentage score (0–100%)
   * Provide a short but insightful explanation (2–4 sentences)

4. Also generate a strong, concise headline that summarizes the user's overall ethical profile.

---

## Output Format (STRICT)

Return ONLY valid JSON in the following structure:

{
"headline": "Short, impactful summary of the user's ethical style",
"summary": "3–5 sentence overall interpretation of the user's decision-making patterns",
"categories": [
{
"name": "Category name",
"score": 75,
"description": "Explanation of this trait and how it appears in the user's decisions"
}
]
}

---

## Style Guidelines

* Be insightful but not overly academic
* Avoid generic statements
* Make the analysis feel personalized and specific
* Use clear, human-readable language
* Ensure category names are intuitive (e.g., "Risk Sensitivity", "Fairness Orientation", "Pragmatism vs Idealism")

---

## Data to Analyze

Tags:
[INSERT TAG LIST HERE]

---

Return ONLY the JSON. Do not include any extra text.
```

---

### Prompt 6 – Google Stitch design prompt

```txt
Imagine you are a senior UI/UX designer. Design a very simple app where there is a database with ethical dilemmas, with 3-4 options for answers, and the user can start a 'quiz' where they answer 10 of them, and at the and there is an AI analysis of their answers, giving them their personality traits based on the answers they chose. There should not be a login page or user page, since we do not need session management. Keep it simple, clean, pay attention to UI UX rules and flows, and avoid the blue and purple hues, since that gives the app an ai generated look, and that is undesireable.
```

---

### Prompt 7 – Cursor redesign prompt (Stitch design adaptálása MCP szerveren keresztül)

```txt
check the latest stitch project in and redesign the current application so it matches the design provided by stitch. It should not be a 100% copy paste, just a direction for the design. Use all available tools and skills you have
```

---

### Prompt 8 – Dokumentáció generálása (meta-prompt)

```txt
Good point — this version is much better for a realistic university submission. Use this updated Cursor prompt instead:

Create a concise but professional software project documentation in HUNGARIAN for the following application:

# Project Name

Etikus Döntéselőkészítő Szimulátor – Dilemmákkal

IMPORTANT:

* The documentation itself should NOT be extremely long.
* The non-prompt sections should together be around 1 page maximum.
* The MAIN FOCUS should be on the prompting process and AI-assisted development.
* The prompts section should be the largest and most detailed part.
* The ENTIRE documentation must be written in Hungarian.
* HOWEVER: keep all prompts in their ORIGINAL ENGLISH form.
* Use professional markdown formatting.
* Make it feel like a realistic university software project submission.

# Application Description

The application is a web-based ethical dilemma simulator where users answer 10 multiple-choice ethical dilemmas. After completing the quiz, the system uses the OpenAI API to analyze the user's decision-making patterns and generate a personality-style evaluation.

The AI evaluation includes:

* a headline summary,
* behavioral analysis,
* dynamically generated categories,
* percentage-based scoring,
* detailed explanations.

# Documentation Structure

## 1. Projekt áttekintés

Briefly explain:

* the goal of the application,
* how it works,
* what technologies were used,
* why AI integration was useful.

Keep this section concise.

---

## 2. Technikai megvalósítás

Briefly describe:

* React + Vite frontend,
* Node.js + Express backend,
* OpenAI API integration,
* JSON dilemma database,
* frontend-backend communication.

Do NOT overexplain technical details.

---

## 3. UI/UX döntések

Briefly explain:

* minimalist design,
* dilemma quiz flow,
* avoiding stereotypical AI blue/purple colors,
* Google Stitch-inspired redesign.

Keep this section short.

---

## 4. AI Prompt Engineering

THIS SHOULD BE THE MAIN SECTION.

Explain in more detail:

* how AI-assisted development was used,
* why Cursor was useful,
* how prompts accelerated development,
* why prompt quality matters,
* how prompts were iteratively improved,
* how AI was used both for development and for the final application logic.

Make this section significantly more detailed than the technical sections.

---

## 5. Felhasznált Promptok

This should be the longest section of the document.

IMPORTANT:

* Include ALL prompts EXACTLY as written below.
* Keep them in English.
* Use markdown code blocks.
* Clearly separate prompts with headings.

(Prompt 1, 2, 3, 4 contents inserted here in the original message.)

---

## 6. Összegzés

Write a short conclusion about:

* the final result,
* AI-assisted development,
* lessons learned,
* future improvement possibilities.

Keep the conclusion concise.

Generate the full documentation in one response in a markdown file.

Include this prompt in it too
```

---

## 6. Összegzés

A projekt egy **működő, esztétikailag igényes webes alkalmazásban** öltött testet, amely sikeresen kombinálja a *statikus dilemma-tartalom* és a *dinamikusan generált AI kiértékelés* erősségeit. Az AI-asszisztált fejlesztés tette lehetővé, hogy a frontend, a backend és a teljes design rendszer **néhány óra alatt elkészüljön** egyetlen fejlesztő munkájával — egy hagyományos workflow-ban ez napokat venne igénybe.

A legfontosabb tanulság: **a promptok minősége a fejlesztés új minőségfaktora**. Ahogy korábban a kódstandardok és a tesztek határozták meg a szoftverminőséget, úgy ma a strukturált, jól megfogalmazott promptok a kulcs az AI-vel támogatott munkához. Egy *megaprompt* helyett kis, fókuszált promptok láncolata adja a leggyorsabb iterációt; egy szigorú output-séma (JSON) elkerüli a futásidejű hibákat; egy explicit szerepdefiníció (*„senior full-stack developer"*) jobb minőségű kódot eredményez.

A jövőbeli fejlesztési lehetőségek:

- a dilemma-adatbázis bővítése és tematikus csoportosítása,
- a kiértékelések perzisztens mentése (pl. SQLite-tal),
- magyar nyelvi lokalizáció a frontenden,
- megoszthatóságot biztosító statikus eredmény-URL-ek (rövid hash-szel),
- A/B tesztelés különböző AI promptokkal a kiértékelés minőségének mérésére,
- automatizált eval pipeline, amely különböző prompt-verziók kimeneteit hasonlítja össze.

---

*Dokumentum generálva AI-asszisztált fejlesztés keretében. Az összes prompt eredeti, angol nyelvű formájában szerepel a folyamat reprodukálhatósága érdekében.*
