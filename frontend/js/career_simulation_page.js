let currentScenario = null;
let currentScore = 0;
let currentStep = 1;
let totalSteps = 1; // şimdilik 1 senaryo varsayıyoruz
let currentTaskIndex = 0;
let inTaskFlow = true; // Görev adımlarında mıyız?

// Sayfa başlatıldığında çağrılır
export async function initializeCareerSimulation() {
    let user = null;

    // Method 1: From window.KariyerAI global object
    if (window.KariyerAI?.currentUser) {
        user = window.KariyerAI.currentUser;
        console.log("User loaded from KariyerAI global:", user);
    }

    // Method 2: From localStorage
    if (!user) {
        try {
            const userData = localStorage.getItem("kariyerAI_user");
            if (userData) {
                user = JSON.parse(userData);
                if (window.KariyerAI) {
                    window.KariyerAI.currentUser = user;
                }
                console.log("User loaded from localStorage:", user);
            }
        } catch (error) {
            console.error("Error reading from localStorage:", error);
        }
    }

    if (!user || !user.id) {
        showNotification("Kullanıcı bulunamadı. Lütfen tekrar giriş yapın.", "warning");
        return;
    }

    await loadSimulationScenario(user.id);
}

async function loadSimulationScenario(email) {
    // Yeni interaktif simülasyon sayfasına yönlendir
    showNotification("Yeni interaktif simülasyon deneyimi yükleniyor...", "info");
    setTimeout(() => {
        window.location.href = '../html/interactive_simulation.html';
    }, 1500);
}


// === Senaryoyu ekrana yazar ===
function displayScenario(scenario) {
    const container = document.getElementById("scenarioContainer");
    if (!container) return;

    document.getElementById("scenarioStep").textContent = `Senaryo ${currentStep} / ${totalSteps}`;
    document.getElementById("scenarioProgress").style.width = `${(currentStep / totalSteps) * 100}%`;

    container.innerHTML = `
        <div class="card-header">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-xl font-bold mb-2">${scenario.title}</h2>
                    <div class="flex items-center gap-4">
                        <span class="badge badge-secondary">${scenario.category}</span>
                        <span class="badge ${scenario.difficulty === "Zor" ? "badge-red" : "badge-blue"}">${scenario.difficulty}</span>
                    </div>
                </div>
                <div class="text-right">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fas fa-star text-yellow-500"></i>
                        <span class="text-sm">Mevcut Skor: ${currentScore}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Context -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 class="font-medium mb-2 flex items-center">
                <i class="fas fa-briefcase mr-2"></i>
                Genel Bağlam
            </h4>
            <p class="text-sm text-blue-800">${scenario.context}</p>
        </div>

        <!-- Situation -->
        <div class="mb-6">
            <h4 class="font-medium mb-3 flex items-center">
                <i class="fas fa-exclamation-circle mr-2"></i>
                Günün Kritik Durumu
            </h4>
            <p class="text-gray-700">${scenario.situation}</p>
        </div>

        <!-- Question -->
        <div class="mb-6">
            <h4 class="font-medium mb-3 flex items-center">
                <i class="fas fa-comment mr-2"></i>
                Karar Sorusu
            </h4>
            <p class="text-gray-800 font-medium">${scenario.question}</p>
        </div>

        <!-- Options -->
        <div class="mb-6" id="optionsContainer">
            <h4 class="font-medium mb-4">Cevabınızı seçin:</h4>
            <div class="space-y-3">
                ${scenario.options
                    .map(
                        (opt) => `
                    <div class="option-card" onclick="selectOption('${opt.id}')">
                        <input type="radio" name="answer" value="${opt.id}" id="option_${opt.id}">
                        <label for="option_${opt.id}" class="option-label">${opt.text}</label>
                    </div>`
                    )
                    .join("")}
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-between">
            <button class="btn btn-outline" disabled>
                <i class="fas fa-arrow-left mr-2"></i>Önceki
            </button>

            <div class="space-x-3">
                <button class="btn btn-primary" onclick="submitAnswer()">
                    Cevabı Gönder
                </button>
            </div>
        </div>
    `;
}

// === Günlük görevler listesi ===
function displayDailySchedule(tasks) {
    const container = document.getElementById("dailyScheduleContainer");
    const list = document.getElementById("dailyScheduleList");
    if (!container || !list) return;

    if (tasks.length === 0) {
        container.classList.add("hidden");
        return;
    }

    list.innerHTML = tasks
        .map(
            (task) => `
        <li class="border p-3 rounded">
            <div class="flex justify-between">
                <strong>${task.time} - ${task.task}</strong>
                <span class="badge badge-secondary">${task.priority}</span>
            </div>
            <p class="text-sm text-gray-700 mt-1">Departman: ${task.department} | Ekip Büyüklüğü: ${task.team_size}</p>
            <p class="text-sm text-gray-600">Araçlar: ${(task.tools || []).join(", ")}</p>
            <p class="text-sm text-gray-500">Tahmini süre: ${task.duration_min} dk</p>
        </li>`
        )
        .join("");

    container.classList.remove("hidden");
}

// === E-mailler listesi ===
function displayEmails(emails) {
    const container = document.getElementById("emailsContainer");
    const list = document.getElementById("emailsList");
    if (!container || !list) return;

    if (emails.length === 0) {
        container.classList.add("hidden");
        return;
    }

    list.innerHTML = emails
        .map(
            (mail) => `
        <li class="border p-3 rounded">
            <div class="font-medium">${mail.subject}</div>
            <p class="text-sm text-gray-700 mt-1"><strong>Gönderen:</strong> ${mail.from}</p>
            <p class="text-sm text-gray-600">${mail.summary}</p>
        </li>`
        )
        .join("");

    container.classList.remove("hidden");
}

// === Toplantılar listesi ===
function displayMeetings(meetings) {
    const container = document.getElementById("meetingsContainer");
    const list = document.getElementById("meetingsList");
    if (!container || !list) return;

    if (meetings.length === 0) {
        container.classList.add("hidden");
        return;
    }

    list.innerHTML = meetings
        .map(
            (meet) => `
        <li class="border p-3 rounded">
            <div class="flex justify-between">
                <strong>${meet.time}</strong>
                <span class="text-sm text-gray-500">${(meet.participants || []).join(", ")}</span>
            </div>
            <p class="text-sm text-gray-700 mt-1"><strong>Konu:</strong> ${meet.topic}</p>
            <p class="text-sm text-gray-600">${meet.summary}</p>
        </li>`
        )
        .join("");

    container.classList.remove("hidden");
}

// === Seçenek seçme ===
export function selectOption(optionId) {
    document.querySelectorAll(".option-card").forEach((card) => {
        card.classList.remove("selected");
    });
    const selectedCard = document.querySelector(`#option_${optionId}`).closest(".option-card");
    selectedCard.classList.add("selected");
}

// === Cevabı gönderme ===
export function submitAnswer() {
    const selectedOption = document.querySelector('input[name="answer"]:checked');
    if (!selectedOption) {
        showNotification("Lütfen bir seçenek seçin .", "warning");
        return;
    }

    const optionId = selectedOption.value;
    const chosen = currentScenario.options.find((o) => o.id === optionId);
    if (chosen) {
        currentScore += chosen.score;
        document.querySelector(".text-sm").textContent = `Mevcut Skor: ${currentScore}`;
        showAnswerFeedback(chosen.feedback);
    }
}

// === Cevap geri bildirimi ===
function showAnswerFeedback(feedbackText) {
    alert("Geri Bildirim:\n\n" + feedbackText);
}

// === Simülasyon zamanlayıcı ===
function setupSimulationTimer() {
    let timeLeft = 300;
    const timerElement = document.getElementById("simulationTimer");

    if (timerElement) {
        const timer = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;

            if (timeLeft <= 0) {
                clearInterval(timer);
                showNotification("Süre doldu! Simülasyon otomatik olarak tamamlanıyor.", "warning");
            }
            timeLeft--;
        }, 1000);
    }
}

// === Basit bildirim fonksiyonu ===
function showNotification(message, type = "info") {
    alert(message); // Basit çözüm, daha iyisi için toast ekleyebilirsin
}

// === Görev adımı gösterimi ===
async function showTaskStep() {
    const tasks = currentScenario.daily_schedule;
    if (currentTaskIndex >= tasks.length) {
        inTaskFlow = false;
        displayScenario(currentScenario); // Kritik soru ekranı
        return;
    }
    const task = tasks[currentTaskIndex];
    const container = document.getElementById("scenarioContainer");

    // Kullanıcı bilgisini al
    let user = window.KariyerAI?.currentUser || JSON.parse(localStorage.getItem("kariyerAI_user") || "{}");

    // Görev için LLM'den mini-senaryo çek
    let taskSim = null;
    try {
        const res = await fetch("http://127.0.0.1:5000/task-simulation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ task, user }) // <-- user da gönderiliyor!
        });
        const data = await res.json();
        if (data.success) {
            taskSim = data.data;
        }
    } catch (e) {
        // Hata olursa statik göster
    }

    container.innerHTML = `
        <div class="p-6">
            <h2 class="text-xl font-bold mb-4">Görev ${currentTaskIndex + 1} / ${tasks.length}</h2>
            <p><strong>Saat:</strong> ${task.time}</p>
            <p><strong>Görev:</strong> ${task.task}</p>
            <p><strong>Öncelik:</strong> ${task.priority}</p>
            <p><strong>Departman:</strong> ${task.department}</p>
            <p><strong>Ekip:</strong> ${task.team_size}</p>
            <p><strong>Araçlar:</strong> ${(task.tools || []).join(", ")}</p>
            <p><strong>Süre:</strong> ${task.duration_min} dk</p>
            ${taskSim ? renderTaskSimulation(taskSim) : ""}
            <button class="btn btn-primary mt-6" id="nextTaskBtn">Görevi Tamamla</button>
        </div>
    `;
    document.getElementById("nextTaskBtn").onclick = nextTaskStep;
}

function renderTaskSimulation(sim) {
    return `
        ${sim.emails && sim.emails.length ? `
            <div class="mb-4">
                <h4 class="font-medium mb-2">Örnek E-postalar:</h4>
                <ul>
                    ${sim.emails.map(mail => `<li><b>${mail.from}</b>: <b>${mail.subject}</b> - ${mail.summary}</li>`).join("")}
                </ul>
            </div>
        ` : ""}
        ${sim.code_snippet ? `<div class="mb-4"><b>Kod Snippet:</b><pre>${sim.code_snippet}</pre></div>` : ""}
        ${sim.error_message ? `<div class="mb-4"><b>Hata Mesajı:</b> ${sim.error_message}</div>` : ""}
        ${sim.customer_request ? `<div class="mb-4"><b>Müşteri İsteği:</b> ${sim.customer_request}</div>` : ""}
        ${sim.test_result ? `<div class="mb-4"><b>Test Sonucu:</b> ${sim.test_result}</div>` : ""}
        ${sim.observation_report ? `<div class="mb-4"><b>Gözlem Raporu:</b> ${sim.observation_report}</div>` : ""}
        ${sim.meeting_summary ? `<div class="mb-4"><b>Toplantı Özeti:</b> ${sim.meeting_summary}</div>` : ""}
        ${sim.mini_event ? `<div class="mb-4"><b>Olay:</b> ${sim.mini_event}</div>` : ""}
        ${sim.decision ? `
            <div class="mb-4">
                <b>${sim.decision.question}</b>
                <ul>
                    ${sim.decision.options.map(opt => `
                        <li>
                            <input type="radio" name="task_decision" value="${opt.id}" id="opt_${opt.id}">
                            <label for="opt_${opt.id}">${opt.text}</label>
                        </li>
                    `).join("")}
                </ul>
            </div>
        ` : ""}
    `;
}

function nextTaskStep() {
    currentTaskIndex++;
    showTaskStep();
}

function startTaskFlow() {
    if (!currentScenario || !currentScenario.daily_schedule) return;
    currentTaskIndex = 0;
    inTaskFlow = true;
    showTaskStep();
}