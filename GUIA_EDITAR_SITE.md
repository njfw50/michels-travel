# 📝 Guide: Files to Edit the Site

## 🎯 Main Files to Start

### 1. **Main Page (Home)**
📍 `client/src/pages/Home.tsx`
- **What it is**: The site's landing page
- **What you can edit**: Content, layout, sections, text
- **Open this file first!**

### 2. **Main Application File**
📍 `client/src/App.tsx`
- **What it is**: Route configuration and main structure
- **What you can edit**: Routes, navigation, default theme

### 3. **Main Components**

#### Flight Search
📍 `client/src/components/FlightSearch.tsx`
- Flight search form

📍 `client/src/components/FlightCard.tsx`
- Card displaying flight results

📍 `client/src/components/FlightFilters.tsx`
- Filters for flight results

#### Forms
📍 `client/src/components/BookingForm.tsx`
- Booking form

#### Chatbot
📍 `client/src/components/TravelChatbot.tsx`
- AI travel chatbot

#### Other Components
📍 `client/src/components/AirportSearch.tsx` - Airport search
📍 `client/src/components/Map.tsx` - Map
📍 `client/src/components/LanguageSelector.tsx` - Language selector

### 4. **Styles and Theme**
📍 `client/src/index.css`
- Global styles, colors, theme

📍 `client/src/contexts/ThemeContext.tsx`
- Theme configuration (light/dark)

### 5. **Translations and Languages**
📍 `client/src/contexts/LanguageContext.tsx`
- Language system (PT, EN, ES)

📍 `client/src/const.ts`
- Constants and translated text

## 🗂️ Folder Structure

```
client/src/
├── pages/              ← PAGES (start here!)
│   ├── Home.tsx       ← Home page
│   └── NotFound.tsx   ← 404 page
│
├── components/         ← COMPONENTS
│   ├── FlightSearch.tsx
│   ├── FlightCard.tsx
│   ├── BookingForm.tsx
│   └── ui/            ← UI components (buttons, cards, etc.)
│
├── contexts/          ← CONTEXTS (theme, language)
├── hooks/            ← Custom HOOKS
├── lib/              ← LIBRARIES (trpc, utils)
└── App.tsx           ← MAIN FILE
```

## 🚀 Where to Start?

### To edit the home page:
1. Open: `client/src/pages/Home.tsx`
2. This is the most important file!

### To edit components:
1. Open: `client/src/components/[ComponentName].tsx`
2. Example: `FlightSearch.tsx` to edit flight search

### To edit styles:
1. Open: `client/src/index.css`
2. Or edit inline styles in components

## 💡 Tips

- **Use Ctrl+P** in Cursor to find files quickly
- **UI Components** are in `client/src/components/ui/`
- **Backend** is in `server/` (if you need to edit APIs)

## 📋 Checklist of Important Files

- [ ] `client/src/pages/Home.tsx` - Main page
- [ ] `client/src/App.tsx` - Route configuration
- [ ] `client/src/components/FlightSearch.tsx` - Flight search
- [ ] `client/src/index.css` - Global styles
- [ ] `client/src/const.ts` - Text and constants

---

**💡 Tip**: Always start with the `Home.tsx` file - it's the site's main page!
