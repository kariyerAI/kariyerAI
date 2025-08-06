# Simulation API for User Profiles

from flask import request, jsonify
import json
from datetime import datetime
from personalization_engine import PersonalizationEngine

def add_personalization_routes(app, personalization_engine):
    
    @app.route("/profile-analysis/<uuid:user_id>", methods=["POST"])
    def analyze_user_profile_detailed(user_id):
        """Kullanıcı profilini detaylı analiz et ve kişiselleştirme önerileri üret"""
        try:
            
            headers = {
                "apikey": app.config.get('SUPABASE_API_KEY'),
                "Authorization": f"Bearer {app.config.get('SUPABASE_API_KEY')}"
            }
            
            response = requests.get(
                f"{app.config.get('SUPABASE_API_URL')}/rest/v1/profiles?id=eq.{user_id}",
                headers=headers
            )
            
            if response.status_code != 200 or not response.json():
                return jsonify({"success": False, "message": "Profil bulunamadı"}), 404
            
            profile = response.json()[0]
            
            analysis = personalization_engine.analyze_user_profile(profile)
            
            recommendations = generate_personalized_recommendations(analysis)
            
            return jsonify({
                "success": True,
                "data": {
                    "analysis": analysis,
                    "recommendations": recommendations,
                    "updated_at": datetime.now().isoformat()
                }
            })
            
        except Exception as e:
            return jsonify({
                "success": False,
                "message": f"Analiz hatası: {str(e)}"
            }), 500
    
    @app.route("/adaptive-scenario/<uuid:user_id>", methods=["POST"])
    def generate_adaptive_scenario(user_id):
        """Kullanıcının performans geçmişine göre adaptif senaryo üret"""
        try:
            data = request.json
            performance_history = data.get('performance_history', [])
            preferred_difficulty = data.get('preferred_difficulty', 'medium')
            focus_areas = data.get('focus_areas', [])
            
            profile_response = get_user_profile(user_id)
            if not profile_response['success']:
                return jsonify(profile_response), 404
            
            profile = profile_response['data']
            
            adjusted_difficulty = calculate_adaptive_difficulty(
                performance_history, 
                preferred_difficulty
            )
            
            scenario_prompt = create_adaptive_prompt(
                profile, 
                adjusted_difficulty, 
                focus_areas
            )
            
            scenario = generate_scenario_with_ai(scenario_prompt)
            
            return jsonify({
                "success": True,
                "data": {
                    "scenario": scenario,
                    "difficulty_level": adjusted_difficulty,
                    "personalization_factors": {
                        "user_level": profile.get('experience_level'),
                        "focus_areas": focus_areas,
                        "performance_trend": analyze_performance_trend(performance_history)
                    }
                }
            })
            
        except Exception as e:
            return jsonify({
                "success": False,
                "message": f"Adaptif senaryo üretim hatası: {str(e)}"
            }), 500
    
    @app.route("/learning-path/<uuid:user_id>", methods=["GET"])
    def generate_personalized_learning_path(user_id):
        """Kullanıcıya özel öğrenme yol haritası oluştur"""
        try:
            profile_response = get_user_profile(user_id)
            if not profile_response['success']:
                return jsonify(profile_response), 404
            
            profile = profile_response['data']
            
            analysis = personalization_engine.analyze_user_profile(profile)
            
            learning_path = create_learning_path(analysis)
            
            return jsonify({
                "success": True,
                "data": {
                    "learning_path": learning_path,
                    "estimated_duration": calculate_learning_duration(learning_path),
                    "skill_priorities": analysis.get('skill_gaps', []),
                    "career_goals": analysis.get('career_trajectory', 'stable')
                }
            })
            
        except Exception as e:
            return jsonify({
                "success": False,
                "message": f"Öğrenme yolu oluşturma hatası: {str(e)}"
            }), 500
    
    @app.route("/personality-assessment", methods=["POST"])
    def personality_assessment():
        """Kişilik değerlendirmesi ve simülasyon önerisi"""
        try:
            data = request.json
            responses = data.get('responses', [])
            user_id = data.get('user_id')
            
            personality_profile = analyze_personality(responses)
            
            recommended_scenarios = get_personality_based_scenarios(personality_profile)
            
            if user_id:
                save_personality_profile(user_id, personality_profile)
            
            return jsonify({
                "success": True,
                "data": {
                    "personality_profile": personality_profile,
                    "recommended_scenarios": recommended_scenarios,
                    "learning_style": personality_profile.get('learning_style'),
                    "work_preferences": personality_profile.get('work_style')
                }
            })
            
        except Exception as e:
            return jsonify({
                "success": False,
                "message": f"Kişilik değerlendirme hatası: {str(e)}"
            }), 500

def generate_personalized_recommendations(analysis):
    """Analiz sonuçlarına göre kişiselleştirilmiş öneriler üret"""
    recommendations = {
        "simulation_types": [],
        "skill_development": [],
        "career_advancement": [],
        "learning_resources": []
    }
    
    industry = analysis.get('industry_focus', 'general')
    if industry == 'technology':
        recommendations["simulation_types"].extend([
            "code_review_scenarios",
            "technical_architecture_decisions",
            "debugging_challenges"
        ])
    
    experience_depth = analysis.get('experience_depth', 1)
    if experience_depth < 3:
        recommendations["skill_development"].extend([
            "fundamentals_strengthening",
            "best_practices_learning",
            "mentorship_seeking"
        ])
    elif experience_depth > 7:
        recommendations["career_advancement"].extend([
            "leadership_training",
            "strategic_thinking_development",
            "team_building_skills"
        ])
    
    skill_gaps = analysis.get('skill_gaps', [])
    for gap in skill_gaps:
        recommendations["learning_resources"].append({
            "skill": gap,
            "priority": "high",
            "estimated_time": "2-4 weeks",
            "resources": get_learning_resources_for_skill(gap)
        })
    
    return recommendations

def calculate_adaptive_difficulty(performance_history, preferred_difficulty):
    """Performans geçmişine göre zorluk seviyesi hesapla"""
    if not performance_history:
        return preferred_difficulty
    
    recent_scores = [p.get('score', 0) for p in performance_history[-5:]]
    avg_score = sum(recent_scores) / len(recent_scores) if recent_scores else 0
    
    if avg_score > 85:
        difficulty_map = {'easy': 'medium', 'medium': 'hard', 'hard': 'expert'}
        return difficulty_map.get(preferred_difficulty, 'hard')
    elif avg_score < 60:
        difficulty_map = {'expert': 'hard', 'hard': 'medium', 'medium': 'easy'}
        return difficulty_map.get(preferred_difficulty, 'easy')
    
    return preferred_difficulty

def create_adaptive_prompt(profile, difficulty, focus_areas):
    """Adaptif prompt oluştur"""
    base_elements = {
        "user_role": profile.get('current_title', 'Professional'),
        "experience_level": profile.get('experience_level', 'mid'),
        "skills": profile.get('skills', []),
        "industry": profile.get('industry', 'technology')
    }
    
    difficulty_instructions = {
        'easy': 'Basit, adım adım çözülebilir problemler oluştur.',
        'medium': 'Orta kompleksite, birkaç faktörü göz önünde bulundurma gerektiren durumlar.',
        'hard': 'Karmaşık, çoklu stakeholder ve belirsizlik içeren senaryolar.',
        'expert': 'Stratejik seviye, organizasyon geneli etkisi olan kritik kararlar.'
    }
    
    focus_instruction = f"Özellikle şu alanlara odaklan: {', '.join(focus_areas)}" if focus_areas else ""
    
    prompt = f"""
    Kullanıcı Profili:
    - Rol: {base_elements['user_role']}
    - Deneyim: {base_elements['experience_level']}
    - Sektör: {base_elements['industry']}
    
    Zorluk Seviyesi: {difficulty}
    Talimat: {difficulty_instructions[difficulty]}
    
    {focus_instruction}
    
    Bu kriterlere uygun, gerçekçi bir iş günü simülasyonu oluştur.
    """
    
    return prompt

def create_learning_path(analysis):
    """Kişiselleştirilmiş öğrenme yolu oluştur"""
    learning_path = {
        "phases": [],
        "total_duration_weeks": 0,
        "milestones": []
    }
    
    skill_gaps = analysis.get('skill_gaps', [])
    experience_level = analysis.get('personalization_params', {}).get('complexity_preference', 'medium')
    
    if skill_gaps:
        phase1 = {
            "name": "Temel Beceri Geliştirme",
            "duration_weeks": 4,
            "skills": skill_gaps[:3],
            "activities": [
                {"type": "tutorial", "description": "İnteraktif öğrenme modülleri"},
                {"type": "practice", "description": "Guided practice sessions"},
                {"type": "assessment", "description": "Skill validation tests"}
            ]
        }
        learning_path["phases"].append(phase1)
    
    phase2 = {
        "name": "İleri Seviye Uygulamalar",
        "duration_weeks": 6,
        "skills": ["problem_solving", "strategic_thinking"],
        "activities": [
            {"type": "simulation", "description": "Gerçek dünya senaryoları"},
            {"type": "project", "description": "End-to-end proje tamamlama"},
            {"type": "peer_review", "description": "Akran değerlendirmesi"}
        ]
    }
    learning_path["phases"].append(phase2)
    
    specialization = determine_specialization(analysis)
    phase3 = {
        "name": f"{specialization} Uzmanlığı",
        "duration_weeks": 8,
        "skills": get_specialization_skills(specialization),
        "activities": [
            {"type": "advanced_simulation", "description": "Expert-level challenges"},
            {"type": "mentorship", "description": "Industry expert guidance"},
            {"type": "capstone", "description": "Portfolio project"}
        ]
    }
    learning_path["phases"].append(phase3)
    
    learning_path["total_duration_weeks"] = sum(p["duration_weeks"] for p in learning_path["phases"])
    
    return learning_path

def get_user_profile(user_id):
    """Kullanıcı profilini getir"""
    pass

def analyze_personality(responses):
    """Kişilik analizini yap"""
    personality_scores = {
        "extraversion": 0,
        "sensing": 0,
        "thinking": 0,
        "judging": 0
    }
    

    return {
        "type": determine_personality_type(personality_scores),
        "learning_style": determine_learning_style(personality_scores),
        "work_style": determine_work_style(personality_scores),
        "communication_preference": determine_communication_style(personality_scores)
    }

def determine_specialization(analysis):
    """Uzmanlık alanını belirle"""
    industry = analysis.get('industry_focus', 'general')
    role_type = analysis.get('role_type', 'general')
    
    specialization_map = {
        ('technology', 'frontend'): 'Frontend Architecture',
        ('technology', 'backend'): 'Backend Systems',
        ('technology', 'fullstack'): 'Full Stack Development',
        ('design', 'general'): 'UX/UI Design',
        ('management', 'general'): 'Technical Leadership'
    }
    
    return specialization_map.get((industry, role_type), 'General Technology')

def get_specialization_skills(specialization):
    """Uzmanlık alanına göre beceriler"""
    skill_map = {
        'Frontend Architecture': ['React optimization', 'State management', 'Performance tuning'],
        'Backend Systems': ['System design', 'Database optimization', 'API architecture'],
        'Full Stack Development': ['End-to-end development', 'DevOps', 'Cloud deployment'],
        'UX/UI Design': ['User research', 'Design systems', 'Prototyping'],
        'Technical Leadership': ['Team management', 'Technical strategy', 'Stakeholder communication']
    }
    
    return skill_map.get(specialization, ['General problem solving', 'Communication', 'Project management'])
