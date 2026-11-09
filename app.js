const CONFIG = {
  PAYPAL_ME_HANDLE: 'motoguzziclubpisa',
  EVENT_YEAR: 2027,
  BANK_HOLDER: 'Moto Guzzi Club Pisa Aquile Alfee',
  BANK_NAME: 'UniCredit',
  IBAN: 'IT61 U020 0871 1320 0010 7354 780',
  SUBMIT_ENDPOINT: 'https://script.google.com/macros/s/AKfycbxuRFVEwSoR0wTWX0DTWAXGfa7WR2MPkrxyD05zzSqwT6LodJ6T5BH-MZwaQKVeUQ1q/exec',
  ORGANIZER_EMAIL: ''
};

let CLUBS = [];
let PANINI = [];
let BIBITE = [];

async function loadClubs() {
  try {
    const res = await fetch('clubs.txt?v=' + Date.now(), { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    CLUBS = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  } catch (e) {
    console.error('clubs.txt non caricato:', e);
    CLUBS = [];
  }
}

async function loadPanini() {
  try {
    const res = await fetch('panini.txt?v=' + Date.now(), { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    PANINI = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  } catch (e) {
    console.error('panini.txt non caricato:', e);
    PANINI = [];
  }
}

async function loadBibite() {
  try {
    const res = await fetch('bibite.txt?v=' + Date.now(), { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    BIBITE = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  } catch (e) {
    console.error('bibite.txt non caricato:', e);
    BIBITE = [];
  }
}

const MOTOMODELS = {
  "Storiche (1921-1960)": [
    "Normale 500", "Sport (13/14/15)", "GT (Norge, 16, 17)", "GTS", "Alce 500", "Airone 250", 
    "Motoleggera 65 (Guzzino)", "Superalce 500", "Astore 500", "Falcone 500", 
    "Galletto (160/175/192)", "Cardellino 73", "Zigolo (98/110)", "Lodola 175", 
    "Stornello 125", "Dingo (49/50)", "Trotter"
  ],
  "Anni '60 e '70 (1960-1979)": [
    "V7 700", "V7 Special 750", "V7 750 Sport", "850 GT", "850 California", 
    "Nuovo Falcone 500", "2C 4T", "254", "250 TS", "350 GTS", "400 GTS", 
    "V850 Le Mans", "1000 SP", "V50 (1977)", "V35 (1977)", 
    "V1000 Idroconvert", "V1000 G5"
  ],
  "Anni '80 e '90 (1980-1999)": [
    "V50 Monza", "Le Mans III", "California II", "V65", "V35 Custom", 
    "850 T5", "V65 Lario", "Le Mans 1000", "Custom 125", "California III", 
    "1000 GT", "Nevada 350", "Targa 750", "Daytona 1000 IE", "Quota 1000", 
    "Strada 1000", "1100 Sport", "V10 Centauro", "Quota 1100 ES", 
    "V11 / V11 Sport / V11 Le Mans"
  ],
  "Moderne (2000 - oggi)": [
    "Breva 750", "Breva 850", "Breva 1100", "Breva 1200", 
    "Griso 850", "Griso 1100", "Griso 1200 8V", 
    "Norge 850", "Norge 1200", "1200 Sport", 
    "Stelvio 1200", "Stelvio 1200 NTX", "Bellagio 940", 
    "California 1400 Custom", "California 1400 Touring", 
    "Audace", "Eldorado 1400", "MGX-21 Flying Fortress", 
    "V7 (Classic/Stone/Special/Racer)", "V9 Roamer", "V9 Bobber", 
    "V85 TT", "V100 Mandello", "V100 Stelvio", "MGS-01 Corsa"
  ]
};

const PRICES = { base: 25, withShirt: 35, mgwcDiscount: 5, meals: { fri: 20, satPack: 15, satGala: 40, sun: 22 } };
const MEAL_LABELS = { fri: 'Buffet Venerdì', satPack: 'Pranzo al sacco Sabato', satGala: 'Cena di Gala Sabato', sun: 'Pranzo Domenica' };
let currentTotal = 25, submitting = false, paymentMethod = 'paypal';
let reviewOrder = null;
const $ = (id) => document.getElementById(id);
const titleCase = (t) => t.trim().toLowerCase().replace(/(^|[\s'\-])([a-zà-ÿ])/g, (m, sep, ch) => sep + ch.toUpperCase());
const eur = (n) => n.toFixed(2).replace('.', ',') + ' €';

function showLoading() {
  $('loadingOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function hideLoading() {
  $('loadingOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function populateClubSelect(filter = '') {
  const selectClub = $('pilotClub');
  const currentValue = selectClub.value;
  while (selectClub.options.length > 1) { selectClub.remove(1); }
  const f = (filter || '').toString().toLowerCase().trim();
  const filtered = f ? CLUBS.filter(function (c) { return c.toLowerCase().indexOf(f) !== -1; }) : CLUBS;

  if (CLUBS.length === 0) {
    const optErr = document.createElement('option');
    optErr.value = ''; optErr.textContent = 'Lista club non disponibile - usa ALTRO per scrivere il nome'; optErr.disabled = true;
    selectClub.appendChild(optErr);
  } else if (filtered.length === 0) {
    const optEmpty = document.createElement('option');
    optEmpty.value = ''; optEmpty.textContent = 'Nessun club trovato per "' + filter + '"'; optEmpty.disabled = true;
    selectClub.appendChild(optEmpty);
  } else {
    filtered.forEach(function (club) {
      const opt = document.createElement('option');
      opt.value = club; opt.textContent = club;
      selectClub.appendChild(opt);
    });
  }
  const optNone = document.createElement('option');
  optNone.value = 'NESSUN CLUB'; optNone.textContent = 'NESSUN CLUB';
  selectClub.appendChild(optNone);
  const optAltro = document.createElement('option');
  optAltro.value = 'ALTRO'; optAltro.textContent = 'ALTRO (specifica)';
  selectClub.appendChild(optAltro);

  if (currentValue) {
    const stillThere = Array.prototype.some.call(selectClub.options, function (o) { return o.value === currentValue; });
    if (stillThere) selectClub.value = currentValue;
  }
}

function populateListSelect(selectId, list) {
  const sel = $(selectId);
  while (sel.options.length > 1) sel.remove(1);
  list.forEach(function (item) {
    const opt = document.createElement('option');
    opt.value = item; opt.textContent = item;
    sel.appendChild(opt);
  });
}

function initMotoModels() {
  const selectMoto = $('pilotMoto');
  for (const [groupName, models] of Object.entries(MOTOMODELS)) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = groupName;
    models.forEach(model => {
      const opt = document.createElement('option');
      opt.value = model; opt.textContent = model;
      optgroup.appendChild(opt);
    });
    selectMoto.appendChild(optgroup);
  }
  const optMotoAltro = document.createElement('option');
  optMotoAltro.value = 'ALTRO'; optMotoAltro.textContent = 'ALTRO (specifica)';
  selectMoto.appendChild(optMotoAltro);
}

$('pilotClubSearch').addEventListener('input', function () { populateClubSelect(this.value); });

$('pilotClub').addEventListener('change', function () {
  const altroInput = $('pilotClubAltro');
  if (this.value === 'ALTRO') {
    altroInput.classList.remove('hidden');
    altroInput.required = true;
    altroInput.focus();
  } else {
    altroInput.classList.add('hidden');
    altroInput.required = false;
    altroInput.value = '';
  }
  const searchInput = $('pilotClubSearch');
  if (searchInput && searchInput.value) {
    searchInput.value = '';
    populateClubSelect('');
  }
});

$('pilotMoto').addEventListener('change', function() {
  const altroInput = $('pilotMotoAltro');
  if (this.value === 'ALTRO') {
    altroInput.classList.remove('hidden');
    altroInput.required = true;
    altroInput.focus();
  } else {
    altroInput.classList.add('hidden');
    altroInput.required = false;
    altroInput.value = '';
  }
});

function buildPerson(prefix, p) {
  const regValue = parseInt(document.querySelector('input[name="' + p.regName + '"]:checked').value, 10);
  const withShirt = regValue === PRICES.withShirt;
  const isMember = $(p.member).checked;
  const meals = {};
  let total = withShirt ? PRICES.withShirt : PRICES.base;
  const lines = [{ label: withShirt ? 'Iscrizione con maglietta' : 'Iscrizione base', amount: total }];

  let cardValue = null;
  if (isMember) {
    const suffix = $(p.card).value.trim();
    cardValue = '2027' + suffix;
    lines.push({ label: 'Sconto socio MGWC (tessera ' + (cardValue || '—') + ')', amount: -PRICES.mgwcDiscount });
    total -= PRICES.mgwcDiscount;
  }
  if (withShirt) lines[0].label += ' (taglia ' + $(p.shirt).value + ')';

  const satPackOn = $(p.meals.satPack).checked;
  const panino = satPackOn ? $(p.panino).value : '';
  const bibita = satPackOn ? $(p.bibita).value : '';

  Object.keys(PRICES.meals).forEach((k) => {
    const on = $(p.meals[k]).checked; meals[k] = on;
    if (on) { total += PRICES.meals[k]; lines.push({ label: MEAL_LABELS[k], amount: PRICES.meals[k] }); }
  });

  const surname = titleCase($(p.surname).value);
  const firstName = titleCase($(p.first).value);
  return {
    surname: surname, firstName: firstName, name: (firstName + ' ' + surname).trim(),
    email: $(p.email).value.trim(), phone: $(p.phone).value.trim(),
    shirtSize: withShirt ? $(p.shirt).value : null,
    mgwcMember: isMember, mgwcCard: cardValue,
    meals: meals, lines: lines, subtotal: total,
    dietary: $(p.dietary).value.trim(),
    panino: panino,
    bibita: bibita,
    frutta: satPackOn ? 'Sì' : ''
  };
}

const PILOT_IDS = { regName: 'regType', shirt: 'shirtSize', member: 'mgwcMember', card: 'mgwcCardNumber', surname: 'pilotSurname', first: 'pilotFirstName', email: 'pilotEmail', phone: 'pilotPhone', dietary: 'pilotDietary', panino: 'pilotPanino', bibita: 'pilotBibita', meals: { fri: 'mealFri', satPack: 'mealSatPack', satGala: 'mealSatGala', sun: 'mealSun' } };
const PASS_IDS = { regName: 'passRegType', shirt: 'passShirtSize', member: 'passMgwcMember', card: 'passMgwcCardNumber', surname: 'passSurname', first: 'passFirstName', email: 'passEmail', phone: 'passPhone', dietary: 'passDietary', panino: 'passPanino', bibita: 'passBibita', meals: { fri: 'passMealFri', satPack: 'passMealSatPack', satGala: 'passMealSatGala', sun: 'passMealSun' } };

function getOrder() {
  const pilot = buildPerson('', PILOT_IDS);
  pilot.city = $('pilotCity').value.trim();
  let clubValue = $('pilotClub').value;
  if (clubValue === 'ALTRO') clubValue = $('pilotClubAltro').value.trim();
  pilot.club = clubValue;
  let motoValue = $('pilotMoto').value;
  if (motoValue === 'ALTRO') motoValue = $('pilotMotoAltro').value.trim();
  pilot.moto = motoValue;

  const hasPassenger = $('hasPassenger').checked;
  const passenger = hasPassenger ? buildPerson('pass', PASS_IDS) : null;
  const total = Math.max(pilot.subtotal + (passenger ? passenger.subtotal : 0), 0);
  return { pilot: pilot, passenger: passenger, total: total, currency: 'EUR', year: CONFIG.EVENT_YEAR };
}

function setRequired(id, on) { const el = $(id); if (on) el.setAttribute('required', 'true'); else el.removeAttribute('required'); }
function toggle(id, show) { $(id).classList.toggle('hidden', !show); }

function renumberSections() {
  var sections = document.querySelectorAll('.section');
  var n = 0;
  sections.forEach(function (section) {
    if (section.classList.contains('hidden')) return;
    n++;
    var numEl = section.querySelector('.section-num');
    if (numEl) numEl.textContent = (n < 10 ? '0' : '') + n;
  });
}

function resetPassengerFields() {
  ['passSurname','passFirstName','passEmail','passPhone','passMgwcCardNumber','passDietary','passPanino','passBibita'].forEach((id) => { $(id).value = ''; });
  ['passMgwcMember','passMealFri','passMealSatPack','passMealSatGala','passMealSun'].forEach((id) => { $(id).checked = false; });
  document.querySelector('input[name="passRegType"][value="25"]').checked = true;
  $('passShirtSize').value = 'M';
}
function onPassengerToggle() { if (!$('hasPassenger').checked) resetPassengerFields(); updateTotal(); }

function updateTotal() {
  const pilotShirt = document.querySelector('input[name="regType"]:checked').value === String(PRICES.withShirt);
  toggle('shirtSizeContainer', pilotShirt);
  const pilotMember = $('mgwcMember').checked;
  toggle('mgwcCardContainer', pilotMember);
  setRequired('mgwcCardNumber', pilotMember);
  if (!pilotMember) $('mgwcCardNumber').value = '';

  const pilotSatPack = $('mealSatPack').checked;
  toggle('pilotSatPackDetails', pilotSatPack);
  setRequired('pilotPanino', pilotSatPack);
  setRequired('pilotBibita', pilotSatPack);
  if (!pilotSatPack) { $('pilotPanino').value = ''; $('pilotBibita').value = ''; }

  const hasPassenger = $('hasPassenger').checked;
  toggle('passengerContainer', hasPassenger);
  toggle('passengerRegContainer', hasPassenger);
  toggle('passengerMealsContainer', hasPassenger);
  setRequired('passSurname', hasPassenger);
  setRequired('passFirstName', hasPassenger);

  const passShirt = hasPassenger && document.querySelector('input[name="passRegType"]:checked').value === String(PRICES.withShirt);
  toggle('passShirtSizeContainer', passShirt);

  const passMember = hasPassenger && $('passMgwcMember').checked;
  toggle('passMgwcCardContainer', passMember);
  setRequired('passMgwcCardNumber', passMember);
  if (!passMember) $('passMgwcCardNumber').value = '';

  const passSatPack = hasPassenger && $('passMealSatPack').checked;
  toggle('passSatPackDetails', passSatPack);
  setRequired('passPanino', passSatPack);
  setRequired('passBibita', passSatPack);
  if (!passSatPack) { $('passPanino').value = ''; $('passBibita').value = ''; }

  const order = getOrder();
  currentTotal = order.total;
  $('totalDisplay').innerText = eur(order.total);

  const list = $('summaryList');
  list.innerHTML = '';
  const addGroup = (title, person) => {
    const head = document.createElement('li');
    head.className = 'summary-group-title';
    head.textContent = title;
    list.appendChild(head);
    person.lines.forEach((l) => {
      const li = document.createElement('li');
      const a = document.createElement('span'); a.textContent = l.label;
      const b = document.createElement('span'); b.textContent = (l.amount < 0 ? '-' : '') + eur(Math.abs(l.amount));
      li.appendChild(a); li.appendChild(b);
      list.appendChild(li);
    });
  };
  addGroup('Pilota', order.pilot);
  if (order.passenger) addGroup('Passeggero', order.passenger);
  updateCausale();
  renumberSections();
}

function causaleText() { return 'Raduno Pisa ' + CONFIG.EVENT_YEAR; }
function updateCausale() { $('causaleValue').textContent = causaleText(); }

function setPaymentMethod(method) {
  paymentMethod = method;
  $('btnPaypal').classList.toggle('is-active', method === 'paypal');
  $('btnBank').classList.toggle('is-active', method === 'bank');
  toggle('paypalContainer', method === 'paypal');
  toggle('bankContainer', method === 'bank');
}

function copyIban() {
  const text = $('ibanValue').innerText;
  const done = () => { $('copyBtnText').innerText = 'Copiato'; setTimeout(() => { $('copyBtnText').innerText = 'Copia IBAN'; }, 2000); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(fallbackCopy);
  } else { fallbackCopy(); }
  function fallbackCopy() {
    const ta = document.createElement('textarea'); ta.value = text;
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta); done();
  }
}

function validateForm() {
  const form = $('rallyForm');
  if (!form.reportValidity()) return false;
  const clubSelect = $('pilotClub');
  if (!clubSelect.value) { alert('Seleziona il tuo Club di Appartenenza.'); clubSelect.focus(); return false; }
  if (clubSelect.value === 'ALTRO' && !$('pilotClubAltro').value.trim()) { alert('Inserisci il nome del tuo club.'); $('pilotClubAltro').focus(); return false; }

  const motoSelect = $('pilotMoto');
  if (!motoSelect.value) { alert('Seleziona il tuo modello di Moto Guzzi.'); motoSelect.focus(); return false; }
  if (motoSelect.value === 'ALTRO' && !$('pilotMotoAltro').value.trim()) { alert('Inserisci il modello della tua moto.'); $('pilotMotoAltro').focus(); return false; }

  if ($('mgwcMember').checked) {
    const cardNum = $('mgwcCardNumber').value.trim();
    if (cardNum.length !== 4 || isNaN(cardNum)) { alert('Inserisci le 4 cifre finali della tessera MGWC.'); $('mgwcCardNumber').focus(); return false; }
  }
  if ($('hasPassenger').checked) {
    if ($('passMgwcMember').checked) {
      const passCardNum = $('passMgwcCardNumber').value.trim();
      if (passCardNum.length !== 4 || isNaN(passCardNum)) { alert('Inserisci le 4 cifre finali della tessera MGWC del passeggero.'); $('passMgwcCardNumber').focus(); return false; }
    }
    const missing = !$('passSurname').value.trim() ? 'passSurname' : (!$('passFirstName').value.trim() ? 'passFirstName' : null);
    if (missing) { $(missing).focus(); return false; }
  }
  if (!$('pilotSurname').value.trim()) { $('pilotSurname').focus(); return false; }
  if (!$('pilotFirstName').value.trim()) { $('pilotFirstName').focus(); return false; }
  return true;
}

async function sendRegistration(order, payment) {
  const payload = { submittedAt: new Date().toISOString(), event: 'Raduno Aquile Alfee ' + CONFIG.EVENT_YEAR, order: order, payment: payment };
  if (CONFIG.SUBMIT_ENDPOINT) {
    try {
      const res = await fetch(CONFIG.SUBMIT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      let responseData = {};
      try { responseData = await res.json(); } catch (e) { responseData = { ok: true }; }
      if (responseData.ok === false) {
        return { ok: false, mode: 'endpoint', error: responseData.error || 'UNKNOWN', message: responseData.message || 'Errore sconosciuto. Contatta l\'organizzazione.' };
      }
      return { ok: true, mode: 'endpoint' };
    } catch (e) {
      return { ok: false, mode: 'endpoint', error: 'NETWORK', message: 'Errore di connessione. Controlla la rete e riprova.' };
    }
  }
  return { ok: true, mode: 'none' };
}

function showSuccess(order, payment, sendResult) {
  $('rallyForm').classList.add('hidden');
  $('successBox').classList.remove('hidden');
  const box = $('successDetails'); box.innerHTML = '';
  const add = (text, cls) => { const d = document.createElement('div'); if (cls) d.className = cls; d.textContent = text; box.appendChild(d); };
  const addPerson = (title, p) => {
    add(title + ': ' + p.name, 'font-bold pt-2');
    if (p.email) add('Email: ' + p.email);
    if (p.phone) add('Telefono: ' + p.phone);
    if (title === 'Pilota' && p.moto) add('Moto: ' + p.moto);
    p.lines.forEach((l) => add('• ' + l.label + ': ' + (l.amount < 0 ? '-' : '') + eur(Math.abs(l.amount))));
    if (p.panino) add('• Pranzo al sacco: ' + p.panino + ' + ' + p.bibita + ' + Frutta e Dolce');
  };
  addPerson('Pilota', order.pilot);
  if (order.passenger) addPerson('Passeggero', order.passenger);
  add('Totale: ' + eur(order.total), 'font-bold text-lg pt-3');
  add('Metodo scelto: ' + payment.method, 'pt-1');
  if (payment.method === 'Bonifico bancario') {
    add('IBAN: ' + CONFIG.IBAN, 'mt-2');
    add('Causale: ' + causaleText());
  } else if (payment.method === 'PayPal') {
    const a = document.createElement('a');
    a.href = payment.url; a.target = '_blank'; a.rel = 'noopener';
    a.className = 'inline-block mt-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-4 py-2 rounded';
    a.textContent = 'Apri PayPal e completa il pagamento';
    box.appendChild(a);
  }
  const note = $('successNote');
  if (!sendResult.ok) {
    note.textContent = 'Attenzione: non siamo riusciti a trasmettere i dati. Salva questo riepilogo e contattaci.';
    note.classList.remove('hidden');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openReviewModal() {
  $('bankError').classList.add('hidden');
  $('paypalError').classList.add('hidden');
  if (!validateForm()) return;
  const order = getOrder();
  reviewOrder = order;
  const box = $('reviewContent');
  box.innerHTML = '';

  const renderPerson = (title, p, extraFields) => {
    const div = document.createElement('div');
    div.className = 'bg-gray-50 p-4 border border-neutral-200';
    let html = `<h3 class="text-lg font-bold mb-3 border-b border-neutral-300 pb-2" style="color: var(--red); text-transform: uppercase; letter-spacing: 0.03em; font-family: 'Barlow Condensed', sans-serif;">${title}</h3>`;
    html += `<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">`;
    html += `<div><span class="text-xs uppercase tracking-wide text-neutral-500 font-semibold">Nome</span><p class="font-semibold mt-0.5">${p.name}</p></div>`;
    html += `<div><span class="text-xs uppercase tracking-wide text-neutral-500 font-semibold">Email</span><p class="font-semibold mt-0.5 break-all">${p.email || '-'}</p></div>`;
    html += `<div><span class="text-xs uppercase tracking-wide text-neutral-500 font-semibold">Telefono</span><p class="font-semibold mt-0.5">${p.phone || '-'}</p></div>`;
    if (extraFields) extraFields.forEach(f => {
      html += `<div><span class="text-xs uppercase tracking-wide text-neutral-500 font-semibold">${f.label}</span><p class="font-semibold mt-0.5">${f.value || '-'}</p></div>`;
    });
    html += `</div>`;
    html += `<div class="mt-4 pt-3 border-t border-neutral-300">`;
    html += `<p class="text-xs uppercase tracking-wide text-neutral-500 font-semibold mb-2">Dettaglio Iscrizione</p>`;
    p.lines.forEach(l => {
      html += `<div class="flex justify-between text-sm py-1"><span>${l.label}</span><span class="font-semibold">${(l.amount < 0 ? '-' : '') + eur(Math.abs(l.amount))}</span></div>`;
    });
    const mealsOn = Object.keys(p.meals).filter(k => p.meals[k]);
    if (mealsOn.length > 0) {
      html += `<p class="text-xs uppercase tracking-wide text-neutral-500 font-semibold mt-3 mb-1">Pasti Prenotati</p>`;
      html += `<p class="text-sm">${mealsOn.map(k => MEAL_LABELS[k]).join(', ')}</p>`;
    }
    if (p.panino || p.bibita) {
      html += `<div class="mt-3 p-3 text-sm" style="background: #fef3c7; border: 1px solid #fcd34d;">`;
      html += `<p class="font-semibold" style="margin: 0 0 0.25rem 0;">Pranzo al sacco Sabato</p>`;
      html += `<p style="margin: 0;">Panino: <strong>${p.panino || '-'}</strong></p>`;
      html += `<p style="margin: 0;">Bibita: <strong>${p.bibita || '-'}</strong></p>`;
      html += `<p style="margin: 0;">Frutta e Dolce: <strong>inclusi</strong></p>`;
      html += `</div>`;
    }
    if (p.dietary) {
      html += `<p class="text-xs uppercase tracking-wide text-neutral-500 font-semibold mt-3 mb-1">Intolleranze / Esigenze</p>`;
      html += `<p class="text-sm bg-amber-50 border border-amber-200 p-2">${p.dietary}</p>`;
    }
    html += `<div class="flex justify-between text-base font-bold mt-3 pt-3 border-t border-neutral-300" style="color: var(--red);"><span>Subtotale</span><span>${eur(p.subtotal)}</span></div>`;
    html += `</div>`;
    div.innerHTML = html;
    box.appendChild(div);
  };

  renderPerson('Pilota', order.pilot, [
    { label: 'Città', value: order.pilot.city },
    { label: 'Club', value: order.pilot.club },
    { label: 'Moto', value: order.pilot.moto }
  ]);
  if (order.passenger) renderPerson('Passeggero', order.passenger, null);

  const totalDiv = document.createElement('div');
  totalDiv.style.background = '#0a0a0a';
  totalDiv.style.borderLeft = '4px solid var(--red)';
  totalDiv.style.padding = '1.5rem';
  totalDiv.style.textAlign = 'center';
  const methodLabel = paymentMethod === 'paypal' ? 'PayPal' : 'Bonifico Bancario';
  totalDiv.innerHTML = `
    <p style="color: #a3a3a3; font-size: 0.6875rem; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 700; margin: 0;">Totale da pagare</p>
    <p style="color: #ffffff; font-family: 'Barlow Condensed', sans-serif; font-size: 2.75rem; font-weight: 700; line-height: 1; margin: 0.5rem 0; letter-spacing: -0.02em;">${eur(order.total)}</p>
    <p style="color: #a3a3a3; font-size: 0.875rem; margin: 0;">Metodo: <strong style="color: #fff;">${methodLabel}</strong></p>
  `;
  box.appendChild(totalDiv);

  if (paymentMethod === 'bank') {
    const ibanDiv = document.createElement('div');
    ibanDiv.className = 'bg-blue-50 border border-blue-200 p-4 text-sm';
    ibanDiv.innerHTML = `
      <p class="font-bold text-blue-900 mb-2" style="font-family: 'Barlow Condensed', sans-serif; text-transform: uppercase; letter-spacing: 0.05em;">Coordinate Bancarie</p>
      <p class="text-blue-900"><strong>Intestatario:</strong> ${CONFIG.BANK_HOLDER}</p>
      <p class="text-blue-900"><strong>IBAN:</strong> <span class="font-mono">${CONFIG.IBAN}</span></p>
      <p class="text-blue-900"><strong>Causale:</strong> Raduno Pisa ${CONFIG.EVENT_YEAR}</p>
    `;
    box.appendChild(ibanDiv);
  }

  if (!$('privacyConsent').checked) {
    const warn = document.createElement('div');
    warn.className = 'bg-amber-50 border border-amber-300 p-3 text-sm text-amber-800';
    warn.innerHTML = 'Devi accettare l\'informativa privacy prima di inviare.';
    box.appendChild(warn);
  }

  $('reviewModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeReviewModal() {
  $('reviewModal').classList.add('hidden');
  document.body.style.overflow = '';
  reviewOrder = null;
}

async function proceedWithPayment() {
  if (!$('privacyConsent').checked) { alert('Devi accettare l\'informativa privacy per procedere.'); return; }
  if (!reviewOrder) return;
  $('reviewModal').classList.add('hidden');
  document.body.style.overflow = '';
  showLoading();
  if (paymentMethod === 'paypal') await submitPaypalFlow();
  else await submitBankFlow();
}

function showErrorModal(message) {
  var title = 'Errore';
  var msg = message || 'Non è stato possibile completare l\'iscrizione.';
  if (msg.indexOf('già iscritto') !== -1 || msg.indexOf('DUPLICATE') !== -1) { title = 'Iscrizione Già Registrata'; }
  else if (msg.indexOf('connessione') !== -1 || msg.indexOf('rete') !== -1) { title = 'Errore di Connessione'; }
  else if (msg.indexOf('server') !== -1) { title = 'Errore del Server'; }
  var titleEl = document.getElementById('errorModalTitle');
  if (titleEl) titleEl.textContent = title;
  $('errorModalMessage').textContent = msg;
  $('errorModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeErrorModal() {
  $('errorModal').classList.add('hidden');
  document.body.style.overflow = '';
}

function paypalUrl(total) { return 'https://www.paypal.me/' + encodeURIComponent(CONFIG.PAYPAL_ME_HANDLE) + '/' + total.toFixed(2) + 'EUR'; }

async function submitPaypalFlow() {
  if (submitting) return;
  submitting = true;
  $('paypalError').classList.add('hidden');
  const order = reviewOrder;
  const url = paypalUrl(order.total);
  const payment = { method: 'PayPal', transactionId: null, status: 'in attesa di pagamento', url: url };
  const result = await sendRegistration(order, payment);
  hideLoading();
  if (!result.ok) { submitting = false; reviewOrder = null; showErrorModal(result.message); return; }
  window.open(url, '_blank', 'noopener');
  reviewOrder = null;
  showSuccess(order, payment, result);
  submitting = false;
}

async function submitBankFlow() {
  if (submitting || !reviewOrder) return;
  submitting = true;
  $('bankError').classList.add('hidden');
  const order = reviewOrder;
  const payment = { method: 'Bonifico bancario', transactionId: null, status: 'in attesa di pagamento' };
  const result = await sendRegistration(order, payment);
  hideLoading();
  if (!result.ok) { submitting = false; reviewOrder = null; showErrorModal(result.message); return; }
  reviewOrder = null;
  showSuccess(order, payment, result);
  submitting = false;
}

(async function init() {
  $('bankHolder').textContent = CONFIG.BANK_HOLDER;
  $('bankName').textContent = CONFIG.BANK_NAME;
  $('ibanValue').textContent = CONFIG.IBAN;

  await Promise.all([loadClubs(), loadPanini(), loadBibite()]);
  populateClubSelect();
  initMotoModels();
  populateListSelect('pilotPanino', PANINI);
  populateListSelect('pilotBibita', BIBITE);
  populateListSelect('passPanino', PANINI);
  populateListSelect('passBibita', BIBITE);

  updateTotal();
})();
