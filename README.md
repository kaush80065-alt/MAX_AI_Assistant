# 🌌 MAX AI Assistant Operating System (OS)

MAX AI OS is a futuristic, cyberpunk-themed artificial intelligence assistant interface built with a high-performance **FastAPI** backend and a responsive, dynamic web-based HUD dashboard. 

It is designed to feel like a premium, conscious AI operating system cockpit, combining live hardware metrics, long-term memory profiles, voice communication capabilities, and a dynamic chat interface.

---

## 🚀 Key Features

* **💬 Persistent Conversation History**: Automatically loads past conversations on reload, displaying user chats (violet glow) and assistant responses (dark indigo panels).
* **📝 Real-time Markdown Rendering**: Features `marked.js` parsing to cleanly format lists, bold text, code blocks, and data tables directly in the chat.
* **🧠 Dynamic Memory Core**: The sidebar displays active user parameters (Name, Primary Goal, Project, Preferences) fetched directly from the backend.
* **⚙️ Memory Management Console**: Allows users to dynamically update parameters via a secure modal popup and commit them to the persistent memory core (`memory.json`).
* **📊 Hardware Telemetry Dashboard**: Real-time polling tracks active CPU usage and RAM levels via custom dashboard metrics and linear graphs.
* **📸 Viewport Screenshot Capturing**: Captures the entire active HUD interface using `html2canvas` and initiates a high-res PNG download straight to your local Downloads folder.
* **🎙️ Voice Interface**: Wire up microphone button recognition to dictate queries or listen to replies (with markdown filters applied for voice synthesis).
* **🌊 Waveform visualizer**: Interactive audio waveform canvas dynamically reacts to audio level inputs.

---

## 🛠️ Technology Stack

* **Backend**: FastAPI (Python 3.8+), Pydantic, Uvicorn, psutil
* **Frontend**: HTML5,CSS, Vanilla Javascript
* **Integrations**: `marked.js` (Markdown parser), `html2canvas` (Screenshot capture), `Phosphor Icons` (UI icons)

---

## 📦 Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/kaush80065-alt/MAX_AI_Assistant.git
cd MAX_AI_Assistant
```

### 2. Set up virtual environment
```bash
# Create a virtual environment
python -m venv .venv

# Activate it (Windows)
.venv\Scripts\activate

# Activate it (Mac/Linux)
source .venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r backend/requirements.txt
```

### 4. Configure environment variables
Create a `.env` file inside the `backend/` directory:
```env
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=google/gemini-2.5-flash
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

### 5. Run the application
```bash
cd backend
uvicorn app.main:app --reload
```
Once running, navigate to **`http://127.0.0.1:8000`** in your browser!

---

## 🔒 Security
The project includes a `.gitignore` profile which automatically prevents backing up private API credentials (`.env`) or local session caches (`memory.json`) to public repositories.
