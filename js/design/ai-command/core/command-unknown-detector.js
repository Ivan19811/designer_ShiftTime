import { loadAiCommandBundle } from './manifest-loader.js';
import { dedupeBy, splitTokens } from './command-utils.js';

const EXTRA_KNOWN_WORDS = [
  'на','в','у','і','й','та','а','або','чи','для','по','з','зі','із','до','від','під','над','між','біля','коло','без','через','при','після','перед',
  'тільки','лише','саме','просто','дуже','трохи','трішки','чуть','будь','ласка','будь-ласка',
  'вправо','вліво','праворуч','ліворуч','вгору','вниз','догори','донизу','вверх','низ','право','ліво','центр','посередині','всередині','зовні',
  'цей','ця','це','ці','цю','цій','того','тому','ту','той','тієї','цього','цьому','його','її','їх','йому','неї',
  'один','одна','одне','два','дві','три','чотири',"п'ять",'пять','шість','сім','вісім',"дев'ять",'девять','десять',
  'plus','minus','auto','default','hover','active','focus','desktop','mobile','tablet','версія','версії','версію','мобільна','мобільний','мобільній','мобільну','мобільного','мобільному',
  'px','піксель','пікселя','пікселів','пікселі','пікселях','пікс','rem','em','deg','градус','градуса','градусів','градуси','відсотків','відсотка','відсоток','percent','ногами','дригом','переверни','перекинь','поверни','розверни','оберни','крути','крутань','перекрути','прокрути','завали','віддзеркаль','дзеркаль','дзеркально','фліпни','відобрази','правіше','лівіше','вище','нижче','підсунь','пересунь','зсунь','підвинь','кинь','притисни','прижми','центру','краю','горизонталі','вертикалі','ліворуч','праворуч','розтягни','розшир','стисни','звузь','ширину','ширина','висоту','висота','висоті','ширше','вужче','вищим','нижчим','авто','мяку','мякий','неонову','неонова','неоновий','неоновим','також','заголовки','чорними','синіми','білими','абзац','абзаці','абзацу','літерами','літери','літер','буквами','букви','букв','капсом','капс','великими','маленькими','правому','лівому','ширині','міжрядковий','інтервал','заголовку','обводку','контур','жирнішим','тоншим','чорний','чорним','чорними',
  'красивіше','красивий','красивим','гарніший','гарніше','гарний','гарним','акуратніше','акуратний','акуратним','охайно','охайний',
  'сучасніше','сучасний','сучасним','стильніше','стильний','стильним','оригінально','оригінальний','оригінальним','креативно','креативний',
  'преміальніше','преміальний','преміальним','дизайн','вигляд','оформлення','тема','темою','теми','сайту','стилі','стиль','спробуй','попробуй','перегенеруй','згенеруй','перероби','знову','ще','раз','варіант','варіанти','minimal','premium','modern','clean','accent','focused',
  'активного','активний','активне','активному','активна','який','яка','яке','які','буде','будуть','бути','узгоджуватись','узгоджуватися','узгоджений','узгоджено','узгодження'
];

const PHRASE_SEEDS = ['label', 'aliases', 'id', 'normalizedTo', 'base', 'forms', 'wrong', 'correct', 'from', 'to'];

function addWords(set, value){
  const raw = String(value || '').toLowerCase();
  for (const token of splitTokens(raw)) {
    const safe = String(token || '').toLowerCase();
    if (!safe) continue;
    if (/^\d/.test(safe)) continue;
    if (safe.length <= 1) continue;
    set.add(safe);
  }
}

function walkTerms(set, node){
  if (!node) return;
  if (Array.isArray(node)) {
    for (const item of node) walkTerms(set, item);
    return;
  }
  if (typeof node === 'string' || typeof node === 'number') {
    addWords(set, node);
    return;
  }
  if (typeof node !== 'object') return;
  for (const key of PHRASE_SEEDS) {
    if (key in node) walkTerms(set, node[key]);
  }
}

let VOCAB_PROMISE = null;
async function loadKnownVocabulary(){
  if (VOCAB_PROMISE) return VOCAB_PROMISE;
  VOCAB_PROMISE = (async () => {
    const bundle = await loadAiCommandBundle();
    const known = new Set(EXTRA_KNOWN_WORDS.map((w) => String(w).toLowerCase()));
    for (const key of Object.keys(bundle || {})) walkTerms(known, bundle[key]);
    return known;
  })();
  return VOCAB_PROMISE;
}

function isUsefulWord(token){
  const safe = String(token || '').toLowerCase();
  if (!safe) return false;
  if (/^\d/.test(safe)) return false;
  if (safe.length < 3) return false;
  if (!/[\p{L}]/u.test(safe)) return false;
  return true;
}

function cleanPhrase(value){
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function collectPhrase(text, parts){
  const phrase = cleanPhrase(parts.join(' '));
  if (!phrase) return null;
  return text.includes(phrase) ? phrase : phrase;
}

export async function detectUnknownLanguage(ctx = {}){
  const known = await loadKnownVocabulary();
  const normalizedText = String(ctx?.normalizedText || '');
  const tokenItems = Array.isArray(ctx?.tokens) ? ctx.tokens : [];
  const unknownTokens = [];
  for (const item of tokenItems) {
    const lower = String(item?.lower || item?.value || '').toLowerCase();
    if (!isUsefulWord(lower)) continue;
    if (known.has(lower)) continue;
    unknownTokens.push({ token: lower, index: Number(item?.index || 0) });
  }

  const phrases = [];
  const demonstrativeRe = /\b(цей|ця|це|ці|цю|того|ту|той|цього|цьому)\s+([\p{L}_-]{3,})\b/giu;
  let m;
  while ((m = demonstrativeRe.exec(normalizedText))) {
    const noun = String(m[2] || '').toLowerCase();
    if (known.has(noun)) continue;
    const phrase = collectPhrase(normalizedText, [m[1], noun]);
    if (phrase) phrases.push({ phrase, index: Number(m.index || 0) });
  }

  const quantityRe = /\b(\d+|один|одна|одне|два|дві|три|чотири|п'ять|пять|шість|сім|вісім|дев'ять|девять|десять)\s+([\p{L}_-]{3,})(?:\s+([\p{L}_-]{3,}))?/giu;
  while ((m = quantityRe.exec(normalizedText))) {
    const a = String(m[2] || '').toLowerCase();
    const b = String(m[3] || '').toLowerCase();
    const unknownParts = [a, b].filter((part) => part && !known.has(part));
    if (!unknownParts.length) continue;
    const phrase = collectPhrase(normalizedText, [m[1], a, b && !known.has(b) ? b : ''].filter(Boolean));
    if (phrase) phrases.push({ phrase, index: Number(m.index || 0) });
  }

  const softAdverbRe = /\b(чуть|трохи|трішки)\s+(цей|ця|це|ці|цю|ту|той)\s+([\p{L}_-]{3,})\b/giu;
  while ((m = softAdverbRe.exec(normalizedText))) {
    const noun = String(m[3] || '').toLowerCase();
    if (known.has(noun)) continue;
    const phrase = collectPhrase(normalizedText, [m[1], m[2], noun]);
    if (phrase) phrases.push({ phrase, index: Number(m.index || 0) });
  }


  const quantityWords = new Set(['один','одна','одне','два','дві','три','чотири',"п'ять",'пять','шість','сім','вісім',"дев'ять",'девять','десять']);
  const demonstratives = new Set(['цей','ця','це','ці','цю','того','ту','той','цього','цьому']);
  const softAdverbs = new Set(['чуть','трохи','трішки']);
  const tokenWords = tokenItems.map((item) => String(item?.lower || item?.value || '').toLowerCase());
  for (let i = 0; i < tokenWords.length; i += 1) {
    const cur = tokenWords[i] || '';
    const next = tokenWords[i + 1] || '';
    const next2 = tokenWords[i + 2] || '';
    if (quantityWords.has(cur) && next && !known.has(next)) {
      phrases.push({ phrase: collectPhrase(normalizedText, [cur, next]), index: i });
    }
    if (demonstratives.has(cur) && next && !known.has(next)) {
      phrases.push({ phrase: collectPhrase(normalizedText, [cur, next]), index: i });
    }
    if (softAdverbs.has(cur) && demonstratives.has(next) && next2 && !known.has(next2)) {
      phrases.push({ phrase: collectPhrase(normalizedText, [next, next2]), index: i });
    }
  }

  const uniqueUnknownTokens = dedupeBy(unknownTokens, (item) => item.token).map((item) => item.token);
  const uniqueUnknownPhrases = dedupeBy(phrases.sort((a, b) => a.index - b.index), (item) => item.phrase).map((item) => item.phrase);

  return {
    tokens: uniqueUnknownTokens,
    phrases: uniqueUnknownPhrases,
    hasUnknownLanguage: uniqueUnknownPhrases.length > 0 || uniqueUnknownTokens.length >= 2,
  };
}
