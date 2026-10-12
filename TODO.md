# Predlozi poboljšanja

Pregled: 12. oktobar 2026. Redosled je po važnosti. Podaci o proverama ispod odnose se na početni pregled.

Provereno: svih sedam JavaScript fajlova u `src` prolazi proveru sintakse u Node.js; sva 64 pokreta iz menija imaju odgovarajući FBX fajl. Ukupno postoji 65 FBX fajlova, približno 19 MiB; osnovni model je približno 0,8 MiB. Git radno stablo je pre pregleda bilo čisto. Projekat je statična Three.js aplikacija, bez `package.json`, automatizovanih testova ili CI konfiguracije.

Ograničenje: nisu provereni prikaz i animacije u pravom pregledaču, FPS, mobilni uređaji ni objavljena aplikacija. Provere logike koriste stvarni kod klase Player uz zamene za DOM, loader i mixer; ne proveravaju WebGL. Verzija lokalnog Three.js i verzija spoljnog loadera su obe 0.134.0; nije ustanovljena neusaglašenost verzija.

1. [ ] **Ukloniti spoljašnju zavisnost iz početnog učitavanja.** `src/utils.js:2`: FBXLoader dolazi sa unpkg.com, dok su ostale glavne biblioteke lokalne. Nedostupnost tog servera sprečava pokretanje i kada su svi fajlovi projekta dostupni. Čuvati odgovarajući loader i njegove prateće module lokalno uz verziju 0.134.0 i licence; nadogradnju biblioteke razmatrati odvojeno. Provera: aplikacija radi kada su zahtevi ka unpkg.com blokirani.

2. [ ] **Pouzdano upravljati sprečavanjem gašenja ekrana.** `src/main.js:55`: svaki klik šalje novi `wakeLock.request('screen')`, bez obrade odbijanja i bez čuvanja vraćenog objekta. Postojeća opciona provera rešava odsustvo API-ja, ali ne i odbijanje zahteva. Čuvati aktivni zahtev, izbeći ponavljanje dok je aktivan i obraditi odbijanje bez uticaja na aplikaciju. Provera: nepodržan ili odbijen zahtev ne stvara neobrađenu grešku, a ponovljeni klikovi ne šalju nepotrebne zahteve.

3. [ ] **Uvesti ponovljive osnovne provere i uputstvo za pokretanje.** `.eslintrc.json` postoji, ali nema definisanog načina instalacije i pokretanja provere; README ne objašnjava lokalni HTTP server. Testovi oporavka posle neuspelog učitavanja sada postoje i komanda je u README-u. Dodati uputstvo za lokalni HTTP server, ponovljivu proveru sintakse/lint, pa provere pokretati u CI. Provera: novi saradnik može da pokrene aplikaciju i iste provere prema README-u.
