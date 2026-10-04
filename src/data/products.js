import { words as w } from './words.js';

// Product catalogue. `shape` picks a 3D builder, `style` picks a label design,
// `art` an illustration from art.js. All brands are fictional.
//
// Store brands share one look (like real konbini private labels):
//   ぴょんセレクト  everyday food & goods — slate band, white hare mark, cream body
//   ぴょんカフェ    coffee drinks — kraft brown band
//   ぴょんスイーツ  desserts — blush pink band
const SEL = { style: 'select', brand: w.pyonSelect };
const CAFE = { style: 'select', brand: w.pyonCafe, band: '#6b4a2e' };
const SWEETS = { style: 'select', brand: w.pyonSweets, band: '#c86a7e' };

export const products = [
  // ===== Drinks: tea & water (PET) ============================================
  { id: 'ryokucha', shape: 'pet', cat: 'drink', price: 140, note: '525ml', style: 'tea', brand: w.tsukimiChaya,
    bg: '#f4f8ee', fg: '#1f5a2c', accent: '#5aa04a', liquid: '#c4cf74', art: 'leaf', artColors: ['#5aa04a', '#2f7a3a'], title: w.ryokucha, sub: w.shizuoka },
  { id: 'koicha', shape: 'pet', cat: 'drink', price: 150, note: '525ml', style: 'tea', brand: w.tsukimiChaya,
    bg: '#1f4a2a', fg: '#f2ecd0', accent: '#c9b26a', liquid: '#8a9a3a', art: 'leaf', artColors: ['#8ac06a', '#c9b26a'], title: w.ryokucha, sub: w.koime },
  { id: 'hojicha', shape: 'pet', cat: 'drink', price: 140, note: '525ml', style: 'tea', brand: w.tsukimiChaya,
    bg: '#f6efe6', fg: '#5b3418', accent: '#a0662e', liquid: '#9c5a26', art: 'tea', artColors: ['#a0662e', '#6a8a3a'], title: w.hojicha, sub: w.kobashii },
  { id: 'genmaicha', shape: 'pet', cat: 'drink', price: 140, note: '525ml', style: 'tea', brand: w.tsukimiChaya,
    bg: '#fbf3dc', fg: '#6a4a10', accent: '#c9a03a', liquid: '#c9a85a', art: 'seeds', artColors: ['#c9a03a', '#6aa04a'], title: w.genmaicha, sub: w.kobashii },
  { id: 'mugicha', shape: 'pet', cat: 'drink', price: 120, note: '600ml', ...SEL,
    bg: '#fbf8f1', fg: '#6a4a0c', accent: '#e0a623', liquid: '#b0702a', art: 'seeds', artColors: ['#d9a23a', '#a0702a'], title: w.mugicha, sub: w.kaffeinZero },
  { id: 'jasmine', shape: 'pet', cat: 'drink', price: 140, note: '500ml', style: 'clean', brand: w.hoshizora,
    bg: '#eef6ec', fg: '#2a6a5a', accent: '#8ac8b0', liquid: '#d8d090', art: 'sparkle', artColors: ['#ffffff'], title: w.jasmine, sub: w.muto },
  { id: 'kocha', shape: 'pet', cat: 'drink', price: 150, note: '500ml', style: 'clean', brand: w.hoshizora,
    bg: '#7a1f2a', fg: '#ffffff', accent: '#e8c27a', liquid: '#8a3a1a', art: 'tea', artColors: ['#e8c27a', '#c9b26a'], title: w.kocha, sub: w.straight },
  { id: 'milktea', shape: 'pet', cat: 'drink', price: 150, note: '500ml', style: 'clean', brand: w.hoshizora,
    bg: '#f3e6d4', fg: '#6a3a1a', accent: '#c48a5a', liquid: '#d9b48a', art: 'tea', artColors: ['#c48a5a', '#8a6a3a'], title: w.milkTea, sub: w.hikaeme },
  { id: 'tennensui', shape: 'pet', cat: 'drink', price: 110, note: '550ml', style: 'clean', brand: w.moriShizuku,
    bg: '#e8f4fb', fg: '#1a5a86', accent: '#62b3e3', liquid: '#e8f6ff', clear: true, art: 'drop', artColors: ['#62b3e3', '#1a5a86'], title: w.tennensui, sub: w.nansui },
  { id: 'tansansui', shape: 'pet', cat: 'drink', price: 100, note: '500ml', ...SEL,
    bg: '#fbf8f1', fg: '#1a6a3a', accent: '#f2d23a', liquid: '#f4fbff', clear: true, art: 'slice', artColors: ['#f2d23a', '#ffffff'], title: w.tansansui, sub: w.remon },
  { id: 'orange', shape: 'pet', cat: 'drink', price: 150, note: '470ml', style: 'pop', brand: w.hoshizora,
    bg: '#ff9a1f', fg: '#ffffff', accent: '#2e8b3e', liquid: '#ffa52a', art: 'slice', artColors: ['#ffb03a', '#fff3c0'], title: w.orange, sub: w.kaju },
  { id: 'ringo', shape: 'pet', cat: 'drink', price: 150, note: '470ml', style: 'pop', brand: w.hoshizora,
    bg: '#d8343a', fg: '#ffffff', accent: '#f6e9a0', liquid: '#f2d27a', art: 'fruit', artColors: ['#ff5a5a', '#3a8a3a'], title: w.ringo, sub: w.kaju },
  { id: 'budo', shape: 'pet', cat: 'drink', price: 150, note: '470ml', style: 'pop', brand: w.hoshizora,
    bg: '#5a2a7a', fg: '#ffffff', accent: '#c8a0e8', liquid: '#6a2a5a', art: 'grape', artColors: ['#9a5ac8', '#5aa04a'], title: w.budo, sub: w.kaju },
  { id: 'sports', shape: 'pet', cat: 'drink', price: 160, note: '500ml', style: 'clean', brand: w.hoshizora,
    bg: '#1d6ad0', fg: '#ffffff', accent: '#ffffff', liquid: '#eaf2ff', clear: true, art: 'drop', artColors: ['#ffffff', '#9ac8ff'], title: w.sportsDrink, sub: w.hiyashite },

  // ===== Drinks: cans ===========================================================
  { id: 'bito', shape: 'can', cat: 'drink', price: 130, note: '185g', size: 'small', style: 'dark', brand: w.yoiboshi,
    bg: '#2a1a12', fg: '#f2d9a8', accent: '#c48a3a', art: 'bean', artColors: ['#7a4a2a', '#2a1a12'], title: w.bito, sub: w.coffee },
  { id: 'black', shape: 'can', cat: 'drink', price: 130, note: '185g', size: 'small', style: 'dark', brand: w.yoiboshi,
    bg: '#111111', fg: '#ffffff', accent: '#b9b9b9', art: 'bean', artColors: ['#5a3a2a', '#111'], title: w.black, sub: w.muto },
  { id: 'milkcoffee', shape: 'can', cat: 'drink', price: 130, note: '185g', size: 'small', style: 'dark', brand: w.yoiboshi,
    bg: '#e8d6b8', fg: '#4a2a12', accent: '#a0662e', art: 'milk', artColors: ['#ffffff'], title: w.milkCoffee, sub: w.coffee },
  { id: 'cafelatte', shape: 'can', cat: 'drink', price: 140, note: '260g', ...CAFE,
    bg: '#f6efe3', fg: '#4a2a12', accent: '#c48a5a', art: 'bean', artColors: ['#8a5a3a', '#3a2010'], title: w.cafeLatte, sub: w.hikaeme },
  { id: 'ramune', shape: 'can', cat: 'drink', price: 140, note: '350ml', style: 'pop', brand: w.hoshizora,
    bg: '#9fd8f2', fg: '#0f4d7a', accent: '#ffffff', art: 'bubbles', artColors: ['#ffffff'], title: w.ramune, sub: w.tansan, badge: w.kikanGentei },
  { id: 'cola', shape: 'can', cat: 'drink', price: 140, note: '350ml', style: 'pop', brand: w.hoshizora,
    bg: '#8a1a1a', fg: '#ffffff', accent: '#ffd23a', art: 'bubbles', artColors: ['#ffffff'], title: w.cola, sub: w.tansan },
  { id: 'melonsoda', shape: 'can', cat: 'drink', price: 140, note: '350ml', style: 'pop', brand: w.hoshizora,
    bg: '#3ac06a', fg: '#ffffff', accent: '#ff5a7a', art: 'bubbles', artColors: ['#ffffff'], title: w.melonSoda, sub: w.tansan },
  { id: 'cider', shape: 'can', cat: 'drink', price: 120, note: '350ml', ...SEL,
    bg: '#fbf8f1', fg: '#1a6a9a', accent: '#62b3e3', art: 'bubbles', artColors: ['#62b3e3'], title: w.cider, sub: w.tansan },
  { id: 'genki', shape: 'can', cat: 'drink', price: 210, note: '355ml', style: 'pop', brand: w.pyonMart,
    bg: '#1b1e5a', fg: '#e8ff3a', accent: '#ff3aa8', art: 'sparkle', artColors: ['#e8ff3a'], title: w.genki, sub: w.tansan, badge: w.shinHatsubai },
  { id: 'beer', shape: 'can', cat: 'drink', price: 228, note: '350ml', style: 'dark', brand: w.getsumen,
    bg: '#c9ccd2', fg: '#1d2a4a', accent: '#c4302b', art: 'can', artColors: ['#f2b81a'], title: w.namaBeer, sub: w.hatachi },
  { id: 'lemonsour', shape: 'can', cat: 'drink', price: 165, note: '350ml', style: 'pop', brand: w.getsumen,
    bg: '#f6e04a', fg: '#1d4a2a', accent: '#2a8a3a', art: 'slice', artColors: ['#f2d23a', '#ffffff'], title: w.lemonSour, sub: w.hatachi },
  { id: 'highball', shape: 'can', cat: 'drink', price: 198, note: '350ml', style: 'dark', brand: w.getsumen,
    bg: '#1d2a4a', fg: '#f2d675', accent: '#f2d675', art: 'can', artColors: ['#e8a83a', '#f6e04a'], title: w.highball, sub: w.toshitsuZero },

  // ===== Drinks: chilled cartons ===============================================
  { id: 'gyunyu', shape: 'carton', cat: 'dairy', price: 168, note: '500ml', style: 'clean', brand: w.shirousagi,
    bg: '#ffffff', fg: '#1d4f9c', accent: '#76b6ea', art: 'milk', artColors: ['#cfe6fa'], title: w.gyunyu, sub: w.hokkaido },
  { id: 'ichigo', shape: 'carton', cat: 'dairy', price: 148, note: '500ml', style: 'clean', brand: w.shirousagi,
    bg: '#ffd9e3', fg: '#c3264f', accent: '#ff7b9c', art: 'strawberry', artColors: ['#e8344f'], title: w.ichigoMilk, sub: w.oishii, badge: w.kikanGentei },
  { id: 'coffeemilk', shape: 'carton', cat: 'dairy', price: 148, note: '500ml', style: 'clean', brand: w.shirousagi,
    bg: '#c89b6d', fg: '#3a2210', accent: '#ffffff', art: 'bean', artColors: ['#6a3a1a', '#3a2010'], title: w.coffeeMilk, sub: w.noko },
  { id: 'cafeaulait', shape: 'carton', cat: 'dairy', price: 158, note: '500ml', ...CAFE,
    bg: '#f6efe3', fg: '#4a2a12', accent: '#c48a5a', art: 'milk', artColors: ['#c89b6d'], title: w.cafeAuLait, sub: w.hikaeme },
  { id: 'tonyu', shape: 'carton', cat: 'dairy', price: 138, note: '500ml', ...SEL,
    bg: '#fbf8f1', fg: '#5a6a1a', accent: '#b8c86a', art: 'seeds', artColors: ['#e8d8a0', '#b8c86a'], title: w.tonyu, sub: w.kokusan },
  { id: 'yogurt', shape: 'carton', cat: 'dairy', price: 158, note: '500ml', style: 'clean', brand: w.shirousagi,
    bg: '#eef4fb', fg: '#2a5aa0', accent: '#ff8aa0', art: 'milk', artColors: ['#ffffff'], title: w.nomuYogurt, sub: w.nameraka },

  // ===== Onigiri ================================================================
  { id: 'tunamayo', shape: 'onigiri', cat: 'onigiri', price: 160, ...SEL, fg: '#1a3a8a', accent: '#f0c419', title: w.tunaMayo, sub: w.temaki },
  { id: 'benishake', shape: 'onigiri', cat: 'onigiri', price: 198, ...SEL, fg: '#c4302b', accent: '#ff8a65', title: w.benishake, sub: w.temaki, badge: w.kokusan },
  { id: 'ume', shape: 'onigiri', cat: 'onigiri', price: 140, ...SEL, fg: '#8e1f4a', accent: '#e05a8a', title: w.ume, sub: w.temaki },
  { id: 'konbu', shape: 'onigiri', cat: 'onigiri', price: 140, ...SEL, fg: '#2d4a1f', accent: '#6a8f3a', title: w.konbu, sub: w.temaki },
  { id: 'mentaiko', shape: 'onigiri', cat: 'onigiri', price: 178, ...SEL, fg: '#d0451b', accent: '#ff9b3a', title: w.mentaiko, sub: w.temaki, badge: w.shinHatsubai },
  { id: 'okaka', shape: 'onigiri', cat: 'onigiri', price: 140, ...SEL, fg: '#7a4a1a', accent: '#c48a3a', title: w.okaka, sub: w.temaki },
  { id: 'sekihan', shape: 'onigiri', cat: 'onigiri', price: 150, ...SEL, fg: '#a3203a', accent: '#d85a6a', title: w.sekihan, sub: w.mochimochi, nori: false, rice: '#d9a0a0' },
  { id: 'shiomusubi', shape: 'onigiri', cat: 'onigiri', price: 120, ...SEL, fg: '#3a4150', accent: '#9aa0a9', title: w.shioMusubi, sub: w.kokusan, nori: false },

  // ===== Sandwiches, bento, desserts ============================================
  { id: 'tamago', shape: 'sandwich', cat: 'deli', price: 298, filling: '#f7dc6a', ...SEL, fg: '#c07a00', accent: '#f2c230', title: w.tamagoSando, sub: w.oishii },
  { id: 'katsu', shape: 'sandwich', cat: 'deli', price: 398, filling: '#b8763a', ...SEL, fg: '#7a3510', accent: '#d9822b', title: w.katsuSando, sub: w.omori, badge: w.shinHatsubai },
  { id: 'mixsando', shape: 'sandwich', cat: 'deli', price: 328, filling: '#7ab84a', ...SEL, fg: '#2a6a2a', accent: '#e8344f', title: w.mixSando, sub: w.oishii },
  { id: 'fruitsando', shape: 'sandwich', cat: 'deli', price: 358, filling: '#ffe8ef', fruit: true, ...SWEETS, fg: '#c3264f', accent: '#ff9ab0', title: w.fruitSando, sub: w.kikanGentei },
  { id: 'karaage', shape: 'bento', cat: 'deli', price: 550, food: 'karaage', ...SEL, fg: '#a3320b', accent: '#e8a23a', title: w.karaageBento, sub: w.atatame },
  { id: 'makunouchi', shape: 'bento', cat: 'deli', price: 598, food: 'makunouchi', ...SEL, fg: '#3a2a1a', accent: '#b5523a', title: w.makunouchi, sub: w.atatame },
  { id: 'noriben', shape: 'bento', cat: 'deli', price: 450, food: 'nori', ...SEL, fg: '#1d2a1f', accent: '#5a7a3a', title: w.noriBento, sub: w.atatame },
  { id: 'yakiniku', shape: 'bento', cat: 'deli', price: 620, food: 'yakiniku', ...SEL, fg: '#7a1a10', accent: '#d0451b', title: w.yakinikuBento, sub: w.omori, badge: w.shinHatsubai },
  { id: 'zarusoba', shape: 'bento', cat: 'deli', price: 430, food: 'soba', ...SEL, fg: '#1d3a5a', accent: '#6a8faf', title: w.zarusoba, sub: w.hiyashite },
  { id: 'napolitan', shape: 'bento', cat: 'deli', price: 480, food: 'pasta', ...SEL, fg: '#c4302b', accent: '#f2a23a', title: w.napolitan, sub: w.atatame },
  { id: 'purin', shape: 'dessert', cat: 'sweets', price: 220, ...SWEETS, fg: '#7a3a10', accent: '#f2c45a', fill: '#f6d47a', top: '#7a3a10', title: w.purin, sub: w.nameraka },
  { id: 'parfait', shape: 'dessert', cat: 'sweets', price: 330, ...SWEETS, fg: '#2f6a2a', accent: '#8ab84a', fill: '#7aa84a', top: '#fff8ee', title: w.matchaParfait, sub: w.kikanGentei },
  { id: 'rollcake', shape: 'tray', cat: 'sweets', price: 260, ...SWEETS, fg: '#a3502a', accent: '#f2c45a', art: 'roll', artColors: ['#f2c27a', '#fff8ee'], title: w.rollCake, sub: w.noko, dims: [0.14, 0.06, 0.08] },
  { id: 'daifuku', shape: 'tray', cat: 'sweets', price: 198, ...SWEETS, fg: '#5a2a2a', accent: '#d8b0b8', art: 'mochi', artColors: ['#f8f2ea', '#5a2a2a'], title: w.daifuku, sub: w.mochimochi, dims: [0.13, 0.05, 0.08] },
  { id: 'shucream', shape: 'bag', cat: 'sweets', price: 160, size: 'small', ...SWEETS, fg: '#a3502a', accent: '#f2c45a', art: 'cookie', artColors: ['#f2c27a', '#fff8ee'], title: w.shuCream, sub: w.noko },

  // ===== Snacks =================================================================
  { id: 'chips-usushio', shape: 'bag', cat: 'snack', price: 158, note: '60g', style: 'pop', brand: w.karikari,
    bg: '#2f6fd0', fg: '#ffffff', accent: '#ffd23a', art: 'chips', artColors: ['#f6d06a'], title: w.potatoChips, sub: w.usushio },
  { id: 'chips-norishio', shape: 'bag', cat: 'snack', price: 158, note: '60g', style: 'pop', brand: w.karikari,
    bg: '#2a8a3a', fg: '#ffffff', accent: '#ffd23a', art: 'chips', artColors: ['#f6d06a', '#1d4a1d'], title: w.potatoChips, sub: w.norishio },
  { id: 'chips-consomme', shape: 'bag', cat: 'snack', price: 158, note: '60g', style: 'pop', brand: w.karikari,
    bg: '#c4302b', fg: '#ffffff', accent: '#ffd23a', art: 'chips', artColors: ['#f6c05a', '#a3320b'], title: w.potatoChips, sub: w.consomme },
  { id: 'chips-select', shape: 'bag', cat: 'snack', price: 128, note: '55g', ...SEL,
    fg: '#3a4150', accent: '#f2d675', art: 'chips', artColors: ['#f6d06a'], title: w.potatoChips, sub: w.shio },
  { id: 'ebisen', shape: 'bag', cat: 'snack', price: 138, note: '85g', style: 'pop', brand: w.karikari,
    bg: '#ff8a3a', fg: '#ffffff', accent: '#c4302b', art: 'shrimp', artColors: ['#ff6a4a'], title: w.ebisen, sub: w.yamerarenai },
  { id: 'kakinotane', shape: 'bag', cat: 'snack', price: 198, note: '120g', ...SEL,
    fg: '#7a2a10', accent: '#c4302b', art: 'seeds', artColors: ['#c4602b', '#e8c27a'], title: w.kakiNoTane, sub: w.pirikara },
  { id: 'senbei', shape: 'bag', cat: 'snack', price: 178, note: '160g', style: 'tea', brand: w.tsukimiChaya,
    bg: '#f2e2c4', fg: '#5a2a10', accent: '#a3502a', art: 'cracker', artColors: ['#c48a3a', '#e8b860', '#1d2a1f'], title: w.senbei, sub: w.shoyu, vertical: false },
  { id: 'popcorn', shape: 'bag', cat: 'snack', price: 148, note: '70g', style: 'pop', brand: w.manmaru,
    bg: '#2a2a6a', fg: '#ffd23a', accent: '#ff5a5a', art: 'popcorn', artColors: ['#ffe8a0', '#c4302b'], title: w.popcorn, sub: w.caramel },
  { id: 'matchachoco', shape: 'box', cat: 'snack', price: 216, dims: [0.13, 0.17, 0.03], style: 'tea', brand: w.tsukimiChaya,
    bg: '#3f6b3a', fg: '#ffffff', accent: '#d8c38a', art: 'choco', artColors: ['#6a9a4a', '#d8c38a'], title: w.matchaChoco, sub: w.kikanGentei },
  { id: 'milkchoco', shape: 'box', cat: 'snack', price: 140, dims: [0.17, 0.08, 0.012], style: 'pop', brand: w.manmaru,
    bg: '#5a2a10', fg: '#ffffff', accent: '#c4302b', art: 'choco', artColors: ['#7a4a2a', '#c4302b'], title: w.milkChoco, sub: w.noko },
  { id: 'almondchoco', shape: 'box', cat: 'snack', price: 238, dims: [0.12, 0.13, 0.035], style: 'pop', brand: w.manmaru,
    bg: '#c9a03a', fg: '#3a1a08', accent: '#5a2a10', art: 'bean', artColors: ['#7a4a2a', '#3a1a08'], title: w.almondChoco, sub: w.sakusaku },
  { id: 'pyonstick', shape: 'box', cat: 'snack', price: 162, dims: [0.075, 0.16, 0.022], ...SEL,
    fg: '#c4202b', accent: '#5a2a10', art: 'sticks', artColors: ['#6a3a1a'], title: w.pyonStick, sub: w.chocolate },
  { id: 'gummy', shape: 'bag', cat: 'snack', price: 128, note: '50g', size: 'small', ...SEL,
    fg: '#d0306a', accent: '#ffb3c6', art: 'gummy', artColors: ['#ff8aa8', '#ffb07a', '#ff6a8a'], title: w.gummy, sub: w.momoAji, badge: w.kikanGentei },
  { id: 'gummy-budo', shape: 'bag', cat: 'snack', price: 128, note: '50g', size: 'small', ...SEL,
    fg: '#6a2a9a', accent: '#c8a0e8', art: 'gummy', artColors: ['#9a5ac8', '#c88ae8', '#7a3aa8'], title: w.gummy, sub: w.budoAji },
  { id: 'nodoame', shape: 'bag', cat: 'snack', price: 198, note: '80g', size: 'small', style: 'clean', brand: w.manmaru,
    bg: '#1d6a5a', fg: '#ffffff', accent: '#9ae0c8', art: 'candy', artColors: ['#7ad0b0', '#f2d23a'], title: w.nodoAme, sub: w.hikaeme },
  { id: 'caramel', shape: 'box', cat: 'snack', price: 120, dims: [0.05, 0.1, 0.022], style: 'pop', brand: w.manmaru,
    bg: '#f2c45a', fg: '#5a2a10', accent: '#c4302b', art: 'candy', artColors: ['#c48a3a', '#e8a85a'], title: w.caramel, sub: w.noko },
  { id: 'cookie', shape: 'box', cat: 'snack', price: 198, dims: [0.15, 0.1, 0.04], ...SEL,
    fg: '#7a4a1a', accent: '#e8c27a', art: 'cookie', artColors: ['#e0b06a', '#6a3a1a'], title: w.cookie, sub: w.butter },
  { id: 'biscuit', shape: 'box', cat: 'snack', price: 168, dims: [0.17, 0.11, 0.035], style: 'clean', brand: w.manmaru,
    bg: '#2a5aa0', fg: '#ffffff', accent: '#f2d675', art: 'cookie', artColors: ['#f2d08a', '#c48a3a'], title: w.biscuit, sub: w.sakusaku },
  { id: 'dango', shape: 'box', cat: 'snack', price: 248, dims: [0.17, 0.07, 0.11], top: true, ...SEL, bg: '#1d2a4a', fg: '#fff6d6', accent: '#f2d675',
    art: 'moon', artColors: ['#f2d675'], title: w.tsukimiDango, sub: w.kikanGentei, band: '#0f1830' },

  // ===== Noodles ================================================================
  { id: 'shoyu', shape: 'cup', cat: 'noodle', price: 214, style: 'pop', brand: w.menya,
    bg: '#ffffff', fg: '#c4202b', accent: '#c4202b', art: 'bowl', artColors: ['#c4202b', '#a0662e'], title: w.shoyu, sub: w.ramen, badge: w.oyuIrete },
  { id: 'miso', shape: 'cup', cat: 'noodle', price: 236, style: 'pop', brand: w.menya,
    bg: '#f2d9a8', fg: '#6a3a10', accent: '#a3320b', art: 'bowl', artColors: ['#6a3a10', '#c48a3a'], title: w.miso, sub: w.ramen, badge: w.oyuIrete },
  { id: 'shio', shape: 'cup', cat: 'noodle', price: 214, style: 'pop', brand: w.menya,
    bg: '#e8f2f8', fg: '#1d4f9c', accent: '#1d4f9c', art: 'bowl', artColors: ['#1d4f9c', '#f2ead0'], title: w.shio, sub: w.ramen, badge: w.oyuIrete },
  { id: 'tonkotsu', shape: 'cup', cat: 'noodle', price: 248, style: 'dark', brand: w.hinode,
    bg: '#1a1a1a', fg: '#ffffff', accent: '#c4302b', art: 'bowl', artColors: ['#c4302b', '#f6ecd8'], title: w.tonkotsu, sub: w.ramen, badge: w.noko },
  { id: 'curryudon', shape: 'cup', cat: 'noodle', price: 214, style: 'pop', brand: w.hinode,
    bg: '#f2c230', fg: '#5a2a10', accent: '#a3320b', art: 'bowl', artColors: ['#a3320b', '#d9922a'], title: w.curryUdon, sub: w.oyuIrete },
  { id: 'kitsune', shape: 'cup', cat: 'noodle', price: 214, style: 'pop', brand: w.hinode,
    bg: '#c4302b', fg: '#ffffff', accent: '#ffd23a', art: 'bowl', artColors: ['#7a1a10', '#d9a85a'], title: w.kitsuneUdon, sub: w.oyuIrete },
  { id: 'tenpura', shape: 'cup', cat: 'noodle', price: 214, style: 'pop', brand: w.hinode,
    bg: '#2a6a3a', fg: '#ffffff', accent: '#f2c45a', art: 'bowl', artColors: ['#1d3a2a', '#6a4a2a'], title: w.tenpuraSoba, sub: w.oyuIrete },
  { id: 'seafood', shape: 'cup', cat: 'noodle', price: 214, ...SEL,
    fg: '#1d4f9c', accent: '#62b3e3', art: 'fish', artColors: ['#62b3e3'], title: w.seafood, sub: w.ramen },
  { id: 'yakisoba', shape: 'box', cat: 'noodle', price: 236, dims: [0.17, 0.06, 0.15], top: true, style: 'pop', brand: w.menya,
    bg: '#ffffff', fg: '#1d2a7a', accent: '#c4302b', art: 'bowl', artColors: ['#1d2a7a', '#8a4a1a'], title: w.yakisoba, sub: w.omori },

  // ===== Ice cream ==============================================================
  { id: 'vanilla', shape: 'icecup', cat: 'ice', price: 172, style: 'clean', brand: w.yukiUsagi,
    bg: '#f8f1dc', fg: '#6a4a1a', accent: '#c9a45a', title: w.vanilla, sub: w.iceCream },
  { id: 'matchaice', shape: 'icecup', cat: 'ice', price: 172, style: 'tea', brand: w.yukiUsagi,
    bg: '#6a8f3a', fg: '#ffffff', accent: '#e8e2c4', title: w.matcha, sub: w.iceCream },
  { id: 'chocoice', shape: 'icecup', cat: 'ice', price: 172, style: 'dark', brand: w.yukiUsagi,
    bg: '#4a2a1a', fg: '#ffffff', accent: '#c48a5a', title: w.choco, sub: w.iceCream },
  { id: 'azuki', shape: 'bag', cat: 'ice', price: 98, size: 'bar', ...SEL, fg: '#7a2a3a', accent: '#f2d675', art: 'mochi', artColors: ['#7a2a3a', '#3a1a1a'], title: w.azuki, sub: w.iceBar },
  { id: 'soda', shape: 'bag', cat: 'ice', price: 86, size: 'bar', style: 'pop', brand: w.yukiUsagi, bg: '#5ac0f0', fg: '#ffffff', accent: '#1d4f9c', art: 'bubbles', artColors: ['#ffffff'], title: w.soda, sub: w.iceBar },
  { id: 'monaka', shape: 'bag', cat: 'ice', price: 162, size: 'bar', style: 'tea', brand: w.yukiUsagi, bg: '#e8d0a0', fg: '#5a2a10', accent: '#a3502a', art: 'cracker', artColors: ['#c48a3a', '#e8c27a'], title: w.monaka, sub: w.reito },

  // ===== Daily goods ============================================================
  { id: 'denchi', shape: 'box', cat: 'daily', price: 398, dims: [0.09, 0.15, 0.02], ...SEL, fg: '#3a4150', accent: '#f2d675', art: 'battery', artColors: ['#3a4150', '#f2d675'], title: w.denchi, sub: w.tanSan },
  { id: 'mask', shape: 'box', cat: 'daily', price: 328, dims: [0.12, 0.09, 0.09], ...SEL, fg: '#1d4f9c', accent: '#62b3e3', art: 'box', artColors: ['#e8f2fb', '#62b3e3'], title: w.mask, sub: w.kokusan },
  { id: 'hamigaki', shape: 'box', cat: 'daily', price: 248, dims: [0.19, 0.04, 0.035], style: 'clean', brand: w.moriShizuku,
    bg: '#ffffff', fg: '#1d8a6a', accent: '#3ac0a0', art: 'sparkle', artColors: ['#3ac0a0'], title: w.hamigaki, sub: w.shinHatsubai },
  { id: 'tissue', shape: 'box', cat: 'daily', price: 98, dims: [0.11, 0.07, 0.025], ...SEL, fg: '#5a7a9a', accent: '#c8dcef', art: 'drop', artColors: ['#c8dcef'], title: w.tissue, sub: w.nameraka },
  { id: 'bansoko', shape: 'box', cat: 'daily', price: 298, dims: [0.08, 0.11, 0.02], ...SEL, fg: '#c4302b', accent: '#f2c8a0', art: 'box', artColors: ['#f2c8a0', '#ffffff'], title: w.bansoko, sub: w.kokusan },
];

for (const p of products) {
  if (p.style === 'select') {
    p.bg ??= '#fbf8f1';
    p.band ??= '#2b3140';
  }
}

export const byId = Object.fromEntries(products.map((p) => [p.id, p]));
