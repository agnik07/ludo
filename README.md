# 🎲 Ludo Master - Play Local & Remote Online Multiplayer

A modern, responsive, high-performance Ludo Web Application supporting **Local Pass & Play**, **AI Bots**, and **Real-Time Remote Online Multiplayer across separate devices** via 6-digit Room Codes or Share Links.

![Ludo Master Banner](https://img.shields.io/badge/Ludo-Master-6366f1?style=for-the-badge&logo=gamepad)
![Vercel Ready](https://img.shields.io/badge/Deploy-Vercel%20Ready-000000?style=for-the-badge&logo=vercel)
![Render Ready](https://img.shields.io/badge/Deploy-Render%20Ready-46E3B7?style=for-the-badge&logo=render)

---

## ✨ Features

- 🌐 **Remote Online Multiplayer**: Create a room, get a 6-digit code or share link, and play with friends on separate phones, tablets, or computers anywhere.
- 👥 **1 to 4 Player Modes**: Play solo vs 3 AI bots, local pass & play with friends, or mixed human/bot online games.
- 🎯 **Complete Official Rules**:
  - Roll a **6** to release tokens from home yard.
  - Bonus extra turns on rolling 6, capturing opponent tokens, or reaching center home.
  - Safe star tiles protecting tokens from capture.
  - 3 consecutive 6s rule penalty.
- 🎨 **Sleek Modern UI**: Responsive glassmorphism interface, 3D animated rolling dice, glow turn indicators, dynamic token stacking badges.
- 🔊 **Web Audio API Sound Effects**: Interactive sound effects synthesized directly in the browser (dice roll, token steps, captures, victory fanfare).
- 🚀 **Zero-Backend Vercel/Render Deploy**: Works 100% serverless using WebRTC P2P real-time data streaming.

---

## 🛠️ Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Build for production
npm run build
```

---

## 🚀 Deploying to Vercel or Render

### Deploy to Vercel (Recommended)
1. Push this repository to GitHub / GitLab / Bitbucket.
2. Go to [Vercel Dashboard](https://vercel.com/new).
3. Import your repository.
4. Click **Deploy** (Vercel automatically detects Vite framework and settings from `vercel.json`).

### Deploy to Render
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Static Site**.
3. Connect your repository.
4. Set **Build Command**: `npm run build`
5. Set **Publish Directory**: `dist`
6. Click **Create Static Site**.
