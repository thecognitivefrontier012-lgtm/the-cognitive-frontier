// Cấu hình PDF.js worker
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// Dữ liệu mặc định lưu trên LocalStorage
const DEFAULT_DOCS = [
  {
    id: 'doc-1',
    title: 'SGK Tiếng Anh 12 - Unit 8: Wildlife Conservation (Ngữ pháp Câu điều kiện)',
    content: 'Câu điều kiện loại 2 (Second Conditional) diễn tả giả định không có thật ở hiện tại. Cấu trúc: If + S + V2/ed (were), S + would/could + V-inf. Ví dụ: If humans protected habitats, endangered species would survive.'
  },
  {
    id: 'doc-2',
    title: 'SGK Lịch Sử 12 - Chiến dịch Điện Biên Phủ (1954)',
    content: 'Chiến dịch Điện Biên Phủ diễn ra từ 13/3/1954 đến 7/5/1954 qua 3 đợt tiến công. Thắng lợi này đập tan hoàn toàn kế hoạch Nava, giáng đòn quyết định vào ý chí xâm lược của thực dân Pháp, dẫn đến ký kết Hiệp định Giơ-ne-vơ (21/7/1954).'
  }
];

const DEFAULT_CARDS = [
  { id: 1, front: 'Cấu trúc Câu điều kiện loại 2 trong Tiếng Anh?', back: 'If + S + V2/ed (were), S + would/could + V(nguyên mẫu)', interval: 1, ease: 2.5, due: Date.now() },
  { id: 2, front: 'Thời gian diễn ra Chiến dịch Điện Biên Phủ 1954?', back: 'Từ ngày 13/3/1954 đến ngày 7/5/1954 (56 ngày đêm)', interval: 1, ease: 2.5, due: Date.now() },
  { id: 3, front: 'Ý nghĩa quốc tế lớn nhất của Hiệp định Giơ-ne-vơ 1954?', back: 'Chấm dứt chiến tranh xâm lược của Pháp ở Đông Dương, công nhận độc lập chủ quyền 3 nước Việt Nam, Lào, Campuchia.', interval: 1, ease: 2.5, due: Date.now() }
];

let state = {
  xp: Number(localStorage.getItem('cf_xp')) || 70,
  streak: Number(localStorage.getItem('cf_streak')) || 1,
  persona: localStorage.getItem('cf_persona') || 'GIA SƯ TẬN TÂM',
  apiKey: localStorage.getItem('cf_apikey') || 'apiKey: localStorage.getItem('cf_apikey') || 'AIzaSyD-MÃ_KEY_CỦA_BẠN_Ở_ĐÂY'',
  docs: JSON.parse(localStorage.getItem('cf_docs')) || DEFAULT_DOCS,
  cards: JSON.parse(localStorage.getItem('cf_cards')) || DEFAULT_CARDS
};

function saveState() {
  localStorage.setItem('cf_xp', state.xp);
  localStorage.setItem('cf_streak', state.streak);
  localStorage.setItem('cf_persona', state.persona);
  localStorage.setItem('cf_apikey', state.apiKey);
  localStorage.setItem('cf_docs', JSON.stringify(state.docs));
  localStorage.setItem('cf_cards', JSON.stringify(state.cards));
  updateDashboardUI();
}

// CHUYỂN TAB
function switchTab(tabName) {
  document.querySelectorAll('.tab-section').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  
  document.getElementById(`tab-${tabName}`).classList.add('active');
  document.querySelector(`.nav-btn[data-tab="${tabName}"]`).classList.add('active');
  
  if (tabName === 'library') renderDocs();
  if (tabName === 'flashcards') renderCurrentFlashcard();
}

function startSubjectChat(subject) {
  document.getElementById('subject-select').value = subject;
  switchTab('tutor');
}

function fillPrompt(text) {
  document.getElementById('chat-input').value = text;
}

// CẬP NHẬT CHỈ SỐ DASHBOARD
function updateDashboardUI() {
  const dueCards = state.cards.filter(c => c.due <= Date.now());
  const level = Math.floor(state.xp / 100) + 1;

  document.getElementById('mini-xp').textContent = state.xp;
  document.getElementById('stat-xp').textContent = state.xp;
  document.getElementById('stat-level').textContent = `Lv.${level}`;
  document.getElementById('mini-streak').textContent = state.streak;
  document.getElementById('stat-streak').textContent = state.streak;

  document.getElementById('nav-doc-count').textContent = state.docs.length;
  document.getElementById('stat-docs').textContent = state.docs.length;
  document.getElementById('chat-doc-ref').textContent = `${state.docs.length} tài liệu SGK`;

  document.getElementById('nav-card-count').textContent = dueCards.length;
  document.getElementById('stat-due').textContent = dueCards.length;
  document.getElementById('banner-due-count').textContent = dueCards.length;
  document.getElementById('current-persona-label').textContent = state.persona;
}

// RAG RETRIEVAL (TÌM ĐOẠN VĂN SGK LIÊN QUAN NHẤT)
function retrieveRAGContext(query) {
  const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  let bestDoc = state.docs[0];
  let maxScore = -1;

  state.docs.forEach(doc => {
    let score = 0;
    const text = (doc.title + ' ' + doc.content).toLowerCase();
    keywords.forEach(kw => { if (text.includes(kw)) score++; });
    if (score > maxScore) { maxScore = score; bestDoc = doc; }
  });

  return bestDoc ? `[Nguồn: ${bestDoc.title}]\n${bestDoc.content}` : 'Chưa có tài liệu SGK.';
}

// GỬI TIN NHẮN & GỌI GEMINI API
async function handleSendMessage(e) {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const question = input.value.trim();
  if (!question) return;

  const subject = document.getElementById('subject-select').value;
  appendMessage('user', question);
  input.value = '';

  const ragContext = retrieveRAGContext(question);
  const loadingId = appendMessage('ai', '⏳ Đang tra cứu SGK và phân tích câu trả lời...');

  let answer = '';
  if (state.apiKey) {
    try {
      const prompt = `Bạn là trợ lý học tập AI môn ${subject} với tính cách "${state.persona}". 
Dựa vào dữ liệu Sách giáo khoa sau đây để trả lời học sinh một cách chính xác, dễ hiểu:
---
${ragContext}
---
Câu hỏi của học sinh: ${question}`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${state.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await res.json();
      answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Lỗi kết nối API Key. Vui lòng kiểm tra lại trong mục Cá nhân hóa.';
    } catch (err) {
      answer = '⚠️ Không thể gọi Gemini API. Đang chuyển sang chế độ trích xuất SGK cục bộ:\n\n' + ragContext;
    }
  } else {
    // Chế độ Demo Offline thông minh khi chưa nhập API Key
    await new Promise(r => setTimeout(r, 600));
    answer = `📚 **Trích xuất từ Kho SGK (${subject}):**\n${ragContext}\n\n💡 **Gợi ý giải thích (${state.persona}):** Bạn hãy nắm vững các từ khóa chính ở trên. (Nhập Gemini API Key ở tab "Cá nhân hóa" để mở khóa giải đáp AI chuyên sâu mọi câu hỏi).`;
  }

  document.getElementById(loadingId).remove();
  appendMessage('ai', answer, question);
  state.xp += 10;
  saveState();
}

function appendMessage(role, text, originalQuestion = '') {
  const box = document.getElementById('chat-box');
  const id = 'msg-' + Date.now();
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.id = id;
  div.innerHTML = `<div class="msg-bubble">${text}</div>`;

  if (role === 'ai' && originalQuestion) {
    const btn = document.createElement('button');
    btn.className = 'save-fc-mini';
    btn.textContent = '🗂️ Lưu thành Flashcard SM-2 (+5 XP)';
    btn.onclick = () => {
      state.cards.push({
        id: Date.now(),
        front: originalQuestion,
        back: text.slice(0, 220) + (text.length > 220 ? '...' : ''),
        interval: 1,
        ease: 2.5,
        due: Date.now()
      });
      state.xp += 5;
      saveState();
      btn.textContent = '✅ Đã lưu vào Flashcards!';
      btn.disabled = true;
    };
    div.appendChild(btn);
  }

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return id;
}

// KHO SGK: ĐỌC FILE PDF & THÊM TÀI LIỆU
async function handlePDFUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function () {
    const typedarray = new Uint8Array(this.result);
    const pdf = await pdfjsLib.getDocument(typedarray).promise;
    let extractedText = '';
    const maxPages = Math.min(pdf.numPages, 5); // Đọc 5 trang đầu để tối ưu tốc độ demo

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      extractedText += content.items.map(item => item.str).join(' ') + '\n';
    }

    state.docs.push({
      id: 'doc-' + Date.now(),
      title: `PDF SGK: ${file.name}`,
      content: extractedText.slice(0, 2500) || 'Tài liệu PDF đã tải lên.'
    });
    saveState();
    renderDocs();
    alert(`Đã trích xuất thành công tài liệu "${file.name}" vào Kho RAG!`);
  };
  reader.readAsArrayBuffer(file);
}

function addManualDoc() {
  const title = document.getElementById('doc-title').value.trim();
  const content = document.getElementById('doc-content').value.trim();
  if (!title || !content) return alert('Vui lòng nhập đủ tên bài học và nội dung!');

  state.docs.push({ id: 'doc-' + Date.now(), title, content });
  document.getElementById('doc-title').value = '';
  document.getElementById('doc-content').value = '';
  saveState();
  renderDocs();
}

function renderDocs() {
  const list = document.getElementById('doc-list');
  list.innerHTML = state.docs.map((doc, idx) => `
    <div class="doc-item">
      <div>
        <strong>📄 ${doc.title}</strong>
        <p style="font-size:12px; color:#3F3F46;">${doc.content.slice(0, 110)}...</p>
      </div>
      <button class="btn-dark-sm" onclick="deleteDoc(${idx})">Xóa</button>
    </div>
  `).join('');
}

function deleteDoc(idx) {
  state.docs.splice(idx, 1);
  saveState();
  renderDocs();
}

// THUẬT TOÁN LẶP LẠI NGẮT QUÃNG SM-2
function toggleAddCardForm() {
  document.getElementById('add-card-form').classList.toggle('hidden');
}

function createFlashcard() {
  const front = document.getElementById('fc-front').value.trim();
  const back = document.getElementById('fc-back').value.trim();
  if (!front || !back) return alert('Vui lòng nhập mặt trước và mặt sau!');

  state.cards.push({ id: Date.now(), front, back, interval: 1, ease: 2.5, due: Date.now() });
  document.getElementById('fc-front').value = '';
  document.getElementById('fc-back').value = '';
  toggleAddCardForm();
  saveState();
  renderCurrentFlashcard();
}

function renderCurrentFlashcard() {
  const stage = document.getElementById('flashcard-stage');
  const dueCards = state.cards.filter(c => c.due <= Date.now());

  if (dueCards.length === 0) {
    stage.innerHTML = `<div class="fc-card"><h3>🎉 Tuyệt vời! Bạn đã hoàn thành hết thẻ cần ôn hôm nay.</h3><p>Hãy tạo thêm thẻ mới hoặc quay lại vào ngày mai theo lịch SM-2.</p></div>`;
    return;
  }

  const card = dueCards[0];
  stage.innerHTML = `
    <div class="fc-card">
      <div class="fc-question">${card.front}</div>
      <button class="btn-primary blue" id="reveal-btn" onclick="document.getElementById('fc-ans-box').classList.remove('hidden'); this.style.display='none';">👁️ LẬT XEM ĐÁP ÁN</button>
      <div id="fc-ans-box" class="hidden">
        <div class="fc-answer">${card.back}</div>
        <div class="sm2-buttons">
          <button class="sm2-btn" style="background:#FCA5A5" onclick="rateSM2(${card.id}, 1)">Quên (Ôn lại ngay)</button>
          <button class="sm2-btn" style="background:#FDE047" onclick="rateSM2(${card.id}, 3)">Khó (1 ngày)</button>
          <button class="sm2-btn" style="background:#86EFAC" onclick="rateSM2(${card.id}, 4)">Nhớ tốt (${Math.round(card.interval * card.ease)} ngày)</button>
        </div>
      </div>
    </div>
  `;
}

function rateSM2(cardId, quality) {
  const card = state.cards.find(c => c.id === cardId);
  if (!card) return;

  if (quality < 3) {
    card.interval = 1;
  } else {
    card.interval = Math.round(card.interval * card.ease);
    card.ease = Math.max(1.3, card.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  }

  card.due = quality === 1 ? Date.now() : Date.now() + card.interval * 86400000;
  state.xp += 15;
  saveState();
  renderCurrentFlashcard();
}

// CÀI ĐẶT & CÁ NHÂN HÓA
function selectPersona(name, el) {
  state.persona = name;
  document.querySelectorAll('.persona-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  saveState();
}

function saveSettings() {
  state.apiKey = document.getElementById('gemini-api-key').value.trim();
  saveState();
  alert('Đã lưu cấu hình Gemini AI thành công!');
}

// KHỞI TẠO
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('gemini-api-key').value = state.apiKey;
  updateDashboardUI();
});
