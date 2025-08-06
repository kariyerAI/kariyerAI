// Meeting Chat System
class MeetingChatSystem {
    constructor() {
        this.participants = [];
        this.conversationHistory = [];
        this.currentTopic = '';
        this.meetingGoals = [];
        this.personalityProfiles = {};
        this.contextAwareness = {};
    }

    // Participants ve personalityProfiles
    initializeParticipants(participants) {
        this.participants = participants;
        this.personalityProfiles = {
            'Proje Yöneticisi': {
                role: 'PM',
                personality: 'Zaman odaklı, sonuç odaklı, koordinatör',
                responsePatterns: [
                    'Bu konuda zaman çizelgemizi düşünmeliyiz.',
                    'Bu özelliğin müşteri üzerindeki etkisi ne olur?',
                    'Kaynak tahsisi açısından nasıl değerlendiriyoruz?',
                    'Riskleri minimize etmek için ne yapabiliriz?'
                ],
                interests: ['timeline', 'resources', 'risks', 'customer-impact'],
                responseStyle: 'business-focused'
            },
            'Senior Developer': {
                role: 'Tech Lead',
                personality: 'Teknik detayları seven, kalite odaklı, analitik',
                responsePatterns: [
                    'Teknik açıdan bu nasıl implement edilebilir?',
                    'Bu yaklaşımın performans etkisi nasıl olur?',
                    'Var olan sistemlerle entegrasyonu nasıl sağlarız?',
                    'Test stratejimizi nasıl belirliyoruz?'
                ],
                interests: ['technical-implementation', 'performance', 'architecture', 'testing'],
                responseStyle: 'technical'
            },
            'UX Designer': {
                role: 'Designer',
                personality: 'Kullanıcı deneyimi odaklı, yaratıcı, empati sahibi',
                responsePatterns: [
                    'Kullanıcı bu özelliği nasıl algılar?',
                    'Bu değişiklik kullanıcı journey\'ini nasıl etkiler?',
                    'Accessibility açısından düşünmemiz gereken var mı?',
                    'A/B test yaparak doğrulayabilir miyiz?'
                ],
                interests: ['user-experience', 'usability', 'accessibility', 'user-journey'],
                responseStyle: 'user-focused'
            },
            'QA Engineer': {
                role: 'QA',
                personality: 'Detay odaklı, sistematik, kalite güvencesi',
                responsePatterns: [
                    'Bu edge case\'leri nasıl test ederiz?',
                    'Regression test senaryolarını güncellemeli miyiz?',
                    'Performance testlerini nasıl planlıyoruz?',
                    'Bu değişikliğin yan etkileri olabilir mi?'
                ],
                interests: ['testing', 'quality-assurance', 'edge-cases', 'performance'],
                responseStyle: 'quality-focused'
            }
        };
    }

    // AI answer generation
    async generateResponse(userMessage, currentParticipant, context) {
        const prompt = `
        Sen bir ${currentParticipant} rolündesin. Kişiliğin: ${this.personalityProfiles[currentParticipant]?.personality}
        
        Toplantı konusu: ${context.topic}
        Toplantı hedefleri: ${context.goals?.join(', ')}
        Şimdiye kadarki konuşma özeti: ${this.getConversationSummary()}
        
        Kullanıcının mesajı: "${userMessage}"
        
        Lütfen bu mesaja ${currentParticipant} olarak yanıt ver. Yanıtın:
        1. Kişiliğine uygun olsun
        2. Toplantı hedefleriyle alakalı olsun  
        3. Önceki konuşmaları dikkate alsın
        4. Yapıcı ve gerçekçi olsun
        5. Kısa ama etkili olsun (1-2 cümle)
        
        Ayrıca, eğer uygunsa kullanıcının önerisine karşı soru sor veya alternatif öner.
        
        JSON formatında yanıt ver:
        {
            "response": "Ana yanıt",
            "emotion": "neutral|positive|concerned|excited|skeptical",
            "follow_up_question": "Takip sorusu (varsa)",
            "action_item": "Aksiyon önerisi (varsa)"
        }
        `;

        try {
            const response = await fetch('http://127.0.0.1:5000/meeting-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    participant: currentParticipant,
                    context: context,
                    conversation_history: this.conversationHistory.slice(-5), // Son 5 mesaj
                    prompt: prompt
                })
            });

            const data = await response.json();
            return data.success ? data.data : this.getFallbackResponse(currentParticipant, userMessage);
        } catch (error) {
            console.error('Meeting chat error:', error);
            return this.getFallbackResponse(currentParticipant, userMessage);
        }
    }

    // Fallback 
    getFallbackResponse(participant, userMessage) {
        const profile = this.personalityProfiles[participant];
        if (!profile) return { response: "İlginç bir bakış açısı.", emotion: "neutral" };

        const lowerMessage = userMessage.toLowerCase();
        let response = profile.responsePatterns[Math.floor(Math.random() * profile.responsePatterns.length)];
        
        if (lowerMessage.includes('zaman') || lowerMessage.includes('deadline')) {
            if (participant === 'Proje Yöneticisi') {
                response = "Zaman çizelgemizi gözden geçirmemiz gerekiyor. Bu değişiklik ne kadar sürer?";
            }
        } else if (lowerMessage.includes('kullanıcı') || lowerMessage.includes('user')) {
            if (participant === 'UX Designer') {
                response = "Kullanıcı araştırmamızdan elde ettiğimiz veriler bunu destekliyor mu?";
            }
        } else if (lowerMessage.includes('test') || lowerMessage.includes('bug')) {
            if (participant === 'QA Engineer') {
                response = "Bu durumu test etmek için hangi senaryoları yazmalıyız?";
            }
        } else if (lowerMessage.includes('teknik') || lowerMessage.includes('kod')) {
            if (participant === 'Senior Developer') {
                response = "Teknik implementasyon açısından hangi yaklaşımı öneriyorsun?";
            }
        }

        return {
            response: response,
            emotion: "neutral",
            follow_up_question: null,
            action_item: null
        };
    }

    // Summary of recent conversations
    getConversationSummary() {
        const recent = this.conversationHistory.slice(-3);
        return recent.map(msg => `${msg.speaker}: ${msg.message.substring(0, 50)}...`).join(' | ');
    }

    addMessage(speaker, message, responseData = null) {
        this.conversationHistory.push({
            speaker,
            message,
            timestamp: new Date(),
            emotion: responseData?.emotion || 'neutral',
            follow_up_question: responseData?.follow_up_question,
            action_item: responseData?.action_item
        });
    }

    getNextSpeaker(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('teknik') || lowerMessage.includes('kod') || lowerMessage.includes('implement')) {
            return 'Senior Developer';
        }
        if (lowerMessage.includes('kullanıcı') || lowerMessage.includes('ui') || lowerMessage.includes('design')) {
            return 'UX Designer';
        }
        if (lowerMessage.includes('test') || lowerMessage.includes('bug') || lowerMessage.includes('quality')) {
            return 'QA Engineer';
        }
        if (lowerMessage.includes('zaman') || lowerMessage.includes('deadline') || lowerMessage.includes('kaynak')) {
            return 'Proje Yöneticisi';
        }
        
        const available = this.participants.filter(p => 
            p.name !== 'Siz' && 
            (this.conversationHistory.length === 0 || 
             this.conversationHistory[this.conversationHistory.length - 1].speaker !== p.name)
        );
        
        return available.length > 0 ? 
               available[Math.floor(Math.random() * available.length)].name : 
               'Proje Yöneticisi';
    }

    // Meeting analytics
    getMeetingAnalytics() {
        const totalMessages = this.conversationHistory.length;
        const userMessages = this.conversationHistory.filter(msg => msg.speaker === 'Siz').length;
        const participationRate = totalMessages > 0 ? (userMessages / totalMessages * 100).toFixed(1) : 0;
        
        const emotions = this.conversationHistory.reduce((acc, msg) => {
            acc[msg.emotion] = (acc[msg.emotion] || 0) + 1;
            return acc;
        }, {});

        return {
            totalMessages,
            userMessages,
            participationRate,
            emotions,
            actionItems: this.conversationHistory.filter(msg => msg.action_item).map(msg => msg.action_item)
        };
    }
}

// Global instance
window.meetingChatSystem = new MeetingChatSystem();
