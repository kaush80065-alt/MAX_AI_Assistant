// =========================================================
// MAX AI OS v4.1 - Conversational Interface & Logic
// =========================================================

const micButton = document.getElementById('micButton');
const voiceState = document.getElementById('voice-state');
const chatLog = document.getElementById('chat-log');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const imageUpload = document.getElementById('imageUpload');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const removeImageBtn = document.getElementById('remove-image-btn');

let isListening = false;
let recognition = null;
let currentImageB64 = null;

// =========================================================
// UI Helpers & Toast Notifications
// =========================================================

function updateState(state) {
  if (voiceState) voiceState.textContent = state;
}

function pulseReactor(level = 1) {
  if (window.setVoiceLevel) {
    window.setVoiceLevel(level);
  }
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  
  let icon = 'ph-info';
  if (type === 'success') icon = 'ph-check-circle';
  if (type === 'error') icon = 'ph-warning-circle';

  toast.innerHTML = `<i class="ph ${icon}" style="color:var(--primary);font-size:16px;"></i> <span>${message}</span>`;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideInFromRight 0.3s ease-in reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// =========================================================
// Speech Recognition
// =========================================================

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    isListening = true;
    updateState('Listening');
    micButton.classList.add('active');
    pulseReactor(1);
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    pulseReactor(1);
    if (event.results[0].isFinal) {
      updateState('Processing');
      sendToMAX(transcript);
    }
  };

  recognition.onend = () => {
    isListening = false;
    micButton.classList.remove('active');
    pulseReactor(0);
  };

  recognition.onerror = () => {
    updateState('Ready');
    micButton.classList.remove('active');
    pulseReactor(0);
  };
}

if (micButton) {
  micButton.addEventListener('click', () => {
    if (!recognition) {
      showToast('Speech recognition not supported in this browser.', 'error');
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  });
}

// =========================================================
// Chat Functions & Markdown Rendering
// =========================================================

function appendMessage(sender, text, imageB64 = null) {
  if (!chatLog) return null;

  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-message ${sender}`;

  const senderSpan = document.createElement('span');
  senderSpan.className = 'message-sender';
  senderSpan.textContent = sender === 'user' ? 'YOU' : 'MAX';
  msgDiv.appendChild(senderSpan);

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';

  if (sender === 'assistant') {
    // Render Markdown for MAX
    contentDiv.innerHTML = marked.parse(text);
  } else {
    // Render standard text for User
    const p = document.createElement('p');
    p.textContent = text;
    contentDiv.appendChild(p);

    if (imageB64) {
      const img = document.createElement('img');
      img.src = imageB64;
      img.className = 'message-image';
      contentDiv.appendChild(img);
    }
  }

  msgDiv.appendChild(contentDiv);
  chatLog.appendChild(msgDiv);
  chatLog.scrollTop = chatLog.scrollHeight;

  return msgDiv;
}

let typingIndicatorNode = null;

function showTypingIndicator() {
  if (!chatLog || typingIndicatorNode) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = 'chat-message assistant';

  const senderSpan = document.createElement('span');
  senderSpan.className = 'message-sender';
  senderSpan.textContent = 'MAX';
  msgDiv.appendChild(senderSpan);

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.innerHTML = `
    <div class="typing-indicator-container">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  msgDiv.appendChild(contentDiv);
  chatLog.appendChild(msgDiv);
  chatLog.scrollTop = chatLog.scrollHeight;
  typingIndicatorNode = msgDiv;
}

function removeTypingIndicator() {
  if (typingIndicatorNode) {
    typingIndicatorNode.remove();
    typingIndicatorNode = null;
  }
}

async function sendToMAX(message, image = null) {
  try {
    // 1. Append user bubble
    appendMessage('user', message, image);

    // 2. Show typing loading bubble
    showTypingIndicator();
    updateState('Thinking');

    // 3. Post to backend
    const payload = { message };
    if (image) payload.image = image;

    const response = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // 4. Remove loader and display final text
    removeTypingIndicator();
    appendMessage('assistant', data.reply);

    // 5. Speak reply
    updateState('Ready');
    pulseReactor(0.4);
    speak(data.reply);

    // 6. Reload Memory Core dynamically (in case of updates)
    loadMemoryCore();

  } catch (error) {
    console.error(error);
    removeTypingIndicator();
    appendMessage('assistant', 'Error: Connection lost. Is the MAX server running?');
    updateState('Offline');
    pulseReactor(0);
    showToast('Failed to connect to MAX backend.', 'error');
  }
}

// =========================================================
// Memory & History Operations
// =========================================================

const memoryCoreList = document.getElementById('memory-core-list');
const memoryMeta = {
  name: { title: 'USER NAME', icon: 'ph-user-focus', glow: 'cyan-glow', num: '01' },
  goal: { title: 'PRIMARY GOAL', icon: 'ph-target', glow: 'green-glow', num: '02' },
  current_project: { title: 'ACTIVE PROJECT', icon: 'ph-folder', glow: 'blue-glow', num: '03' },
  preferred_style: { title: 'RESPONSE STYLE', icon: 'ph-chat-circle-text', glow: 'purple-glow', num: '04' },
  learning: { title: 'CURRENTLY LEARNING', icon: 'ph-brain', glow: 'cyan-glow', num: '05' }
};

async function loadMemoryCore() {
  if (!memoryCoreList) return;
  try {
    const res = await fetch('/api/profile');
    if (!res.ok) return;
    const profile = await res.json();

    memoryCoreList.innerHTML = '';
    
    const data = {
      name: profile.name || 'Not Set',
      goal: profile.goal || 'Not Set',
      current_project: profile.current_project || 'Not Set',
      preferred_style: profile.preferred_style || 'Not Set',
      learning: profile.learning || 'Not Set'
    };

    Object.keys(memoryMeta).forEach((key) => {
      const meta = memoryMeta[key];
      const itemVal = data[key];

      const itemDiv = document.createElement('div');
      itemDiv.className = `memory-item ${meta.glow}`;
      itemDiv.style.cursor = 'pointer';
      
      itemDiv.innerHTML = `
        <div class="item-icon"><i class="ph ${meta.icon}"></i></div>
        <div class="item-text">
          <h4>${itemVal}</h4>
          <p>${meta.title}</p>
        </div>
        <div class="item-number">${meta.num}</div>
      `;

      itemDiv.addEventListener('click', openSettingsModal);
      memoryCoreList.appendChild(itemDiv);
    });

    // Populate modal inputs
    document.getElementById('profileName').value = profile.name || '';
    document.getElementById('profileGoal').value = profile.goal || '';
    document.getElementById('profileProject').value = profile.current_project || '';
    document.getElementById('profileStyle').value = profile.preferred_style || '';
    document.getElementById('profileLearning').value = profile.learning || '';

  } catch (error) {
    console.error('Error loading memory:', error);
  }
}

async function loadChatHistory() {
  if (!chatLog) return;
  try {
    const res = await fetch('/api/history');
    if (!res.ok) return;
    const history = await res.json();

    chatLog.innerHTML = '';

    const messages = history.value || history;

    if (!messages || messages.length === 0) {
      appendMessage('assistant', "Hello Kaushal. All systems operational. Neural Core ready. How can I help you today?");
      return;
    }

    messages.forEach((msg) => {
      appendMessage(msg.role, msg.message);
    });
  } catch (error) {
    console.error('Error loading history:', error);
  }
}

async function clearChatHistory() {
  if (!confirm("Are you sure you want to wipe MAX's conversation history?")) return;
  try {
    const res = await fetch('/api/history/clear', { method: 'POST' });
    if (res.ok) {
      chatLog.innerHTML = '';
      appendMessage('assistant', "Memory systems refreshed. Chat history has been cleared.");
      showToast('Conversation history cleared.', 'success');
    }
  } catch (error) {
    console.error(error);
    showToast('Failed to clear history.', 'error');
  }
}

// =========================================================
// Settings Modal Handling
// =========================================================

const settingsModal = document.getElementById('settingsModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const profileForm = document.getElementById('profileForm');
const editMemoryBtn = document.getElementById('editMemoryBtn');

function openSettingsModal(e) {
  if (e) e.preventDefault();
  if (settingsModal) settingsModal.style.display = 'flex';
}

function closeSettingsModal() {
  if (settingsModal) settingsModal.style.display = 'none';
}

if (closeModalBtn) {
  closeModalBtn.addEventListener('click', closeSettingsModal);
}

if (settingsModal) {
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeSettingsModal();
  });
}

if (editMemoryBtn) {
  editMemoryBtn.addEventListener('click', openSettingsModal);
}

if (profileForm) {
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const updates = {
      name: document.getElementById('profileName').value.trim(),
      goal: document.getElementById('profileGoal').value.trim(),
      current_project: document.getElementById('profileProject').value.trim(),
      preferred_style: document.getElementById('profileStyle').value.trim(),
      learning: document.getElementById('profileLearning').value.trim()
    };

    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });

      if (res.ok) {
        closeSettingsModal();
        showToast('Memory profile committed successfully.', 'success');
        loadMemoryCore();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update profile memory.', 'error');
    }
  });
}

// =========================================================
// Input Handling
// =========================================================

if (imageUpload) {
  imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      currentImageB64 = event.target.result;
      imagePreview.src = currentImageB64;
      imagePreviewContainer.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  });
}

if (removeImageBtn) {
  removeImageBtn.addEventListener('click', () => {
    currentImageB64 = null;
    imageUpload.value = '';
    imagePreviewContainer.style.display = 'none';
  });
}

function handleSend() {
  const text = chatInput.value.trim();
  if (!text && !currentImageB64) return;
  
  chatInput.value = '';
  sendToMAX(text || "Please describe this image.", currentImageB64);
  
  currentImageB64 = null;
  if (imageUpload) imageUpload.value = '';
  if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
}

if (sendBtn) {
  sendBtn.addEventListener('click', handleSend);
}

if (chatInput) {
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
  });
}

// =========================================================
// Speech Synthesis
// =========================================================

function speak(text) {
  if (!('speechSynthesis' in window)) return;

  speechSynthesis.cancel();

  // Strip markdown styling from spoken words
  const cleanText = text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/#+\s+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 1.0;
  utterance.pitch = 1.1;
  utterance.volume = 1;

  utterance.onstart = () => {
    updateState('Speaking');
    pulseReactor(0.8);
  };

  utterance.onend = () => {
    updateState('Ready');
    pulseReactor(0);
  };

  speechSynthesis.speak(utterance);
}

// =========================================================
// Idle Reactor Pulse
// =========================================================

setInterval(() => {
  if (!isListening) {
    pulseReactor(0.08 + Math.random() * 0.12);
  }
}, 900);

// =========================================================
// Sidebar Nav Click Actions
// =========================================================

const navLinks = document.querySelectorAll('.side-nav a');
navLinks.forEach((link, idx) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    const spanText = link.querySelector('span').textContent;
    if (spanText === 'SETTINGS' || spanText === 'MEMORY') {
      openSettingsModal();
    } else if (spanText === 'CONSOLE') {
      clearChatHistory();
    } else {
      showToast(`${spanText} Navigation Selected.`, 'info');
    }
  });
});

// =========================================================
// Quick Action Buttons
// =========================================================

document.querySelectorAll('.action-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const text = btn.querySelector('span').textContent.trim();
    pulseReactor(0.6);
    updateState('Executing');

    if (text === 'Open Projects') {
      sendToMAX('Tell me about my active projects.');
    } else if (text === 'Search Files') {
      sendToMAX('Search my files for important goals.');
    } else if (text === 'Take Screenshot') {
      const target = document.querySelector('.hud-container');
      if (target && typeof html2canvas !== 'undefined') {
        html2canvas(target, {
          backgroundColor: '#03020d',
          scale: 1.5,
          useCORS: true
        }).then(canvas => {
          const link = document.createElement('a');
          link.download = `MAX_OS_Telemetry_${Date.now()}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          showToast('HUD telemetry screenshot saved to Downloads.', 'success');
          updateState('Ready');
          pulseReactor(0);
        }).catch(err => {
          console.error(err);
          showToast('Failed to generate screenshot.', 'error');
          updateState('Ready');
          pulseReactor(0);
        });
      } else {
        showToast('Screenshot module unavailable.', 'error');
        updateState('Ready');
        pulseReactor(0);
      }
    } else {
      openSettingsModal();
    }
    console.log('Action:', text);
  });
});

// =========================================================
// Real-Time Clock & Uptime
// =========================================================

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function updateClock() {
  const now = new Date();

  const dateEl = document.getElementById('date-val');
  if (dateEl) {
    dateEl.textContent =
      `${String(now.getDate()).padStart(2,'0')} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  }

  const timeEl = document.getElementById('time-val');
  if (timeEl) {
    timeEl.textContent =
      `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  }
}

let secondsActive = 0;
function updateUptime() {
  secondsActive++;
  const h = Math.floor(secondsActive / 3600);
  const m = Math.floor((secondsActive % 3600) / 60);
  const s = secondsActive % 60;
  const uptimeEl = document.getElementById('uptime-val');
  if (uptimeEl) {
    uptimeEl.textContent =
      `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
}

setInterval(updateClock, 1000);
setInterval(updateUptime, 1000);
updateClock();

// =========================================================
// Telemetry Polling
// =========================================================

async function fetchTelemetry() {
  try {
    const response = await fetch('/telemetry');
    if (!response.ok) return;
    const data = await response.json();

    const cpuFill = document.getElementById('cpu-fill');
    const cpuVal  = document.getElementById('cpu-val');
    if (cpuFill) cpuFill.style.width = data.cpu + '%';
    if (cpuVal)  cpuVal.textContent  = Math.round(data.cpu) + '%';

    const ramFill = document.getElementById('ram-fill');
    const ramVal  = document.getElementById('ram-val');
    if (ramFill) ramFill.style.width = data.memory_percent + '%';
    if (ramVal)  ramVal.textContent  = `${data.memory_used_gb} GB / ${data.memory_total_gb} GB`;

  } catch (error) {
    console.error('Telemetry error:', error);
  }
}

setInterval(fetchTelemetry, 2000);
fetchTelemetry();

// =========================================================
// Page Init
// =========================================================

window.addEventListener('DOMContentLoaded', () => {
  loadMemoryCore();
  loadChatHistory();
});
