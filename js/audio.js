// ===========================================================
// AUDIO — sons procéduraux générés par Web Audio API, aucun fichier
// externe : le jeu n'a pas d'accès réseau pour héberger de vrais
// échantillons, et ça évite tout souci de droits sur une bibliothèque
// de sons. Chaque effet est une note ou un bref bruit filtré, pas un
// enregistrement — volontairement simple et léger (rien à charger,
// rien à mettre dans les assets Android).
//
// Le contexte audio n'est créé qu'au premier geste de l'utilisateur
// (tap ou clic) : les navigateurs et WebView Android bloquent toute
// lecture audio avant une interaction explicite, voir demarrerAudio()
// plus bas, appelée depuis input.js et ui.js.
// ===========================================================

let contexteAudio = null;
let noeudMaster = null;
let sourdine = localStorage.getItem('fourmizred_sourdine') === '1';
let musiqueDemarree = false;
let oscillateursAmbiance = [];

const VOLUME_NORMAL = 0.5;

function assurerContexteAudio() {
  if (contexteAudio) return contexteAudio;
  try {
    contexteAudio = new (window.AudioContext || window.webkitAudioContext)();
    noeudMaster = contexteAudio.createGain();
    noeudMaster.gain.value = sourdine ? 0 : VOLUME_NORMAL;
    noeudMaster.connect(contexteAudio.destination);
  } catch (erreur) {
    console.warn('Audio indisponible :', erreur.message);
  }
  return contexteAudio;
}

// Appelée dès le tout premier geste tactile/souris de la partie
// (voir input.js et ui.js) — initialise le contexte si besoin et
// lance la musique d'ambiance une seule fois.
function demarrerAudio() {
  assurerContexteAudio();
  demarrerMusiqueAmbiance();
}

function basculerSourdine() {
  sourdine = !sourdine;
  localStorage.setItem('fourmizred_sourdine', sourdine ? '1' : '0');
  if (noeudMaster && contexteAudio) {
    noeudMaster.gain.setTargetAtTime(sourdine ? 0 : VOLUME_NORMAL, contexteAudio.currentTime, 0.05);
  }
  return sourdine;
}

function estEnSourdine() {
  return sourdine;
}

// ---------------------------------------------------------
// BRIQUES DE BASE
// ---------------------------------------------------------

// Une note courte : oscillateur + enveloppe d'amplitude. Sert de base
// à la plupart des effets ci-dessous.
function jouerNote(frequence, duree, type, volume) {
  const ctxA = assurerContexteAudio();
  if (!ctxA) return;
  const osc = ctxA.createOscillator();
  const gain = ctxA.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = frequence;
  gain.gain.setValueAtTime(0, ctxA.currentTime);
  gain.gain.linearRampToValueAtTime(volume || 0.3, ctxA.currentTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, ctxA.currentTime + duree);
  osc.connect(gain);
  gain.connect(noeudMaster);
  osc.start();
  osc.stop(ctxA.currentTime + duree + 0.02);
}

// Un bref bruit filtré (pas une note) — plus organique qu'un
// oscillateur pour un "coup" ou un impact.
function jouerBruit(duree, volume, frequenceFiltre) {
  const ctxA = assurerContexteAudio();
  if (!ctxA) return;
  const buffer = ctxA.createBuffer(1, Math.ceil(ctxA.sampleRate * duree), ctxA.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);

  const source = ctxA.createBufferSource();
  source.buffer = buffer;
  const filtre = ctxA.createBiquadFilter();
  filtre.type = 'lowpass';
  filtre.frequency.value = frequenceFiltre || 1800;
  const gain = ctxA.createGain();
  gain.gain.value = volume || 0.18;

  source.connect(filtre);
  filtre.connect(gain);
  gain.connect(noeudMaster);
  source.start();
}

// ---------------------------------------------------------
// EFFETS DU JEU
// ---------------------------------------------------------
function jouerClic() {
  jouerNote(700, 0.05, 'square', 0.1);
}

function jouerImpact() {
  jouerBruit(0.08, 0.16, 1600);
}

function jouerProduction() {
  jouerNote(420, 0.12, 'triangle', 0.15);
  setTimeout(() => jouerNote(560, 0.12, 'triangle', 0.13), 70);
}

function jouerAlerteAttaque() {
  jouerNote(220, 0.22, 'sawtooth', 0.17);
  setTimeout(() => jouerNote(180, 0.25, 'sawtooth', 0.15), 140);
}

function jouerPromotion() {
  jouerNote(500, 0.1, 'sine', 0.14);
  setTimeout(() => jouerNote(750, 0.15, 'sine', 0.14), 90);
}

function jouerSuperarme() {
  jouerBruit(0.4, 0.22, 900);
  jouerNote(90, 0.5, 'sawtooth', 0.15);
}

function jouerVictoire() {
  [520, 660, 780, 1040].forEach((f, i) => setTimeout(() => jouerNote(f, 0.3, 'triangle', 0.18), i * 110));
}

function jouerDefaite() {
  [300, 260, 200, 150].forEach((f, i) => setTimeout(() => jouerNote(f, 0.35, 'sawtooth', 0.15), i * 130));
}

// ---------------------------------------------------------
// MUSIQUE D'AMBIANCE — nappe générative minimale (trois oscillateurs
// légèrement désaccordés, volume très bas), juste pour ne pas laisser
// un silence total pendant la partie. Démarrée une seule fois.
// ---------------------------------------------------------
function demarrerMusiqueAmbiance() {
  const ctxA = assurerContexteAudio();
  if (!ctxA || musiqueDemarree) return;
  musiqueDemarree = true;

  const gainAmbiance = ctxA.createGain();
  gainAmbiance.gain.value = 0.05;
  gainAmbiance.connect(noeudMaster);

  for (const f of [110, 110.7, 164.8]) {
    const osc = ctxA.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    osc.connect(gainAmbiance);
    osc.start();
    oscillateursAmbiance.push(osc);
  }
}
