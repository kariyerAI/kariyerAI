export function initializeCareerSimulation() {
  loadSimulationScenarios()
  setupSimulationTimer()
}

export function loadSimulationScenarios() {
  const scenarios = [
    {
      id: 1,
      title: "Teknik Mülakat: React Hooks",
      category: "Teknik",
      difficulty: "Orta",
      situation: "Bir React projesinde component'ler arası state paylaşımı için hangi yaklaşımı tercih edersiniz?",
      context: "Şirket: TechCorp | Pozisyon: Senior Frontend Developer | Mülakatçı: Teknik Lead",
      question:
        "Büyük bir e-ticaret uygulamasında kullanıcı sepeti bilgisini birden fazla component'te kullanmanız gerekiyor. Bu durumda hangi state yönetim yaklaşımını tercih edersiniz ve neden?",
      options: [
        {
          id: "a",
          text: "Props drilling kullanarak parent component'ten child component'lere veri geçiririm",
          feedback:
            "Props drilling küçük uygulamalar için uygun olsa da, büyük uygulamalarda maintainability sorunlarına yol açar.",
          score: 2,
        },
        {
          id: "b",
          text: "Context API kullanarak global state oluştururum",
          feedback: "Doğru yaklaşım! Context API bu tür durumlar için idealdir ve React'ın built-in çözümüdür.",
          score: 5,
        },
      ],
    },
  ]
  displayCurrentScenario(scenarios[0])
}

export function displayCurrentScenario(scenario) {
  const container = document.getElementById("scenarioContainer")
  if (!container) return

  container.innerHTML = `
        <div class="card scenario-card">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h2 class="text-xl font-bold mb-2">${scenario.title}</h2>
                    <div class="flex items-center gap-4">
                        <span class="badge badge-secondary">${scenario.category}</span>
                        <span class="badge ${scenario.difficulty === "Zor" ? "badge-red" : "badge-blue"}">${scenario.difficulty}</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 class="font-medium mb-2"><i class="fas fa-briefcase mr-2"></i>Senaryo Bağlamı</h4>
                <p class="text-sm text-blue-800">${scenario.context}</p>
            </div>
            
            <div class="mb-6">
                <h4 class="font-medium mb-3"><i class="fas fa-exclamation-circle mr-2"></i>Durum</h4>
                <p class="text-gray-700">${scenario.situation}</p>
            </div>
            
            <div class="mb-6">
                <h4 class="font-medium mb-3"><i class="fas fa-comment mr-2"></i>Soru</h4>
                <p class="text-gray-800 font-medium">${scenario.question}</p>
            </div>
            
            <div class="mb-6">
                <h4 class="font-medium mb-4">Cevabınızı seçin:</h4>
                <div class="options-container">
                    ${scenario.options
                      .map(
                        (option) => `
                        <div class="option-card" onclick="selectOption('${option.id}')">
                            <input type="radio" name="answer" value="${option.id}" id="option_${option.id}">
                            <label for="option_${option.id}" class="option-label">${option.text}</label>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
            
            <div class="flex justify-between">
                <button class="btn btn-outline" disabled>
                    <i class="fas fa-arrow-left mr-2"></i>Önceki
                </button>
                <button class="btn btn-primary" onclick="submitAnswer()">
                    Cevabı Gönder
                </button>
            </div>
        </div>
    `
}

export function selectOption(optionId) {
  document.querySelectorAll(".option-card").forEach((card) => {
    card.classList.remove("selected")
  })

  const selectedCard = document.querySelector(`#option_${optionId}`).closest(".option-card")
  selectedCard.classList.add("selected")
}

export function submitAnswer() {
  const selectedOption = document.querySelector('input[name="answer"]:checked')
  if (!selectedOption) {
    showNotification("Lütfen bir seçenek seçin.", "warning")
    return
  }

  showNotification("Cevabınız değerlendiriliyor...", "info")

  setTimeout(() => {
    showAnswerFeedback(selectedOption.value)
  }, 1500)
}

export function showAnswerFeedback(selectedOptionId) {
  showNotification("Harika! Detaylı geri bildirim gösteriliyor.", "success")
}

export function setupSimulationTimer() {
  let timeLeft = 300
  const timerElement = document.getElementById("simulationTimer")

  if (timerElement) {
    const timer = setInterval(() => {
      const minutes = Math.floor(timeLeft / 60)
      const seconds = timeLeft % 60
      timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`

      if (timeLeft <= 0) {
        clearInterval(timer)
        showNotification("Süre doldu! Simülasyon otomatik olarak tamamlanıyor.", "warning")
      }
      timeLeft--
    }, 1000)
  }
}
