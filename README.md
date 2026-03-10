# TokenPulse.io ⚡

A high-end, real-time dashboard to track, visualize, and optimize LLM token usage and costs across multiple providers (Gemini, OpenAI, Anthropic).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)

## ✨ Features

- **Multi-Model Support:** Pre-configured pricing for Gemini 1.5/2.0, GPT-4o, Claude 3.5, and more.
- **Smart Parser:** Paste raw JSON responses from LLM APIs to automatically extract usage metadata.
- **AI Insights:** Integrated Gemini-powered analysis to suggest cost-saving measures based on your history.
- **Interactive Analytics:** Beautiful charts powered by Recharts for spend distribution and daily trends.
- **Privacy First:** All data is stored in your local browser vault (LocalStorage).

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- A Gemini API Key (for AI Insights)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/tokenpulse.git

# Navigate to the directory
cd tokenpulse

# Install dependencies
npm install
```

### 3. Configuration
Create a `.env` file in the root directory and add your Gemini API key:
```env
GEMINI_API_KEY=your_api_key_here
```

### 4. Run Development Server
```bash
npm run dev
```

## 🛠️ Tech Stack
- **Frontend:** React 19, TypeScript, Tailwind CSS
- **Visualization:** Recharts
- **AI:** @google/genai (Gemini 1.5 Flash)
- **Build Tool:** Vite

## 📄 License
This project is licensed under the MIT License.
