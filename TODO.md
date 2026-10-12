# Predlozi poboljšanja

Pregled: 12. oktobar 2026. Redosled je po važnosti. Podaci o proverama ispod odnose se na početni pregled.

Provereno: svih sedam JavaScript fajlova u `src` prolazi proveru sintakse u Node.js; sva 64 pokreta iz menija imaju odgovarajući FBX fajl. Ukupno postoji 65 FBX fajlova, približno 19 MiB; osnovni model je približno 0,8 MiB. Git radno stablo je pre pregleda bilo čisto. Projekat je statična Three.js aplikacija, bez `package.json`, automatizovanih testova ili CI konfiguracije.

Ograničenje: nisu provereni prikaz i animacije u pravom pregledaču, FPS, mobilni uređaji ni objavljena aplikacija. Provere logike koriste stvarni kod klase Player uz zamene za DOM, loader i mixer; ne proveravaju WebGL. Verzija lokalnog Three.js i verzija spoljnog loadera su obe 0.134.0; nije ustanovljena neusaglašenost verzija.

0. [ ] **Omogućiti skrolovanje dugog menija na malom ekranu.** `style.css:4,82–85,145–147`: stranica i meni imaju `overflow: hidden`, a meni nema ograničenu visinu sa skrolovanjem. Sekcija Kicks sadrži 19 dugmadi uz ostale kategorije, pa postoji rizik da donje kontrole budu nedostupne na niskom ekranu. Dodati ograničenu visinu i vertikalno skrolovanje menija; u `index.html:7` dodati `width=device-width` u viewport. Provera u pregledaču: sve stavke i Random moves dostupni su na telefonu i u horizontalnom položaju.

1. [ ] **Uskladiti automatsko ponavljanje sa pauzom.** `src/Player.js:50–51,86–100`: tajmer koristi `Date.now()`, dok klizač brzine utiče samo na mixer. Poziv `update(0)` posle isteka intervala i dalje bira novi pokret, potvrđeno proverom logike. Pri brzini nula zaustaviti i odbrojavanje i automatski izbor; nastavak treba da zadrži preostalo vreme. Provera: pauza duža od šest sekundi ne pokreće drugi pokret i ne nastavlja sa preskočenim odbrojavanjem.

2. [ ] **Popraviti prečicu za desnu strelicu.** `src/main.js:64`: izraz `('ArrowLeft' || 'ArrowRight')` uvek daje `ArrowLeft`, pa desna strelica ne fokusira klizač kako opis kontrole obećava. Potvrđeno izvršavanjem izraza. Proveravati oba tastera zasebno, uz očuvanje uobičajenog rada strelica kada je klizač već fokusiran. Provera: obe strelice omogućavaju promenu brzine.

3. [ ] **Ukloniti spoljašnju zavisnost iz početnog učitavanja.** `src/utils.js:2`: FBXLoader dolazi sa unpkg.com, dok su ostale glavne biblioteke lokalne. Nedostupnost tog servera sprečava pokretanje i kada su svi fajlovi projekta dostupni. Čuvati odgovarajući loader i njegove prateće module lokalno uz verziju 0.134.0 i licence; nadogradnju biblioteke razmatrati odvojeno. Provera: aplikacija radi kada su zahtevi ka unpkg.com blokirani.

4. [ ] **Pouzdano upravljati sprečavanjem gašenja ekrana.** `src/main.js:55`: svaki klik šalje novi `wakeLock.request('screen')`, bez obrade odbijanja i bez čuvanja vraćenog objekta. Postojeća opciona provera rešava odsustvo API-ja, ali ne i odbijanje zahteva. Čuvati aktivni zahtev, izbeći ponavljanje dok je aktivan i obraditi odbijanje bez uticaja na aplikaciju. Provera: nepodržan ili odbijen zahtev ne stvara neobrađenu grešku, a ponovljeni klikovi ne šalju nepotrebne zahteve.

5. [ ] **Uvesti ponovljive osnovne provere i uputstvo za pokretanje.** `.eslintrc.json` postoji, ali nema definisanog načina instalacije i pokretanja provere; README ne objašnjava lokalni HTTP server. Testovi oporavka posle neuspelog učitavanja sada postoje i komanda je u README-u. Dodati uputstvo za lokalni HTTP server, ponovljivu proveru sintakse/lint i ciljane testove za pauzu i prečice, pa provere pokretati u CI. Provera: novi saradnik može da pokrene aplikaciju i iste provere prema README-u.
