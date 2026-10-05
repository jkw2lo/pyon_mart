import { words as w } from './data/words.js';
import { allWords, shown } from './label.js';
import { logoBadge } from './logo.js';

// Words that only appear in the UI still count toward the word book.
const uiWords = [w.irasshaimase, w.atatamemasuka, w.fukuro, w.pointCard, w.arigato, w.goukei, w.hai, w.daijobu, w.ryoshusho, w.zeikomi, w.cashless, w.keihin];
for (const word of uiWords) allWords.set(word.jp, word);
const store = { jp: '月見通り店', kana: 'つきみどおりてん', romaji: 'tsukimi-dōri ten', en: 'Tsukimi Street branch' };
allWords.set(store.jp, store);
const pyonSan = { jp: 'ぴょんさん', kana: 'ぴょんさん', romaji: 'pyon-san', en: 'Pyon-san, the clerk (〜さん is a polite name suffix)' };
allWords.set(pyonSan.jp, pyonSan);
const bagWord = { jp: 'レジ袋', kana: 'れじぶくろ', romaji: 'reji-bukuro', en: 'plastic shopping bag' };
allWords.set(bagWord.jp, bagWord);

// A hoverable bit of Japanese inside HTML.
export const jp = (word) => `<span class="jpw" data-jp="${word.jp}">${shown(word)}</span>`;

const $ = (s) => document.querySelector(s);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function runCheckout(basket, { audio, onDone }) {
  const root = $('#checkout');
  const say = $('#co-say');
  const answers = $('#co-answers');
  const items = $('#r-items');
  const total = $('#r-total');
  const foot = $('.r-foot');
  root.classList.remove('hidden');
  document.querySelector('.co-clerk b').innerHTML = jp(pyonSan);
  $('#r-logo').innerHTML = logoBadge({ size: 42 });
  document.querySelector('.r-head small').innerHTML = `PYON MART · ${jp(store)}`;
  items.innerHTML = '';
  total.innerHTML = '';
  foot.innerHTML = '';

  const speak = (word, en, extra = '') => {
    say.innerHTML = `<span class="big">${jp(word)}${extra}</span><span class="en">${en}</span>`;
  };
  const ask = (options) => new Promise((resolve) => {
    answers.innerHTML = '';
    for (const o of options) {
      const b = document.createElement('button');
      if (o.alt) b.className = 'alt';
      b.innerHTML = `${o.word ? jp(o.word) : o.label}${o.note ? `<small>${o.note}</small>` : ''}`;
      b.onclick = () => { answers.innerHTML = ''; $('#tooltip').classList.add('hidden'); resolve(o.value); };
      answers.appendChild(b);
    }
  });
  const line = (left, right) => items.insertAdjacentHTML('beforeend', `<div class="r-line"><span>${left}</span><span>${right}</span></div>`);

  answers.innerHTML = '';
  speak(w.irasshaimase, 'Welcome! Let me ring those up for you…');
  await wait(700);
  let sum = 0;
  for (const def of basket) {
    line(`<span class="jp">${jp(def.title)}</span>`, `¥${def.price}`);
    sum += def.price;
    audio.beep();
    await wait(380);
  }

  const heatable = basket.some((d) => ['deli', 'onigiri'].includes(d.cat) && d.shape !== 'sandwich');
  if (heatable) {
    speak(w.atatamemasuka, 'Shall I heat it up for you?');
    const heat = await ask([{ word: w.hai, note: 'yes please', value: true }, { word: w.daijobu, note: "no thanks", value: false, alt: true }]);
    if (heat) {
      say.innerHTML = '<span class="en">The microwave hums… ding!</span>';
      await wait(900);
      audio.ding();
      await wait(400);
    }
  }

  speak(w.fukuro, 'Would you like a bag? (¥3)');
  const bag = await ask([{ word: w.hai, note: '+ ¥3', value: true }, { word: w.daijobu, note: "I'm fine", value: false, alt: true }]);
  if (bag) { line(`<span class="jp">${jp(bagWord)}</span>`, '¥3'); sum += 3; audio.beep(); }

  speak(w.pointCard, 'Do you have a point card?');
  await ask([{ word: w.daijobu, note: "no, I'm fine", value: false, alt: true }]);

  total.innerHTML = `<div class="r-line"><span>${jp(w.goukei)} (${jp(w.zeikomi)})</span><span>¥${sum}</span></div>`;
  speak(w.goukei, `That comes to ¥${sum}.`, ` ¥${sum}`);
  await ask([{ word: w.cashless, note: 'pay by card', value: true }]);
  audio.chime(true);
  speak(w.arigato, 'Thank you very much!');
  foot.innerHTML = `${jp(w.keihin)}<br>${new Date().toLocaleDateString('ja-JP')} · ${jp(w.ryoshusho)}`;
  await ask([{ label: 'Leave the counter', value: true }]);
  root.classList.add('hidden');
  onDone(sum);
}
