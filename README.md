# Pyon Mart ぴょんマート

A walk-around 3D Japanese convenience store (konbini) in the browser, made for
exploring and for practising reading Japanese.

Walk up to the store, open the doors, browse the aisles, pick up any product to
turn it over in your hands, and hover over any Japanese text — on packaging,
signs, price tags, posters, even the road — to see its reading, romaji and meaning.

Built with [three.js](https://threejs.org) and [Vite](https://vitejs.dev). There
are no 3D model or image files: the store, every product and every label are
generated in code.

## Running it

```bash
npm install
npm run dev
```

Then open the address Vite prints (usually http://localhost:5173).

To build a static version you can host anywhere (GitHub Pages, Netlify, …):

```bash
npm run build      # outputs to dist/
npm run preview    # serve the build locally
```

## Controls

| | |
|---|---|
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> / arrows | walk |
| <kbd>Q</kbd> <kbd>E</kbd> | turn |
| <kbd>Shift</kbd> | hurry |
| hold <kbd>C</kbd> | crouch (for the bottom shelves) |
| drag | look around |
| click | open doors, pick up products, check out at the register |
| hover | read any Japanese text |
| <kbd>J</kbd> | word book |
| <kbd>T</kbd> | toggle day / night |

In the close-up product view: drag or <kbd>A</kbd>/<kbd>D</kbd> to turn, scroll to
zoom, <kbd>F</kbd> to turn it over, <kbd>B</kbd> to add it to your basket,
<kbd>Esc</kbd> to put it back.

## Features

- **Day and night** — a time-of-day slider moves the sun, sky and moon; at night the
  sign, windows, vending machines and street lights glow.
- **~150 fictional products** with generated packaging, including store-brand lines
  (ぴょんセレクト, ぴょんカフェ, ぴょんスイーツ, ぴょんビューティー) that share one look.
- **Nearly 300 words** to discover, each with hiragana, romaji and English. A word book
  tracks the ones you've found.
- **Checkout** — bring your basket to ぴょんさん at the register for the usual questions
  (温めますか？ 袋はご利用ですか？), with a printed receipt.
- **Hiragana practice mode** — Settings → Japanese text → *Hiragana only* reprints every
  label and sign in hiragana; tooltips show the usual spelling underneath.
- **Settings** — your height, look speed, Street View–style dragging, volume, tips, and
  graphics quality (High / Balanced / Low).

## Project layout

```
src/
  main.js            game loop, hover/interaction, UI, settings
  player.js          walking, looking, collisions, crouch
  inspect.js         close-up product viewer
  checkout.js        the register conversation and receipt
  environment.js     sky, sun/moon, time of day
  products.js        3D product shapes and packaging designs
  art.js             packaging illustrations, brand marks
  label.js           canvas labels that remember where each word was drawn
  logo.js            the hare-and-moon logo
  audio.js           synthesised sounds
  data/words.js      every word with its reading, romaji and meaning
  data/products.js   the product catalogue
  world/             exterior, interior, decor and detail props
logo-lab.html        a page for previewing the logo variants (dev only)
```

### Adding a product

Add a row to `src/data/products.js` — a shape (`pet`, `can`, `bag`, `box`, `cup`,
`pump`, …), a label style, colours, and words from `src/data/words.js` — then put its
`id` on a shelf in `src/world/interior.js`. The packaging is drawn automatically.

## Notes

All brands and products are fictional. Fonts are loaded from Google Fonts
(Noto Sans JP, Noto Serif JP, Zen Maru Gothic, M PLUS Rounded 1c, Mochiy Pop One).
