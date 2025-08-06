let currentUser = null;
let currentScenario = null;
let currentTask = null;
let currentTaskIndex = 0;
let totalScore = 0;
let completedTasks = 0;
let startTime = null;
let currentTimer = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeUser();
    setupEventListeners();
    checkAutoStart();
});

function checkAutoStart() {
    const urlParams = new URLSearchParams(window.location.search);
    const isPersonalized = urlParams.get('personalized');
    
    if (isPersonalized === 'true') {
        setTimeout(() => {
            if (currentUser) {
                startSimulation();
            }
        }, 1000);
    }
}

function initializeUser() {
    if (window.KariyerAI?.currentUser) {
        currentUser = window.KariyerAI.currentUser;
    } else {
        try {
            const userData = localStorage.getItem("kariyerAI_user");
            if (userData) {
                currentUser = JSON.parse(userData);
                if (window.KariyerAI) {
                    window.KariyerAI.currentUser = currentUser;
                }
            }
        } catch (error) {
            console.error("Kullanıcı bilgisi alınamadı:", error);
        }
    }

    if (!currentUser) {
        console.log("User not found, creating temporary user for simulation");
        currentUser = {
            id: 'temp_' + Date.now(),
            temp_user: true,
            current_title: 'Simulation User',
            experience_level: 'intermediate'
        };
        
        const personalityData = localStorage.getItem('personality_assessment_temp');
        if (personalityData) {
            try {
                currentUser.personality_assessment = JSON.parse(personalityData);
            } catch (error) {
                console.error("Personality data parse error:", error);
            }
        }
    }
}

function setupEventListeners() {
    document.getElementById('emailBody').addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            sendEmail();
        }
    });

    document.getElementById('meetingInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            speakInMeeting();
        }
    });

    document.getElementById('codeEditor').addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.selectionStart;
            const end = this.selectionEnd;
            this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
            this.selectionStart = this.selectionEnd = start + 4;
        }
    });
}

// Start simulation
window.startSimulation = async function() {
    if (!currentUser) return;

    // Check if user has personality assessment
    const hasPersonalityAssessment = currentUser.personality_assessment && 
                                   currentUser.personality_assessment.personality_type;
    
    if (!hasPersonalityAssessment) {
        showPersonalityTestWarning();
        return;
    }

    showLoading("Kişilik test sonuçlarınıza göre simülasyon hazırlanıyor...");
    
    try {
        const response = await fetch(`http://127.0.0.1:5000/career-simulation/${currentUser.id}`);
        const data = await response.json();

        if (data.success && data.data) {
            currentScenario = data.data;
            loadTasks();
            hideElement('welcomeScreen');
            startTimer();
            showNotification(`${currentUser.personality_assessment.personality_type} kişiliğinize özel simülasyon başladı!`, "success");
        } else {
            showNotification(data.message || "Simülasyon yüklenemedi", "error");
        }
    } catch (error) {
        console.error("Simülasyon yükleme hatası:", error);
        showNotification("Sunucu bağlantı hatası", "error");
    } finally {
        hideLoading();
    }
}

// Show personality test warning
function showPersonalityTestWarning() {
    const warningHtml = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 12px; text-align: center; margin: 2rem; max-width: 600px; margin: 2rem auto;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🧠</div>
            <h3 style="font-size: 1.5rem; margin-bottom: 1rem;">Kişilik Testi Gerekli!</h3>

            <p style="margin-bottom: 1.5rem; font-size: 1.1rem; opacity: 0.9; color: white;">

                Size özel simülasyon hazırlayabilmek için önce kişilik testinizi tamamlamanız gerekiyor. 
                Bu sayede zorlik seviyesi, öğrenme stili ve senaryolar size göre ayarlanacak.
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                <button onclick="goToPersonalityTest()" style="background: white; color: #667eea; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    <i class="fas fa-brain" style="margin-right: 0.5rem;"></i>
                    Kişilik Testini Çöz
                </button>
                <button onclick="hidePersonalityTestWarning()" style="background: transparent; color: white; border: 2px solid rgba(255,255,255,0.3); padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    <i class="fas fa-times" style="margin-right: 0.5rem;"></i>
                    Şimdilik Geç
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('welcomeScreen').innerHTML = warningHtml;
    showElement('welcomeScreen');
}

window.goToPersonalityTest = function() {
    window.location.href = '../html/personality_assessment.html';
}

window.hidePersonalityTestWarning = function() {
    showLoading("Genel simülasyon yükleniyor...");
    setTimeout(async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/career-simulation/${currentUser.id}`);
            const data = await response.json();

            if (data.success && data.data) {
                currentScenario = data.data;
                loadTasks();
                hideElement('welcomeScreen');
                startTimer();
                showNotification("Genel simülasyon başladı! Daha kişisel deneyim için kişilik testini çözebilirsiniz.", "info");
            } else {
                showNotification(data.message || "Simülasyon yüklenemedi", "error");
            }
        } catch (error) {
            console.error("Simülasyon yükleme hatası:", error);
            showNotification("Sunucu bağlantı hatası", "error");
        } finally {
            hideLoading();
        }
    }, 1000);
}

function loadTasks() {
    const taskList = document.getElementById('taskList');
    const tasks = currentScenario.daily_schedule || [];
    
    taskList.innerHTML = '';
    
    tasks.forEach((task, index) => {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        taskCard.onclick = () => selectTask(index);
        
        taskCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <strong style="font-size: 0.85rem; font-weight: 700; color: #ffffff; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">${task.time}</strong>
                <span style="font-size: 0.7rem; background: rgba(255,255,255,0.4); color: #1f2937; padding: 0.25rem 0.6rem; border-radius: 8px; font-weight: 600;">
                    ${task.priority}
                </span>
            </div>
            <p style="font-size: 0.85rem; margin-bottom: 0.6rem; line-height: 1.4; font-weight: 600; color: #ffffff; text-shadow: 0 1px 2px rgba(0,0,0,0.15);">${task.task}</p>
            <div style="font-size: 0.75rem; opacity: 0.95; line-height: 1.3; color: rgba(255,255,255,0.95);">
                <p style="margin-bottom: 0.25rem; font-weight: 500;">📍 ${task.department} | 👥 ${task.team_size} kişi</p>
                <p style="font-weight: 500;">⏱️ ${task.duration_min} dakika</p>
            </div>
        `;
        
        taskList.appendChild(taskCard);
    });

    updateProgressDisplay();
}

async function selectTask(index) {
    currentTaskIndex = index;
    currentTask = currentScenario.daily_schedule[index];
    
    document.querySelectorAll('.task-card').forEach(card => {
        card.classList.remove('active');
    });
    
    document.querySelectorAll('.task-card')[index].classList.add('active');
        document.getElementById('currentTaskInfo').textContent = 
        `${currentTask.time} - ${currentTask.task}`;
    
    await loadTaskSimulation();
}

async function loadTaskSimulation() {
    showLoading("Görev senaryosu hazırlanıyor...");
    
    try {
        const response = await fetch('http://127.0.0.1:5000/task-simulation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                task: currentTask,
                user: currentUser
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.data) {
            displayTaskInterface(data.data);
        } else {
            showNotification("Görev simülasyonu yüklenemedi", "error");
        }
    } catch (error) {
        console.error("Task simulation error:", error);
        showNotification("Görev simülasyonu yükleme hatası", "error");
    } finally {
        hideLoading();
    }
}

function displayTaskInterface(taskData) {
    hideAllInterfaces();
    
    switch (taskData.type) {
        case 'email':
            showEmailInterface(taskData);
            break;
        case 'coding':
            showCodeInterface(taskData);
            break;
        case 'meeting':
            showMeetingInterface(taskData);
            break;
        default:
            showGeneralInterface(taskData);
    }
}

function hideAllInterfaces() {
    ['emailInterface', 'codeInterface', 'meetingInterface', 'generalInterface'].forEach(id => {
        hideElement(id);
    });
}

// Email Interface
function showEmailInterface(taskData) {
    showElement('emailInterface');
    
    document.getElementById('emailScenario').textContent = taskData.scenario;
    
    if (taskData.incoming_email) {
        const incomingEmail = document.getElementById('incomingEmail');
        incomingEmail.innerHTML = `
            <strong>Gönderen:</strong> ${taskData.incoming_email.from}<br>
            <strong>Konu:</strong> ${taskData.incoming_email.subject}<br>
            <strong>Öncelik:</strong> <span style="color: ${getPriorityColor(taskData.incoming_email.priority)}">${taskData.incoming_email.priority}</span><br><br>
            ${taskData.incoming_email.body}
        `;
        
        document.getElementById('emailSubject').value = `Re: ${taskData.incoming_email.subject}`;
    }
    
    document.getElementById('emailConversation').innerHTML = '';
}

window.sendEmail = async function() {
    const subject = document.getElementById('emailSubject').value.trim();
    const body = document.getElementById('emailBody').value.trim();
    
    if (!subject || !body) {
        showNotification("Lütfen konu ve mesaj alanlarını doldurun", "warning");
        return;
    }
    
    addEmailToConversation(body, 'user');
    
    document.getElementById('emailBody').value = '';
    
    showLoading("AI yanıtı bekleniyor...");
    
    try {
        const response = await fetch('http://127.0.0.1:5000/email-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: body,
                context: { scenario: document.getElementById('emailScenario').textContent },
                user_role: currentUser.current_title || 'Employee'
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.data) {
            addEmailToConversation(data.data.reply, 'ai');
            
            if (data.data.feedback) {
                showFeedback(data.data.feedback);
            }
            
            const score = calculateEmailScore(data.data);
            updateScore(score);
            
        } else {
            showNotification("AI yanıtı alınamadı", "error");
        }
    } catch (error) {
        console.error("Email chat error:", error);
        showNotification("Email gönderme hatası", "error");
    } finally {
        hideLoading();
    }
}

function addEmailToConversation(message, sender) {
    const conversation = document.getElementById('emailConversation');
    const messageDiv = document.createElement('div');
    messageDiv.className = `email-message ${sender}`;
    
    const timestamp = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const senderName = sender === 'user' ? 'Siz' : 'Müşteri/İş Ortağı';
    
    messageDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <strong>${senderName}</strong>
            <span style="color: #6b7280; font-size: 0.875rem;">${timestamp}</span>
        </div>
        <p>${message}</p>
    `;
    
    conversation.appendChild(messageDiv);
    conversation.scrollTop = conversation.scrollHeight;
}

function calculateEmailScore(responseData) {
    let score = 50; 
    
    if (responseData.satisfaction === 'Memnun') score += 30;
    else if (responseData.satisfaction === 'Nötr') score += 10;
    
    if (responseData.tone === 'Profesyonel') score += 20;
    
    return Math.min(score, 100);
}

window.saveEmailDraft = function() {
    const body = document.getElementById('emailBody').value.trim();
    if (body) {
        localStorage.setItem('emailDraft', body);
        showNotification("Taslak kaydedildi", "success");
    }
}

// Code Interface
function showCodeInterface(taskData) {
    showElement('codeInterface');
    
    document.getElementById('codeScenario').textContent = taskData.scenario;
    
    const problemDiv = document.getElementById('codeProblem');
    problemDiv.innerHTML = `
        <h4>Problem:</h4>
        <p>${taskData.problem}</p>
        <h4>Gereksinimler:</h4>
        <ul>
            ${taskData.requirements.map(req => `<li>${req}</li>`).join('')}
        </ul>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
            <div>
                <strong>Örnek Girdi:</strong>
                <pre style="background: #f3f4f6; padding: 0.5rem; border-radius: 4px; margin-top: 0.5rem;">${taskData.example_input}</pre>
            </div>
            <div>
                <strong>Beklenen Çıktı:</strong>
                <pre style="background: #f3f4f6; padding: 0.5rem; border-radius: 4px; margin-top: 0.5rem;">${taskData.expected_output}</pre>
            </div>
        </div>
    `;
    
    document.getElementById('codeEditor').value = '';
    document.getElementById('codeEvaluation').innerHTML = '';
}

window.runCode = function() {
    const code = document.getElementById('codeEditor').value.trim();
    if (!code) {
        showNotification("Lütfen kod yazın", "warning");
        return;
    }
    
    // Simulate code execution
    const evaluationDiv = document.getElementById('codeEvaluation');
    evaluationDiv.innerHTML = `
        <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 1rem; margin-top: 1rem;">
            <h4><i class="fas fa-play"></i> Kod Çalıştırıldı</h4>
            <p>Kod başarıyla çalıştırıldı. Değerlendirme için "Değerlendir" butonuna tıklayın.</p>
        </div>
    `;
}

window.evaluateCode = async function() {
    const code = document.getElementById('codeEditor').value.trim();
    if (!code) {
        showNotification("Lütfen kod yazın", "warning");
        return;
    }
    
    showLoading("Kod değerlendiriliyor...");
    
    try {
        const problemText = document.querySelector('#codeProblem p').textContent;
        const requirements = Array.from(document.querySelectorAll('#codeProblem li')).map(li => li.textContent);
        
        const response = await fetch('http://127.0.0.1:5000/evaluate-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: code,
                problem: problemText,
                requirements: requirements
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.data) {
            displayCodeEvaluation(data.data);
            updateScore(data.data.score);
        } else {
            showNotification("Kod değerlendirilemedi", "error");
        }
    } catch (error) {
        console.error("Code evaluation error:", error);
        showNotification("Kod değerlendirme hatası", "error");
    } finally {
        hideLoading();
    }
}

function displayCodeEvaluation(evaluation) {
    const evaluationDiv = document.getElementById('codeEvaluation');
    
    evaluationDiv.innerHTML = `
        <div style="background: white; border-radius: 8px; padding: 1.5rem; margin-top: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h4><i class="fas fa-chart-line"></i> Kod Değerlendirmesi</h4>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0;">
                <div style="text-align: center; padding: 1rem; background: #f3f4f6; border-radius: 8px;">
                    <div style="font-size: 2rem; font-weight: bold; color: ${getScoreColor(evaluation.score)}">${evaluation.score}</div>
                    <div>Toplam Puan</div>
                </div>
                
                <div style="text-align: center; padding: 1rem; background: #f3f4f6; border-radius: 8px;">
                    <div style="font-weight: bold;">${evaluation.correctness}</div>
                    <div>Doğruluk</div>
                </div>
                
                <div style="text-align: center; padding: 1rem; background: #f3f4f6; border-radius: 8px;">
                    <div style="font-weight: bold;">${evaluation.efficiency}</div>
                    <div>Verimlilik</div>
                </div>
                
                <div style="text-align: center; padding: 1rem; background: #f3f4f6; border-radius: 8px;">
                    <div style="font-weight: bold;">${evaluation.readability}</div>
                    <div>Okunabilirlik</div>
                </div>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
                <h5>📝 Geri Bildirim</h5>
                <p>${evaluation.feedback}</p>
            </div>
            
            ${evaluation.suggestions.length > 0 ? `
                <div style="background: #dcfce7; border: 1px solid #16a34a; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
                    <h5>💡 İyileştirme Önerileri</h5>
                    <ul>
                        ${evaluation.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${evaluation.corrected_code ? `
                <div style="background: #f8fafc; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
                    <h5>✅ Düzeltilmiş Kod</h5>
                    <pre style="background: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 4px; overflow-x: auto;"><code>${evaluation.corrected_code}</code></pre>
                </div>
            ` : ''}
        </div>
    `;
    
    showFeedback(evaluation.explanation);
}

// Meeting Interface
function showMeetingInterface(taskData) {
    showElement('meetingInterface');
    
    // Meeting chat system
    window.meetingChatSystem.initializeParticipants(taskData.participants || [
        { name: 'Proje Yöneticisi', role: 'PM', personality: 'Zaman odaklı, koordinatör' },
        { name: 'Senior Developer', role: 'Tech Lead', personality: 'Teknik detayları seven' },
        { name: 'UX Designer', role: 'Designer', personality: 'Kullanıcı deneyimi odaklı' },
        { name: 'QA Engineer', role: 'QA', personality: 'Kalite güvencesi odaklı' }
    ]);
    
    document.getElementById('meetingScenario').textContent = taskData.scenario;
    
    // Agenda
    const agendaDiv = document.getElementById('meetingAgenda');
    agendaDiv.innerHTML = `
        <h4>📋 Gündem</h4>
        <ul>
            ${(taskData.agenda || ['Sprint planning', 'Öncelik belirleme', 'Kaynak tahsisi']).map(item => `<li>${item}</li>`).join('')}
        </ul>
    `;
    
    // Participants
    const participantsDiv = document.getElementById('meetingParticipants');
    const participants = taskData.participants || [
        { name: 'Proje Yöneticisi', role: 'PM', personality: 'Zaman odaklı, koordinatör' },
        { name: 'Senior Developer', role: 'Tech Lead', personality: 'Teknik detayları seven' },
        { name: 'UX Designer', role: 'Designer', personality: 'Kullanıcı deneyimi odaklı' },
        { name: 'QA Engineer', role: 'QA', personality: 'Kalite güvencesi odaklı' }
    ];
    
    participantsDiv.innerHTML = `
        <h4>👥 Katılımcılar</h4>
        ${participants.map(p => `
            <div class="participant" style="background: #f9fafb; padding: 0.75rem; margin-bottom: 0.5rem; border-radius: 6px; border-left: 3px solid #3b82f6;">
                <strong style="color: #1f2937;">${p.name}</strong> - <span style="color: #6b7280;">${p.role}</span>
                <br><small style="color: #9ca3af; font-style: italic;">${p.personality}</small>
            </div>
        `).join('')}
    `;
    
    // Discussion
    const discussionDiv = document.getElementById('meetingDiscussion');
    discussionDiv.innerHTML = `
        <div style="text-align: center; color: #6b7280; padding: 2rem; background: #f9fafb; border-radius: 8px; margin-bottom: 1rem;">
            <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 1rem; color: #3b82f6;"></i>
            <p><strong>Toplantı başladı!</strong></p>
            <p>Sprint planning toplantımıza hoş geldiniz. İlk görüşünüzü paylaşın.</p>
        </div>
    `;
    
    setTimeout(() => {
        addEnhancedMeetingMessage(
            "Merhaba ekip! Bugün sprint planning toplantımızdayız. Bu sprint'te hangi feature'ları önceliklendirmeli ve nasıl bir yaklaşım izlemeliyiz?",
            'Proje Yöneticisi',
            'ai',
            { emotion: 'neutral', action_item: 'Sprint önceliklerini belirlemek' }
        );
    }, 1000);
}

window.speakInMeeting = async function() {
    const input = document.getElementById('meetingInput');
    const message = input.value.trim();
    
    if (!message) {
        showNotification("Lütfen bir şey yazın", "warning");
        return;
    }
    
    addEnhancedMeetingMessage(message, 'Siz', 'user');
    input.value = '';

    showTypingIndicator();
    
    try {

        const nextSpeaker = window.meetingChatSystem.getNextSpeaker(message);
        
        const responseData = await window.meetingChatSystem.generateResponse(
            message, 
            nextSpeaker, 
            {
                topic: currentScenario?.title || 'Sprint Planning',
                goals: ['Sprint önceliklerini belirlemek', 'Kaynak tahsisi yapmak', 'Zaman çizelgesi oluşturmak']
            }
        );
        
        hideTypingIndicator();
        
        addEnhancedMeetingMessage(
            responseData.response, 
            nextSpeaker, 
            'ai', 
            responseData
        );
        
        // Meeting system to save conversation
        window.meetingChatSystem.addMessage('Siz', message);
        window.meetingChatSystem.addMessage(nextSpeaker, responseData.response, responseData);
        
        // Skor update
        const score = calculateMeetingScore(message, responseData);
        updateScore(score);
        
        if (Math.random() < 0.3 && window.meetingChatSystem.conversationHistory.length > 3) {
            setTimeout(() => {
                addFollowUpComment(message, nextSpeaker);
            }, 2000 + Math.random() * 3000);
        }
        
    } catch (error) {
        hideTypingIndicator();
        console.error('Meeting chat error:', error);
        
        // Fallback 
        const fallbackResponses = [
            "İlginç bir bakış açısı. Bu konuyu daha detaylı ele alalım.",
            "Bu önerinizin implementation sürecini konuşmalıyız.",
            "Risk analizi açısından nasıl değerlendiriyoruz?",
            "Müşteri feedback'i bu konuda nasıl?",
            "Timeline açısından uygulanabilir mi?"
        ];
        
        setTimeout(() => {
            addEnhancedMeetingMessage(
                fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
                'Proje Yöneticisi',
                'ai',
                { emotion: 'neutral' }
            );
            updateScore(15);
        }, 1500);
    }
}

function addEnhancedMeetingMessage(message, speaker, type, extraData = {}) {
    const discussionDiv = document.getElementById('meetingDiscussion');
    const messageDiv = document.createElement('div');
    
    const timestamp = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    
    const speakerEmojis = {
        'Siz': '👤',
        'Proje Yöneticisi': '👨‍💼',
        'Senior Developer': '👨‍💻',
        'UX Designer': '🎨',
        'QA Engineer': '🔍'
    };
    
    const emotionColors = {
        'positive': '#10b981',
        'concerned': '#f59e0b',
        'excited': '#8b5cf6',
        'skeptical': '#ef4444',
        'neutral': '#6b7280'
    };
    
    const borderColor = type === 'user' ? '#3b82f6' : emotionColors[extraData.emotion] || '#8b5cf6';
    const bgColor = type === 'user' ? '#dbeafe' : '#f3e8ff';
    
    let messageContent = `
        <div style="background: ${bgColor}; padding: 1rem; margin-bottom: 1rem; border-radius: 8px; border-left: 4px solid ${borderColor}; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.2rem;">${speakerEmojis[speaker] || '👤'}</span>
                    <strong style="color: #1f2937;">${speaker}</strong>
                    ${extraData.emotion && extraData.emotion !== 'neutral' ? 
                        `<span style="background: ${emotionColors[extraData.emotion]}; color: white; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.75rem;">${extraData.emotion}</span>` : ''}
                </div>
                <span style="color: #6b7280; font-size: 0.875rem;">${timestamp}</span>
            </div>
            <p style="margin-bottom: ${extraData.follow_up_question || extraData.action_item ? '0.5rem' : '0'}; line-height: 1.5;">${message}</p>`;
    
    if (extraData.follow_up_question) {
        messageContent += `
            <div style="background: rgba(59, 130, 246, 0.1); padding: 0.5rem; border-radius: 6px; margin-top: 0.5rem; border-left: 3px solid #3b82f6;">
                <small style="color: #3b82f6; font-weight: 500;">❓ ${extraData.follow_up_question}</small>
            </div>`;
    }
    
    if (extraData.action_item) {
        messageContent += `
            <div style="background: rgba(16, 185, 129, 0.1); padding: 0.5rem; border-radius: 6px; margin-top: 0.5rem; border-left: 3px solid #10b981;">
                <small style="color: #10b981; font-weight: 500;">✅ ${extraData.action_item}</small>
            </div>`;
    }
    
    messageContent += '</div>';
    messageDiv.innerHTML = messageContent;
    
    discussionDiv.appendChild(messageDiv);
    discussionDiv.scrollTop = discussionDiv.scrollHeight;
    
    if (type === 'ai') {
    }
}

// Typing indicator
function showTypingIndicator() {
    const discussionDiv = document.getElementById('meetingDiscussion');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div style="background: #f9fafb; padding: 1rem; margin-bottom: 1rem; border-radius: 8px; border-left: 4px solid #6b7280;">
            <div style="display: flex; align-items: center; gap: 0.5rem; color: #6b7280;">
                <div class="typing-animation">
                    <span></span><span></span><span></span>
                </div>
                <em>Birisi yazıyor...</em>
            </div>
        </div>
        <style>
        .typing-animation span {
            display: inline-block;
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background-color: #6b7280;
            margin: 0 1px;
            animation: typing 1.4s infinite ease-in-out;
        }
        .typing-animation span:nth-child(2) { animation-delay: 0.2s; }
        .typing-animation span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing {
            0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
            40% { opacity: 1; transform: scale(1); }
        }
        </style>
    `;
    discussionDiv.appendChild(typingDiv);
    discussionDiv.scrollTop = discussionDiv.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function calculateMeetingScore(userMessage, aiResponse) {
    let score = 10; 
    
    const message = userMessage.toLowerCase();
    
    
    if (message.includes('öneri') || message.includes('öner')) score += 5;
    if (message.includes('risk') || message.includes('problem')) score += 8;
    if (message.includes('çözüm') || message.includes('alternatif')) score += 10;
    if (message.includes('zaman') || message.includes('deadline')) score += 6;
    if (message.includes('müşteri') || message.includes('kullanıcı')) score += 7;
    if (message.includes('test') || message.includes('kalite')) score += 6;
    
    
    if (message.length > 50) score += 5;
    if (message.length > 100) score += 5;
    if (aiResponse.emotion === 'positive') score += 5;
    if (aiResponse.emotion === 'excited') score += 8;
    
    return Math.min(score, 25); 
}

async function addFollowUpComment(originalMessage, previousSpeaker) {
    const otherParticipants = ['Proje Yöneticisi', 'Senior Developer', 'UX Designer', 'QA Engineer']
        .filter(p => p !== previousSpeaker);
    
    const speaker = otherParticipants[Math.floor(Math.random() * otherParticipants.length)];
    
    const followUpPrompts = [
        `${previousSpeaker} iyi bir nokta belirtti. Ben de eklemek istiyorum ki`,
        `Bu konuda ${speaker} olarak farklı bir açıdan bakarsak`,
        `Önceki yoruma ek olarak, bizim departman açısından`,
        `Bu önerinin yan etkileri de olabilir. Örneğin`
    ];
    
    const prompt = followUpPrompts[Math.floor(Math.random() * followUpPrompts.length)];
    
    try {
        const responseData = await window.meetingChatSystem.generateResponse(
            prompt + " " + originalMessage,
            speaker,
            { topic: 'Sprint Planning Devam', goals: ['Ek görüş bildirmek'] }
        );
        
        addEnhancedMeetingMessage(responseData.response, speaker, 'ai', responseData);
        updateScore(5); 
    } catch (error) {
        console.error('Follow-up comment error:', error);
    }
}

function addMeetingMessage(message, speaker, type) {
    const discussionDiv = document.getElementById('meetingDiscussion');
    const messageDiv = document.createElement('div');
    
    const timestamp = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div style="background: ${type === 'user' ? '#dbeafe' : '#f3e8ff'}; padding: 1rem; margin-bottom: 1rem; border-radius: 8px; border-left: 4px solid ${type === 'user' ? '#3b82f6' : '#8b5cf6'};">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <strong>${speaker}</strong>
                <span style="color: #6b7280; font-size: 0.875rem;">${timestamp}</span>
            </div>
            <p>${message}</p>
        </div>
    `;
    
    discussionDiv.appendChild(messageDiv);
    discussionDiv.scrollTop = discussionDiv.scrollHeight;
}

// General Interface
function showGeneralInterface(taskData) {
    showElement('generalInterface');
    
    document.getElementById('taskTitle').textContent = taskData.scenario || 'Genel Görev';
    
    const content = document.getElementById('taskContent');
    content.innerHTML = `
        ${taskData.mini_event ? `<div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
            <h4>📢 Olay</h4>
            <p>${taskData.mini_event}</p>
        </div>` : ''}
        
        ${taskData.challenge ? `<div style="background: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
            <h4>⚠️ Zorluk</h4>
            <p>${taskData.challenge}</p>
        </div>` : ''}
        
        ${taskData.decision ? `
            <div style="background: #f3f4f6; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem;">
                <h4>🤔 ${taskData.decision.question}</h4>
                <div style="margin-top: 1rem;">
                    ${taskData.decision.options.map(opt => `
                        <div style="margin-bottom: 0.5rem;">
                            <input type="radio" name="decision" value="${opt.id}" id="dec_${opt.id}">
                            <label for="dec_${opt.id}" style="margin-left: 0.5rem;">${opt.text}</label>
                        </div>
                    `).join('')}
                </div>
                <button class="action-button" style="margin-top: 1rem;" onclick="submitDecision()">Kararımı Ver</button>
            </div>
        ` : ''}
        
        ${taskData.resources ? `
            <div style="background: #dcfce7; border: 1px solid #16a34a; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                <h4>📚 Kaynaklar</h4>
                <ul>
                    ${taskData.resources.map(resource => `<li>${resource}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
        
        <button class="action-button" onclick="completeCurrentTask()">Görevi Tamamla</button>
    `;
}

window.submitDecision = function() {
    const selected = document.querySelector('input[name="decision"]:checked');
    if (!selected) {
        showNotification("Lütfen bir seçenek seçin", "warning");
        return;
    }

    const score = Math.floor(Math.random() * 30) + 20; 
    updateScore(score);
    
    showFeedback(`Kararınız kaydedildi. ${score} puan kazandınız!`);
    
    document.querySelector('button[onclick="submitDecision()"]').disabled = true;
}

// Utility Functions
window.completeCurrentTask = function() {
    if (!currentTask) return;
    
    const taskCard = document.querySelectorAll('.task-card')[currentTaskIndex];
    taskCard.classList.add('completed');
    
    completedTasks++;
    updateProgressDisplay();
    
    fetch('http://127.0.0.1:5000/complete-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: currentUser.id,
            task_id: currentTaskIndex,
            score: totalScore,
            completion_data: {
                task_name: currentTask.task,
                completion_time: new Date().toISOString()
            }
        })
    }).catch(err => console.error('Task completion error:', err));
    
    showNotification(`Görev tamamlandı! ${completedTasks}/${currentScenario.daily_schedule.length}`, "success");
    
    if (completedTasks >= currentScenario.daily_schedule.length) {
        setTimeout(() => {
            showFinalResults();
        }, 1000);
    }
}

function showFinalResults() {
    const averageScore = Math.floor(totalScore / completedTasks);
    
    alert(`🎉 Simülasyon Tamamlandı!\n\nToplam Skor: ${totalScore}\nOrtalama Skor: ${averageScore}\nTamamlanan Görevler: ${completedTasks}/${currentScenario.daily_schedule.length}\n\nTebrikler!`);
    
    setTimeout(() => {
        window.location.href = '../html/dashboard_page.html';
    }, 3000);
}

window.getHint = async function() {
    if (!currentTask) {
        showNotification("Önce bir görev seçin", "warning");
        return;
    }
    
    try {
        const response = await fetch('http://127.0.0.1:5000/get-hint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                task: currentTask,
                progress: {
                    completed_tasks: completedTasks,
                    current_score: totalScore
                },
                user_role: currentUser.current_title || 'Employee'
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.data) {
            showHint(data.data.hint);
        } else {
            showNotification("İpucu alınamadı", "error");
        }
    } catch (error) {
        console.error("Hint error:", error);
        showNotification("İpucu alınamadı", "error");
    }
}

function showHint(hintText) {
    const hintDisplay = document.getElementById('hintDisplay');
    document.getElementById('hintText').textContent = hintText;
    showElement('hintDisplay');
    
    setTimeout(() => {
        hideElement('hintDisplay');
    }, 10000);
}

function showFeedback(feedbackText) {
    const feedbackDisplay = document.getElementById('feedbackDisplay');
    document.getElementById('feedbackText').textContent = feedbackText;
    showElement('feedbackDisplay');
    
    setTimeout(() => {
        hideElement('feedbackDisplay');
    }, 8000);
}

function updateScore(points) {
    totalScore += points;
    document.getElementById('totalScore').textContent = `Skor: ${totalScore}`;
    document.getElementById('scoreDisplay').textContent = totalScore;
    document.getElementById('averageScore').textContent = completedTasks > 0 ? Math.floor(totalScore / completedTasks) : 0;
}

function updateProgressDisplay() {
    const total = currentScenario?.daily_schedule?.length || 1;
    const progress = (completedTasks / total) * 100;
    
    document.getElementById('overallProgress').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `${completedTasks} / ${total} görev tamamlandı`;
    document.getElementById('completedTasks').textContent = completedTasks;
}

function startTimer() {
    startTime = new Date();
    updateTimer();
    currentTimer = setInterval(updateTimer, 1000);
}

function updateTimer() {
    if (!startTime) return;
    
    const now = new Date();
    const elapsed = Math.floor((now - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    document.getElementById('simulationTimer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('totalTime').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Utility functions
function showElement(id) {
    document.getElementById(id).classList.remove('hidden');
}

function hideElement(id) {
    document.getElementById(id).classList.add('hidden');
}

function showLoading(message = "Yükleniyor...") {
    // Basic loading 
    if (!document.getElementById('loadingIndicator')) {
        const loader = document.createElement('div');
        loader.id = 'loadingIndicator';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            color: white;
            font-size: 1.2rem;
        `;
        loader.innerHTML = `<div><i class="fas fa-spinner fa-spin"></i> ${message}</div>`;
        document.body.appendChild(loader);
    }
}

function hideLoading() {
    const loader = document.getElementById('loadingIndicator');
    if (loader) {
        loader.remove();
    }
}

function showNotification(message, type = 'info') {
    // Basic notification system
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function getPriorityColor(priority) {
    switch (priority?.toLowerCase()) {
        case 'yüksek': return '#ef4444';
        case 'orta': return '#f59e0b';
        case 'düşük': return '#10b981';
        default: return '#6b7280';
    }
}

function getScoreColor(score) {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
}