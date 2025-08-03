"""
KariyerAI - Gelişmiş Kişiselleştirme Motoru
Bu modül kullanıcı verilerini analiz ederek daha kişiye özel simülasyonlar üretir.
"""

import json
from typing import Dict, List, Any
from dataclasses import dataclass

@dataclass
class UserPersonality:
    """Kullanıcının kişilik profili"""
    learning_style: str  # visual, auditory, kinesthetic, reading
    work_style: str      # collaborative, independent, mixed
    stress_tolerance: str # low, medium, high
    communication_preference: str # direct, diplomatic, detailed
    problem_solving_approach: str # analytical, creative, systematic

@dataclass
class CareerStage:
    """Kullanıcının kariyer aşaması"""
    experience_level: str  # junior, mid, senior, lead
    career_goals: List[str]  # promotion, skill_development, career_change
    industry_familiarity: int  # 1-5 scale
    leadership_interest: int   # 1-5 scale

class PersonalizationEngine:
    """Kişiselleştirme motoru"""
    
    def __init__(self):
        self.difficulty_weights = {
            'junior': {'easy': 0.6, 'medium': 0.3, 'hard': 0.1},
            'mid': {'easy': 0.2, 'medium': 0.6, 'hard': 0.2},
            'senior': {'easy': 0.1, 'medium': 0.4, 'hard': 0.5},
            'lead': {'easy': 0.05, 'medium': 0.25, 'hard': 0.7}
        }
    
    def analyze_user_profile(self, profile: Dict) -> Dict[str, Any]:
        """Kullanıcı profilini detaylı analiz et"""
        skills = profile.get('skills', [])
        experiences = profile.get('experiences', [])
        current_title = profile.get('current_title', '')
        experience_level = profile.get('experience_level', 'junior')
        
        analysis = {
            'technical_skills': self._categorize_skills(skills),
            'soft_skills': self._extract_soft_skills(experiences),
            'industry_focus': self._determine_industry(current_title, experiences),
            'role_type': self._determine_role_type(current_title),
            'experience_depth': self._calculate_experience_depth(experiences),
            'career_trajectory': self._analyze_career_trajectory(experiences),
            'skill_gaps': self._identify_skill_gaps(skills, current_title),
            'personalization_params': self._generate_personalization_params(profile)
        }
        
        return analysis
    
    def _categorize_skills(self, skills: List[str]) -> Dict[str, List[str]]:
        """Becerileri kategorilere ayır"""
        categories = {
            'programming': [],
            'frameworks': [],
            'databases': [],
            'cloud': [],
            'devops': [],
            'design': [],
            'management': [],
            'communication': [],
            'other': []
        }
        
        skill_mapping = {
            'programming': ['python', 'javascript', 'java', 'c++', 'c#', 'go', 'rust', 'swift', 'kotlin'],
            'frameworks': ['react', 'angular', 'vue', 'django', 'flask', 'spring', 'express', 'laravel'],
            'databases': ['mysql', 'postgresql', 'mongodb', 'redis', 'cassandra', 'oracle'],
            'cloud': ['aws', 'azure', 'gcp', 'docker', 'kubernetes'],
            'devops': ['jenkins', 'gitlab', 'github actions', 'terraform', 'ansible'],
            'design': ['figma', 'sketch', 'photoshop', 'ui/ux', 'design thinking'],
            'management': ['project management', 'scrum', 'agile', 'leadership', 'team management']
        }
        
        for skill in skills:
            skill_lower = skill.lower()
            categorized = False
            
            for category, keywords in skill_mapping.items():
                if any(keyword in skill_lower for keyword in keywords):
                    categories[category].append(skill)
                    categorized = True
                    break
            
            if not categorized:
                categories['other'].append(skill)
        
        return categories
    
    def _extract_soft_skills(self, experiences: List[Dict]) -> List[str]:
        """Deneyimlerden soft skill'leri çıkar"""
        soft_skills = set()
        
        for exp in experiences:
            description = exp.get('description', '').lower()
            
            # Liderlik
            if any(word in description for word in ['lead', 'manage', 'coordinate', 'supervise']):
                soft_skills.add('leadership')
            
            # İletişim
            if any(word in description for word in ['present', 'communicate', 'collaborate', 'meeting']):
                soft_skills.add('communication')
            
            # Problem çözme
            if any(word in description for word in ['solve', 'debug', 'troubleshoot', 'optimize']):
                soft_skills.add('problem_solving')
            
            # Proje yönetimi
            if any(word in description for word in ['project', 'plan', 'deadline', 'deliver']):
                soft_skills.add('project_management')
        
        return list(soft_skills)
    
    def _determine_industry(self, current_title: str, experiences: List[Dict]) -> str:
        """Kullanıcının sektörünü belirle"""
        title_lower = current_title.lower()
        
        if any(word in title_lower for word in ['developer', 'engineer', 'programmer', 'software']):
            return 'technology'
        elif any(word in title_lower for word in ['designer', 'ux', 'ui']):
            return 'design'
        elif any(word in title_lower for word in ['manager', 'lead', 'director']):
            return 'management'
        elif any(word in title_lower for word in ['analyst', 'data', 'scientist']):
            return 'data_science'
        else:
            return 'general'
    
    def _determine_role_type(self, current_title: str) -> str:
        """Kullanıcının rol tipini belirle"""
        title_lower = current_title.lower()
        
        if any(word in title_lower for word in ['frontend', 'front-end', 'ui']):
            return 'frontend'
        elif any(word in title_lower for word in ['backend', 'back-end', 'api']):
            return 'backend'
        elif any(word in title_lower for word in ['fullstack', 'full-stack']):
            return 'fullstack'
        elif any(word in title_lower for word in ['devops', 'sre', 'infrastructure']):
            return 'devops'
        elif any(word in title_lower for word in ['mobile', 'ios', 'android']):
            return 'mobile'
        else:
            return 'general'
    
    def _calculate_experience_depth(self, experiences: List[Dict]) -> int:
        """Deneyim derinliğini hesapla (1-10 arası)"""
        if not experiences:
            return 1
        
        total_years = 0
        for exp in experiences:
            duration = exp.get('duration', '')
            # Basit duration parsing (gerçek uygulamada daha sofistike olmalı)
            if 'year' in duration.lower():
                try:
                    years = int(duration.split()[0])
                    total_years += years
                except:
                    total_years += 1
            else:
                total_years += 0.5  # Kısa süre varsayımı
        
        return min(10, max(1, int(total_years)))
    
    def _analyze_career_trajectory(self, experiences: List[Dict]) -> str:
        """Kariyer yörüngesini analiz et"""
        if len(experiences) < 2:
            return 'entry_level'
        
        # Pozisyon seviyelerini analiz et
        positions = [exp.get('position', '').lower() for exp in experiences]
        
        junior_keywords = ['junior', 'intern', 'trainee', 'assistant']
        senior_keywords = ['senior', 'lead', 'principal', 'manager', 'director']
        
        has_junior = any(any(keyword in pos for keyword in junior_keywords) for pos in positions)
        has_senior = any(any(keyword in pos for keyword in senior_keywords) for pos in positions)
        
        if has_junior and has_senior:
            return 'advancing'
        elif has_senior:
            return 'leadership_track'
        elif has_junior:
            return 'growing'
        else:
            return 'stable'
    
    def _identify_skill_gaps(self, skills: List[str], current_title: str) -> List[str]:
        """Pozisyona göre eksik becerileri belirle"""
        skill_recommendations = {
            'developer': ['git', 'testing', 'debugging', 'api design'],
            'frontend': ['responsive design', 'performance optimization', 'accessibility'],
            'backend': ['database design', 'api security', 'scalability'],
            'manager': ['agile methodologies', 'team building', 'stakeholder management'],
            'designer': ['user research', 'prototyping', 'design systems']
        }
        
        title_lower = current_title.lower()
        current_skills_lower = [skill.lower() for skill in skills]
        
        gaps = []
        for role, recommended_skills in skill_recommendations.items():
            if role in title_lower:
                for rec_skill in recommended_skills:
                    if not any(rec_skill in current_skill for current_skill in current_skills_lower):
                        gaps.append(rec_skill)
        
        return gaps[:5]  # En önemli 5 eksiklik
    
    def _generate_personalization_params(self, profile: Dict) -> Dict[str, Any]:
        """Kişiselleştirme parametrelerini üret"""
        experience_level = profile.get('experience_level', 'junior')
        skills_count = len(profile.get('skills', []))
        
        return {
            'complexity_preference': self._calculate_complexity_preference(experience_level, skills_count),
            'scenario_types': self._determine_preferred_scenarios(profile),
            'learning_focus': self._determine_learning_focus(profile),
            'challenge_areas': self._identify_challenge_areas(profile)
        }
    
    def _calculate_complexity_preference(self, experience_level: str, skills_count: int) -> str:
        """Kullanıcının tercih ettiği karmaşıklık seviyesini hesapla"""
        if experience_level in ['senior', 'lead'] or skills_count > 15:
            return 'high'
        elif experience_level == 'mid' or skills_count > 8:
            return 'medium'
        else:
            return 'low'
    
    def _determine_preferred_scenarios(self, profile: Dict) -> List[str]:
        """Kullanıcının tercih ettiği senaryo tiplerini belirle"""
        current_title = profile.get('current_title', '').lower()
        scenarios = []
        
        if any(word in current_title for word in ['developer', 'engineer']):
            scenarios.extend(['coding', 'code_review', 'debugging'])
        
        if any(word in current_title for word in ['manager', 'lead']):
            scenarios.extend(['team_management', 'project_planning', 'stakeholder_meeting'])
        
        if any(word in current_title for word in ['designer']):
            scenarios.extend(['design_review', 'user_research', 'client_presentation'])
        
        # Genel senaryolar
        scenarios.extend(['email_communication', 'problem_solving', 'time_management'])
        
        return list(set(scenarios))
    
    def _determine_learning_focus(self, profile: Dict) -> List[str]:
        """Öğrenme odak alanlarını belirle"""
        gaps = self._identify_skill_gaps(profile.get('skills', []), profile.get('current_title', ''))
        experience_level = profile.get('experience_level', 'junior')
        
        focus_areas = []
        
        if experience_level == 'junior':
            focus_areas.extend(['technical_skills', 'best_practices', 'code_quality'])
        elif experience_level == 'mid':
            focus_areas.extend(['architecture', 'mentoring', 'project_leadership'])
        else:
            focus_areas.extend(['strategic_thinking', 'team_building', 'business_acumen'])
        
        # Skill gap'lere göre ek odak alanları
        if gaps:
            focus_areas.extend(gaps[:3])
        
        return list(set(focus_areas))
    
    def _identify_challenge_areas(self, profile: Dict) -> List[str]:
        """Zorluk alanlarını belirle"""
        current_title = profile.get('current_title', '').lower()
        experience_level = profile.get('experience_level', 'junior')
        
        challenges = []
        
        if experience_level == 'junior':
            challenges.extend(['complex_problem_solving', 'time_pressure', 'multiple_priorities'])
        elif experience_level == 'mid':
            challenges.extend(['team_conflicts', 'technical_decisions', 'client_communication'])
        else:
            challenges.extend(['strategic_planning', 'organizational_change', 'cross_team_coordination'])
        
        return challenges

    def generate_personalized_prompt(self, user_analysis: Dict, base_prompt: str) -> str:
        """Kullanıcı analizine göre kişiselleştirilmiş prompt üret"""
        personalization = user_analysis.get('personalization_params', {})
        
        # Kompleksite seviyesi
        complexity = personalization.get('complexity_preference', 'medium')
        complexity_instruction = {
            'low': "Senaryoyu basit ve anlaşılır tut. Karmaşık teknik detaylardan kaçın.",
            'medium': "Orta seviye zorlukta senaryolar oluştur. Teknik ve soft skill dengesini koru.",
            'high': "Karmaşık, çok katmanlı senaryolar oluştur. Stratejik düşünme gerektiren durumlar ekle."
        }
        
        # Tercih edilen senaryo tipleri
        preferred_scenarios = personalization.get('scenario_types', [])
        scenario_focus = f"Özellikle şu tür senaryolara odaklan: {', '.join(preferred_scenarios[:3])}"
        
        # Öğrenme odağı
        learning_focus = personalization.get('learning_focus', [])
        learning_instruction = f"Şu alanlarda öğrenme fırsatları sun: {', '.join(learning_focus[:3])}"
        
        # Zorluk alanları
        challenge_areas = personalization.get('challenge_areas', [])
        challenge_instruction = f"Şu zorluklarla karşılaşabilir: {', '.join(challenge_areas[:2])}"
        
        # Kişiselleştirilmiş prompt'u oluştur
        personalized_prompt = f"""
        {base_prompt}
        
        KIŞISELLEŞTIRME TALİMATLARI:
        - Karmaşıklık seviyesi: {complexity_instruction[complexity]}
        - {scenario_focus}
        - {learning_instruction}
        - {challenge_instruction}
        
        Bu kullanıcı profili için özellikle gerçekçi ve ilgi çekici senaryolar oluştur.
        """
        
        return personalized_prompt
