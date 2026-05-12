# 🪟 Glassmorphism Engine

An interactive CSS glassmorphism generator with live preview, multi-format code output, and a full suite of design tools. Craft the perfect frosted glass effect and copy production-ready code in seconds.

**[→ Live Demo](https://glassmorphism-engine.vercel.app/)**

---

## Features

### Controls
- **7 live sliders** — blur, transparency, saturation, border opacity, border radius, shadow depth, and noise texture
- **Glass tint** — full color picker plus 7 quick-select swatches
- **Shimmer animation** — toggle a CSS `hue-rotate` keyframe animation on the preview and in all code output
- **Extra layers** — stack up to 2 additional glass panels, each with independent blur, alpha, radius, and tint

### Preview
- **4 preview shapes** — Card, Navbar, Modal, and Button pill
- **Before / after compare** — split view showing the same component with and without glass applied
- **WCAG contrast badge** — live AA / AAA / Fail rating with the exact contrast ratio, recalculated on every change
- **Noise texture overlay** — SVG fractal noise rendered directly in the preview

### Workflow
- **6 built-in presets** — iOS Frosted, Material You, Cyberpunk, Win Fluent, Dark Void, Aurora
- **Save your own presets** — name and store custom styles for the session
- **Undo** — 10-step history; saves a snapshot before every drag, preset switch, or randomize
- **Random generator** — one click to a randomised but coherent glass style
- **Share via URL** — all values are encoded into the URL hash so you can share an exact recipe with a link
- **Export PNG** — captures the live preview card as a high-resolution image
- **Custom background** — upload your own image to test glass against a real project screenshot
- **Dark / Light glass toggle** — switches the glass surface and UI between dark and light modes
- **Mars / Gradient background** — two built-in animated backgrounds for the preview scene

### Code Output
Five ready-to-paste formats, all updating live:

| Tab | Output |
|-----|--------|
| **CSS** | Plain `.glass {}` selector, optionally with `@keyframes` and stacked layer selectors |
| **Variables** | CSS custom properties in `:root` for easy theming |
| **Tailwind** | Arbitrary-value utility classes for Tailwind v3.3+ |
| **React** | `GlassCard` component with a spread-props API |
| **Vue** | Single File Component with `<style scoped>` |

### UX Details
- **Click any value** next to a slider to type an exact number
- **⌘Z / Ctrl+Z** — undo
- **⌘S / Ctrl+S** — save current state as a preset

---

## Tech Stack

- [React 18](https://react.dev)
- [Vite](https://vitejs.dev)
- [lucide-react](https://lucide.dev)
- [html2canvas](https://html2canvas.hertzen.com) *(lazy-loaded for PNG export)*

---

## Running Locally

```bash
git clone https://github.com/afonsobranco/glassmorphism-engine.git
cd glassmorphism-engine
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Deploying

### Vercel *(recommended)*
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/afonsobranco/glassmorphism-engine)

### GitHub Pages
```bash
npm run build
# then push the dist/ folder to your gh-pages branch
```

---

## Project Structure

```
glassmorphism-engine/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx               # React root
    ├── App.jsx                # App shell
    ├── index.css              # Global reset
    └── GlassmorphismEngine.jsx  # Main component (~500 lines)
```

---

## License

MIT — use it, fork it, ship it.
