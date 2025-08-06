
        let currentStep = 0;
        let learningData = null;
        let userId = null;
        let isLoadingMissingSkills = false;
        let missingSkillsLoaded = false;


        // Initialize the page
        document.addEventListener('DOMContentLoaded', function() {
            // Get user ID from localStorage
            const user = JSON.parse(localStorage.getItem('kariyerAI_user') || '{}');
            userId = user.id;
            
            if (userId) {
                loadMissingSkills();
            } else {
                showError('Kullanıcı bilgisi bulunamadı');
            }
        }, { once: true });

        async function loadMissingSkills() {
            if (isLoadingMissingSkills || missingSkillsLoaded) return;
            isLoadingMissingSkills = true;

            try {
                const response = await fetch(`http://127.0.0.1:5000/api/missing_skills/${userId}`);
                const data = await response.json();

                if (data.success && data.data.length > 0) {
                    displaySkillCards(data.data);
                    missingSkillsLoaded = true;  
                } else {
                    showNoSkillsMessage();
                    missingSkillsLoaded = true;
                }
            } catch (error) {
                console.error('Error loading missing skills:', error);
                showError('Eksik beceriler yüklenirken hata oluştu');
            } finally {
                isLoadingMissingSkills = false;
            }
        }

        // Display skill cards
        function displaySkillCards(skills) {
            const loadingIndicator = document.getElementById('loadingIndicator');
            const skillsGrid = document.getElementById('skillsGrid');
            
            loadingIndicator.style.display = 'none';
            skillsGrid.style.display = 'grid';

            skillsGrid.innerHTML = skills.map(skill => {
                const skillClass = skill.skill.toLowerCase().replace(/[^a-z0-9]/g, '');
                return `
                    <div class="skill-card ${skillClass}" onclick="startLearning('${capitalizeWords(skill.skill)}')">
                        <div class="skill-title">
                            <i class="fas fa-code"></i>
                            ${capitalizeWords(skill.skill)}
                        </div>
                        <div class="skill-description">
                            Bu konuda eksikliğiniz tespit edildi. AI destekli eğitim ile hızla öğrenin.
                        </div>
                        <div class="skill-stats">
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Show message when no missing skills
        function showNoSkillsMessage() {
            const loadingIndicator = document.getElementById('loadingIndicator');
            const skillsGrid = document.getElementById('skillsGrid');
            
            loadingIndicator.style.display = 'none';
            skillsGrid.style.display = 'block';
            skillsGrid.innerHTML = `
                <div style="text-align: center; padding: 2rem; background: #f0f9ff; border-radius: 15px; border: 2px dashed #0ea5e9;">
                    <i class="fas fa-trophy" style="font-size: 3rem; color: #0ea5e9; margin-bottom: 1rem;"></i>
                    <h3 style="color: #0ea5e9; margin-bottom: 0.5rem;">Tebrikler!</h3>
                    <p style="color: #6b7280;">Şu anda eksik beceri tespit edilmedi. Mükemmel ilerleme gösteriyorsunuz!</p>
                </div>
            `;
        }

        // Show error message
        function showError(message) {
            const loadingIndicator = document.getElementById('loadingIndicator');
            loadingIndicator.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="color: #f56565;"></i>
                <span style="color: #f56565;">${message}</span>
            `;
        }

        // Start learning for a specific skill
        async function startLearning(skill) {
            const modal = document.getElementById('learningModal');
            const loadingOverlay = document.getElementById('loadingOverlay');
            
            modal.classList.add('active');
            loadingOverlay.style.display = 'flex';
            currentStep = 0;

            try {
                const response = await fetch('http://127.0.0.1:5000/generate-learning-module', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ topic: skill })
                });

                const data = await response.json();

                if (data.success) {
                    learningData = data.data;
                    displayLearningModule();
                } else {
                    throw new Error(data.message || 'Eğitim modülü oluşturulamadı');
                }
            } catch (error) {
                console.error('Error generating learning module:', error);
                alert('Eğitim modülü oluşturulurken hata oluştu: ' + error.message);
                closeLearningModal();
            } finally {
                loadingOverlay.style.display = 'none';
            }
        }

        // Display learning module
        function displayLearningModule() {
            if (!learningData) return;

            // Update header
            document.getElementById('learningTitle').textContent = learningData.title;
            document.getElementById('learningDescription').textContent = learningData.description;

            // Create progress indicator
            createProgressIndicator();

            // Display first step
            displayCurrentStep();
        }

        // Create progress indicator
        function createProgressIndicator() {
            const progressIndicator = document.getElementById('progressIndicator');
            const steps = learningData.steps || [];
            
            progressIndicator.innerHTML = steps.map((_, index) => {
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return `
                    <div class="progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}">
                        ${index + 1}
                    </div>
                    ${index < steps.length - 1 ? `<div class="progress-line ${index < currentStep ? 'active' : ''}"></div>` : ''}
                `;
            }).join('');
        }

        // Display current step
        function displayCurrentStep() {
            const learningContent = document.getElementById('learningContent');
            const steps = learningData.steps || [];
            
            if (currentStep >= steps.length) {
                displayFinalQuiz();
                return;
            }

            const step = steps[currentStep];
            
            learningContent.innerHTML = `
                <div class="step-content">
                    <div class="step-title">
                        Adım ${currentStep + 1}: ${step.title}
                    </div>
                    <div class="step-description">
                        ${step.content}
                    </div>
                    
                    ${step.examples ? `
                        <div style="margin: 1rem 0;">
                            <h4 style="color: #667eea; margin-bottom: 0.5rem;">Örnekler:</h4>
                            <ul style="margin-left: 1rem;">
                                ${step.examples.map(example => `<li style="margin-bottom: 0.5rem;">${example}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${step.code_example ? `
                        <div style="margin: 1rem 0;">
                            <h4 style="color: #667eea; margin-bottom: 0.5rem;">Kod Örneği:</h4>
                            <div class="code-block">${step.code_example}</div>
                        </div>
                    ` : ''}
                    
                    ${step.interactive_question ? `
                        <div class="interactive-section">
                            <h4 style="margin-bottom: 1rem;"><i class="fas fa-question-circle"></i> İnteraktif Soru</h4>
                            <p style="margin-bottom: 1rem;">${step.interactive_question}</p>
                            <textarea id="interactiveAnswer" class="textarea" placeholder="Cevabınızı buraya yazın..."></textarea>
                            <button class="btn" onclick="submitInteractiveAnswer()" style="margin-top: 1rem;">
                                <i class="fas fa-paper-plane"></i>
                                Cevabı Gönder
                            </button>
                            <div id="interactiveFeedback" class="feedback-box" style="display: none;"></div>
                        </div>
                    ` : ''}
                    
                    ${step.challenge ? `
                        <div class="interactive-section">
                            <h4 style="margin-bottom: 1rem;"><i class="fas fa-code"></i> Pratik Görev</h4>
                            <p style="margin-bottom: 1rem;">${step.challenge}</p>
                            <textarea id="challengeAnswer" class="textarea" placeholder="Çözümünüzü buraya yazın..."></textarea>
                            <button class="btn" onclick="submitChallenge()" style="margin-top: 1rem;">
                                <i class="fas fa-check"></i>
                                Çözümü Gönder
                            </button>
                            <div id="challengeFeedback" class="feedback-box" style="display: none;"></div>
                        </div>
                    ` : ''}
                </div>
            `;

            updateNavigationButtons();
            createProgressIndicator();
        }

        // Submit interactive answer
        async function submitInteractiveAnswer() {
            const answer = document.getElementById('interactiveAnswer').value;
            if (!answer.trim()) {
                alert('Lütfen bir cevap yazın');
                return;
            }

            const step = learningData.steps[currentStep];
            
            try {
                const response = await fetch('http://127.0.0.1:5000/evaluate-answer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        question: step.interactive_question,
                        answer: answer,
                        topic: learningData.title
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    const feedbackDiv = document.getElementById('interactiveFeedback');
                    feedbackDiv.style.display = 'block';
                    feedbackDiv.innerHTML = `
                        <h4 style="color: ${data.data.correct ? '#48bb78' : '#f56565'}; margin-bottom: 0.5rem;">
                            <i class="fas fa-${data.data.correct ? 'check-circle' : 'times-circle'}"></i>
                            ${data.data.correct ? 'Harika!' : 'Tekrar deneyin'}
                        </h4>
                        <p>${data.data.feedback}</p>
                        <p style="margin-top: 0.5rem;"><strong>Puan:</strong> ${data.data.score}/10</p>
                    `;
                }
            } catch (error) {
                console.error('Error evaluating answer:', error);
                alert('Cevap değerlendirilirken hata oluştu');
            }
        }

        // Submit challenge
        async function submitChallenge() {
            const solution = document.getElementById('challengeAnswer').value;
            if (!solution.trim()) {
                alert('Lütfen bir çözüm yazın');
                return;
            }

            const step = learningData.steps[currentStep];
            
            try {
                const response = await fetch('http://127.0.0.1:5000/evaluate-challenge', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        challenge: step.challenge,
                        solution: solution,
                        topic: learningData.title
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    const feedbackDiv = document.getElementById('challengeFeedback');
                    feedbackDiv.style.display = 'block';
                    feedbackDiv.innerHTML = `
                        <h4 style="color: #667eea; margin-bottom: 0.5rem;">
                            <i class="fas fa-lightbulb"></i>
                            Değerlendirme (${data.data.score}/10)
                        </h4>
                        <p><strong>İnceleme:</strong> ${data.data.review}</p>
                        ${data.data.suggestions ? `<p style="margin-top: 0.5rem;"><strong>Öneriler:</strong> ${data.data.suggestions}</p>` : ''}
                    `;
                }
            } catch (error) {
                console.error('Error evaluating challenge:', error);
                alert('Çözüm değerlendirilirken hata oluştu');
            }
        }

        // Display final quiz
        function displayFinalQuiz() {
            const learningContent = document.getElementById('learningContent');
            const quiz = learningData.final_quiz || [];
            
            if (quiz.length === 0) {
                completeSkill();
                return;
            }

            learningContent.innerHTML = `
                <div class="step-content">
                    <div class="step-title">
                        <i class="fas fa-graduation-cap"></i>
                        Final Testi
                    </div>
                    <div class="step-description">
                        Öğrendiklerinizi test etme zamanı! Aşağıdaki soruları cevaplayın.
                    </div>
                    
                    ${quiz.map((question, qIndex) => `
                        <div class="quiz-question" id="question-${qIndex}">
                            <h4 style="margin-bottom: 1rem;">Soru ${qIndex + 1}</h4>
                            <p style="margin-bottom: 1rem;">${question.q}</p>
                            <div class="quiz-options">
                                ${question.a.map((option, oIndex) => `
                                    <div class="quiz-option" onclick="selectQuizOption(${qIndex}, ${oIndex}, '${option}')">
                                        ${option}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                    
                    <button class="btn" onclick="submitQuiz()" style="margin-top: 2rem;">
                        <i class="fas fa-check-circle"></i>
                        Testi Tamamla
                    </button>
                </div>
            `;

            document.getElementById('nextBtn').style.display = 'none';
            createProgressIndicator();
        }

        // Quiz answer selection
        let quizAnswers = {};

        function selectQuizOption(questionIndex, optionIndex, option) {
            // Remove previous selection
            const questionDiv = document.getElementById(`question-${questionIndex}`);
            const options = questionDiv.querySelectorAll('.quiz-option');
            options.forEach(opt => opt.classList.remove('selected'));
            
            // Add selection to clicked option
            options[optionIndex].classList.add('selected');
            
            // Store answer
            quizAnswers[questionIndex] = option;
        }

        // Submit quiz
        function submitQuiz() {
            const quiz = learningData.final_quiz || [];
            let score = 0;
            
            // Calculate score and show results
            quiz.forEach((question, qIndex) => {
                const questionDiv = document.getElementById(`question-${qIndex}`);
                const options = questionDiv.querySelectorAll('.quiz-option');
                const userAnswer = quizAnswers[qIndex];
                const correctAnswer = question.correct;
                
                options.forEach(option => {
                    const optionText = option.textContent;
                    if (optionText === correctAnswer) {
                        option.classList.add('correct');
                    } else if (optionText === userAnswer && optionText !== correctAnswer) {
                        option.classList.add('incorrect');
                    }
                });
                
                if (userAnswer === correctAnswer) {
                    score++;
                }
            });

            const percentage = Math.round((score / quiz.length) * 100);
            
            // Show results
            setTimeout(() => {
                alert(`Test tamamlandı!\nDoğru cevap: ${score}/${quiz.length}\nBaşarı oranı: %${percentage}`);
                
                if (percentage >= 70) {
                    completeSkill();
                } else {
                    if (confirm('Test sonucunuz %70\'in altında. Tekrar denemek ister misiniz?')) {
                        currentStep = 0;
                        displayCurrentStep();
                    } else {
                        closeLearningModal();
                    }
                }
            }, 1000);
        }

        // Complete skill and remove from missing skills
        async function completeSkill() {
            try {
                const skillName = learningData.title.split(' ')[0]; // Get first word as skill name
                
                const response = await fetch('http://127.0.0.1:5000/api/complete-skill', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        skill: skillName,
                        score: 100
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    alert('🎉 Tebrikler! Beceriyi başarıyla tamamladınız ve +200 XP kazandınız!');
                    closeLearningModal();
                    missingSkillsLoaded = false;     
                    setTimeout(loadMissingSkills, 500); 
                } else {
                    console.error('Error completing skill:', data.message);
                    alert('Beceri tamamlanırken hata oluştu');
                }
            } catch (error) {
                console.error('Error completing skill:', error);
                alert('Beceri tamamlanırken hata oluştu');
            }
        }

        // Navigation functions
        function nextStep() {
            if (currentStep < learningData.steps.length - 1) {
                currentStep++;
                displayCurrentStep();
            } else {
                displayFinalQuiz();
            }
        }

        function previousStep() {
            if (currentStep > 0) {
                currentStep--;
                displayCurrentStep();
            }
        }

        function updateNavigationButtons() {
            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');
            
            prevBtn.style.display = currentStep > 0 ? 'inline-flex' : 'none';
            nextBtn.style.display = 'inline-flex';
            
            if (currentStep === learningData.steps.length - 1) {
                nextBtn.innerHTML = '<i class="fas fa-graduation-cap"></i> Final Testine Geç';
            } else {
                nextBtn.innerHTML = 'Sonraki Adım <i class="fas fa-arrow-right"></i>';
            }
        }

        // Close learning modal
        function closeLearningModal() {
            const modal = document.getElementById('learningModal');
            modal.classList.remove('active');
            currentStep = 0;
            learningData = null;
            quizAnswers = {};
        }

        // Close modal when clicking outside
        document.getElementById('learningModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeLearningModal();
            }
        });

function capitalizeWords(str) {
    if (!str) return '';
    return str.toLowerCase().split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}