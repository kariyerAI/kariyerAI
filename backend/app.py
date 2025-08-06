from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
import json
from dotenv import load_dotenv
from bs4 import BeautifulSoup
import time
import traceback


load_dotenv()

app = Flask(__name__)

CORS(app, origins=["*"], allow_headers=["*"], supports_credentials=True)

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    return response

@app.route("/<path:path>", methods=["OPTIONS"])
def options_handler(path):
    response = jsonify({"status": "ok"})
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
    return response


SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")
SUPABASE_API_URL = os.getenv("SUPABASE_API_URL")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = os.getenv("GEMINI_API_URL", 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent')
SERPAPI_KEY = os.getenv("SERPAPI_KEY")


@app.route('/')
def home():
    return 'KariyerAI Backend çalışıyor!'

# For saving user profile data
@app.route("/save-profile", methods=["POST"])  
def save_profile():
    try:
        profile_data_raw = request.json
        print("Gelen profil verisi:", profile_data_raw)

        # Validate required fields
        firstName = profile_data_raw.get("firstName")
        lastName = profile_data_raw.get("lastName") 
        email = profile_data_raw.get("email")
        
        print(f"📌 [save-profile] Field 'firstName': '{firstName}'")
        print(f"📌 [save-profile] Field 'lastName': '{lastName}'")
        print(f"📌 [save-profile] Field 'email': '{email}'")
        
        if not firstName or not lastName or not email:
            print("❌ [save-profile] Missing required fields")
            return jsonify({"success": False, "message": "Required fields missing: firstName, lastName, email"}), 400

        headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

        # Check if user already exists by email
        print(f"📌 [save-profile] Checking if user exists with email: {email}")
        check_response = requests.get(
            f"{SUPABASE_API_URL}/rest/v1/profiles?email=eq.{email}",
            headers=headers
        )
        
        print(f"📌 [save-profile] Existing user check status: {check_response.status_code}")
        print(f"📌 [save-profile] Existing user response: {check_response.text}")
        
        existing_users = check_response.json() if check_response.status_code == 200 else []
        
        profile_data = {
            "first_name": firstName,
            "last_name": lastName,
            "email": email,
            "phone": profile_data_raw.get("phone"),
            "location": profile_data_raw.get("location"),
            "current_title": profile_data_raw.get("currentTitle"),
            "experience_level": profile_data_raw.get("experienceLevel"),
            "summary": profile_data_raw.get("summary"),
            "skills": profile_data_raw.get("skills", []),
            "experiences": profile_data_raw.get("experiences", []),
            "university": profile_data_raw.get("university"),
            "degree": profile_data_raw.get("degree"),
            "graduation_year": profile_data_raw.get("graduationYear"),

            "gpa": profile_data_raw.get("gpa"),
        }

        headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"

        }
        
        print(f"📌 [save-profile] Raw skills from frontend: {profile_data_raw.get('skills')}")
        print(f"📌 [save-profile] Raw experiences from frontend: {profile_data_raw.get('experiences')}")
        print(f"📌 [save-profile] Processed skills: {profile_data['skills']}")
        print(f"📌 [save-profile] Processed experiences: {profile_data['experiences']}")
        print(f"📌 [save-profile] Full profile_data: {profile_data}")


        if existing_users:
            # Update existing user
            user_id = existing_users[0]["id"]
            print(f"📌 [save-profile] Updating existing user: {user_id}")
            
            response = requests.patch(
                f"{SUPABASE_API_URL}/rest/v1/profiles?id=eq.{user_id}",
                headers=headers,
                json=profile_data
            )
            print(f"📌 [save-profile] Update response status: {response.status_code}")
            print(f"📌 [save-profile] Update response: {response.text}")
            
            if response.status_code not in [200, 204]:
                print(f"❌ [save-profile] Update failed: {response.text}")
                return jsonify({"success": False, "message": response.text}), 400
                
            # Get updated data
            user_data = existing_users[0]
            user_data.update(profile_data)
        else:
            # Create new user
            print("📌 [save-profile] Creating new user")
            response = requests.post(
                f"{SUPABASE_API_URL}/rest/v1/profiles",
                headers=headers,
                json=profile_data
            )
            print(f"📌 [save-profile] Create response status: {response.status_code}")
            print(f"📌 [save-profile] Create response: {response.text}")
            
            if response.status_code not in [200, 201]:
                print(f"❌ [save-profile] Create failed: {response.text}")
                return jsonify({"success": False, "message": response.text}), 400
                
            user_data = response.json()[0] if isinstance(response.json(), list) else response.json()
            user_id = user_data["id"]

        # Process skills and experiences
        skills = profile_data_raw.get("skills", [])
        skills_processed = 0
        experiences_processed = len(profile_data_raw.get("experiences", []))
        
        for skill in skills:
            skill_payload = {
                "user_id": user_id,
                "skill": skill,
                "level": 50
            }
            skill_response = requests.post(
                f"{SUPABASE_API_URL}/rest/v1/skill_levels",
                headers=headers,
                json=skill_payload
            )
            if skill_response.status_code in [200, 201]:
                skills_processed += 1
        print("📌 Yeni kullanıcı JSON:", user_data)

        return jsonify({
            "success": True,
            "message": "Profil başarıyla güncellendi",
            "user_id": user_id,
            "skills_processed": skills_processed,
            "experiences_processed": experiences_processed,
            "data": [user_data]
        

        })
    

    except Exception as e:
        print("save_profile hatası:", traceback.format_exc())
        return jsonify({
            "success": False,
            "message": f"Server hatası: {str(e)}"
        }), 500

# Take user identifier (ID or email) and fetch profile from Supabase
@app.route("/get-profile/<identifier>", methods=["GET"]) 
def get_profile(identifier):
    """Kullanıcı profilini Supabase'den çek (ID veya email ile)"""
    try:
        headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}"
        }
        
        # Check if it's an email or ID
        by_param = request.args.get('by', 'id')  
        
        if by_param == 'email':
            query_param = f"email=eq.{identifier}"
        else:
            query_param = f"id=eq.{identifier}"
            
        print(f"📌 [get-profile] Fetching profile with {query_param}")
        
        response = requests.get(
            f"{SUPABASE_API_URL}/rest/v1/profiles?{query_param}",
            headers=headers
        )
        
        print(f"📌 [get-profile] Response status: {response.status_code}")
        print(f"📌 [get-profile] Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data:
                return jsonify({
                    "success": True,
                    "data": data[0]
                })
            else:
                return jsonify({
                    "success": False,
                    "message": "Profile not found"
                }), 404
        else:
            return jsonify({
                "success": False,
                "message": f"Profil bulunamadı: {response.text}"
            }), 404
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Server hatası: {str(e)}"
        }), 500
    
# For user login by email    
@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json(force=True)
        email = (data.get("email") or "").strip()
        print("📌 /login request data:", data)

        if not email:
            return jsonify({"success": False, "message": "E-posta gerekli"}), 400

        headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}"
        }

        from urllib.parse import quote
        encoded_email = quote(email)
        url = f"{SUPABASE_API_URL}/rest/v1/profiles?email=ilike.{encoded_email}"

        resp = requests.get(url, headers=headers)
        print("📌 Supabase URL:", url)
        print("📌 Supabase response:", resp.status_code, resp.text)

        if resp.status_code == 200:
            profiles = resp.json()
            if profiles:
                return jsonify({"success": True, "data": profiles[0]})
            return jsonify({"success": False, "message": "Bu email ile kayıt bulunamadı"}), 404
        return jsonify({"success": False, "message": "Supabase hatası"}), 400

    except Exception as e:
        print("❌ Login hata:", e)
        return jsonify({"success": False, "message": str(e)}), 500

# Analyze CV with Gemini AI
@app.route("/analyze-cv", methods=["POST"])
def analyze_cv():
    """CV'yi Gemini AI ile analiz et"""
    try:
        data = request.json
        cv_text = data.get('cvText', '')
        
        if not cv_text:
            return jsonify({
                "success": False,
                "message": "CV metni boş olamaz"
            }), 400
        
        prompt = f"""
        Lütfen aşağıdaki CV metnini dikkatlice analiz et ve aşağıdaki JSON yapısına uygun şekilde, **sadece** JSON olarak yanıt ver ve lütfen her şeyi doldur ekiklik olmasın:
        "experienceLevel" için kullanıcının staj ve iş deneyimlerine dikkat et, sadece iş deneyimini baz alarak doldur staj deneyimini baz alma. Bütün hepsi staj ise junior olur. Ayrıca, süre hesaplmasını doğru yap.
        Tüm iş ilanlarını kaydettiğinden emin ol.
        {{
          "firstName": "ad",
          "lastName": "soyad",
          "email": "email@domain.com",
          "phone": "telefon",
          "location": "şehir, ülke",
          "currentTitle": "mevcut pozisyon",
          "summary": "kısa özet",
          "experienceLevel": "junior | mid | senior | lead", 
          "skills": ["beceri1", "beceri2"],
          "experiences": [{{"company": "şirket", "position": "pozisyon", "duration": "2022-2024", "description": "açıklama"}}],
          "education": {{
            "university": "üniversite",
            "degree": "bölüm",
            "graduationYear": "2022",
            "gpa": "3.5/4.0"
          }}
        }}

        CV Metni:
        {cv_text}
        """
        
        # Gemini API request
        gemini_payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 1000
            }
        }
        
        response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json=gemini_payload,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            
            if 'candidates' in result and result['candidates']:
                ai_response = result['candidates'][0]['content']['parts'][0]['text']
                
                # JSON temizle ve parse et
                cleaned_response = ai_response.replace('```json\n', '').replace('\n```', '').strip()
                
                try:
                    parsed_data = json.loads(cleaned_response)
                    return jsonify({
                        "success": True,
                        "data": parsed_data
                    })
                except json.JSONDecodeError as e:
                    return jsonify({
                        "success": False,
                        "message": f"AI yanıtı parse edilemedi: {str(e)}"
                    }), 400
            else:
                return jsonify({
                    "success": False,
                    "message": "AI'dan geçerli yanıt alınamadı"
                }), 400
        else:
            return jsonify({
                "success": False,
                "message": f"Gemini API hatası: {response.text}"
            }), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"CV analizi hatası: {str(e)}"
        }), 500

# Check backend health
@app.route("/health", methods=["GET"]) 
def health_check():
    """
    Backend servisinin çalışır durumda olup olmadığını kontrol eder.
    """
    return jsonify({
        "status": "healthy",
        "service": "KariyerAI Backend",
        "version": "1.0.0"
    })

import re

personalization_engine = None

# Analyze user profile to generate personalized parameters
def analyze_user_profile(profile):
    """Kullanıcı profilini analiz edip kişiselleştirme parametreleri üret"""
    try:

        current_title = profile.get("current_title", "").lower()
        skills = profile.get("skills", [])
        experience_level = profile.get("experience_level", "").lower()
        degree = profile.get("degree", "").lower()
        university = profile.get("university", "")
        
        personality_data = profile.get("personality_assessment", {})
        
        industry_focus = "technology"  
        if any(keyword in current_title for keyword in ["developer", "engineer", "programmer", "software"]):
            industry_focus = "technology"
        elif any(keyword in current_title for keyword in ["designer", "ux", "ui"]):
            industry_focus = "design"
        elif any(keyword in degree for keyword in ["endüstri mühendisliği", "industrial engineering"]):
            industry_focus = "industrial_engineering"
        elif any(keyword in degree for keyword in ["bilgisayar", "computer", "yazılım", "software"]):
            industry_focus = "technology"
        elif any(keyword in degree for keyword in ["makine", "mechanical"]):
            industry_focus = "mechanical_engineering"
        elif any(keyword in degree for keyword in ["elektrik", "electrical", "elektronik"]):
            industry_focus = "electrical_engineering"
        elif any(keyword in current_title for keyword in ["manager", "lead", "director"]):
            industry_focus = "management"
        elif any(keyword in current_title for keyword in ["analyst", "data", "research"]):
            industry_focus = "analytics"
        
        role_type = "individual_contributor"
        if any(keyword in current_title for keyword in ["senior", "lead", "principal"]):
            role_type = "senior_individual_contributor"
        elif any(keyword in current_title for keyword in ["manager", "director", "head"]):
            role_type = "management"
        elif any(keyword in current_title for keyword in ["junior", "intern", "entry"]) or experience_level in ["junior", "entry"]:
            role_type = "junior"
        elif "endüstri mühendisliği" in degree and experience_level in ["junior", "entry"]:
            role_type = "junior_engineer"
        
        technical_skills = {}
        programming_langs = []
        frameworks = []
        tools = []
        
        for skill in skills:
            skill_lower = skill.lower()
            if skill_lower in ["python", "javascript", "java", "c++", "c#", "go", "rust"]:
                programming_langs.append(skill)
            elif skill_lower in ["react", "vue", "angular", "django", "flask", "spring"]:
                frameworks.append(skill)
            elif skill_lower in ["git", "docker", "kubernetes", "aws", "azure"]:
                tools.append(skill)
        
        if "endüstri mühendisliği" in degree:
            tools.extend(["Excel", "SAP", "AutoCAD", "MATLAB", "Minitab", "Process Analysis"])
            if not programming_langs:
                programming_langs.extend(["Python", "SQL"])  
        
        technical_skills = {
            "programming_languages": programming_langs,
            "frameworks": frameworks,
            "tools": tools
        }
        
        soft_skills = []
        if personality_data.get("personality_type"):
            personality_type = personality_data.get("personality_type", "")
            if "E" in personality_type:
                soft_skills.extend(["iletişim", "takım çalışması", "liderlik"])
            if "I" in personality_type:
                soft_skills.extend(["analitik düşünce", "detay odaklılık", "bağımsız çalışma"])
            if "T" in personality_type:
                soft_skills.extend(["problem çözme", "mantıklı karar verme"])
            if "F" in personality_type:
                soft_skills.extend(["empati", "müşteri odaklılık"])
        
        skill_gaps = []
        if role_type in ["senior_individual_contributor", "management"] and not programming_langs:
            skill_gaps.append("teknik_liderlik")
        if industry_focus == "technology" and not frameworks:
            skill_gaps.append("modern_frameworks")
        if role_type == "management" and "liderlik" not in soft_skills:
            skill_gaps.append("liderlik_becerileri")
        
        career_trajectory = "stable"
        if experience_level in ["junior", "entry"]:
            career_trajectory = "growing"
        elif experience_level in ["senior", "lead"]:
            career_trajectory = "expert"
        elif "manager" in current_title:
            career_trajectory = "management_track"
        
        personalization_params = {
            "difficulty_preference": "medium",
            "learning_style": personality_data.get("learning_style", "mixed"),
            "simulation_types": ["problem_solving", "communication", "process_optimization"],
            "feedback_style": "detailed",
            "collaboration_preference": "team" if "E" in personality_data.get("personality_type", "") else "individual"
        }
        
        if "endüstri mühendisliği" in degree:
            personalization_params["simulation_types"] = ["process_optimization", "project_management", "data_analysis", "quality_control"]
        elif any(keyword in degree for keyword in ["bilgisayar", "yazılım"]):
            personalization_params["simulation_types"] = ["coding", "system_design", "debugging"]
        elif any(keyword in degree for keyword in ["makine", "elektrik"]):
            personalization_params["simulation_types"] = ["technical_problem_solving", "design_review", "testing"]
        
        if experience_level in ["junior", "entry"]:
            personalization_params["difficulty_preference"] = "easy"
            if "endüstri mühendisliği" in degree:
                personalization_params["simulation_types"] = ["basic_process_analysis", "entry_level_projects", "learning_orientation"]
        elif experience_level in ["senior", "lead"]:
            personalization_params["difficulty_preference"] = "hard"
            personalization_params["simulation_types"].extend(["leadership", "strategic_thinking"])
        
        return {
            'industry_focus': industry_focus,
            'role_type': role_type,
            'technical_skills': technical_skills,
            'soft_skills': soft_skills,
            'skill_gaps': skill_gaps,
            'career_trajectory': career_trajectory,
            'personalization_params': personalization_params,
            'degree': degree,
            'university': university
        }
        
    except Exception as e:
        print(f"Kullanıcı analizi hatası: {str(e)}")
        return {
            'industry_focus': 'technology',
            'role_type': 'general',
            'technical_skills': {},
            'soft_skills': [],
            'skill_gaps': [],
            'career_trajectory': 'stable',
            'personalization_params': {
                "difficulty_preference": "medium",
                "learning_style": "mixed",
                "simulation_types": ["coding", "communication"],
                "feedback_style": "detailed"
            }
        }

# Create a career simulation for users
@app.route("/career-simulation/<user_id>", methods=["GET", "OPTIONS"])
def career_simulation(user_id):
    if request.method == "OPTIONS":
        return jsonify({"message": "CORS preflight OK"}), 200

    print("📌 [career_simulation] İstek alındı | user_id:", user_id)

    try:
        if str(user_id).startswith('temp_'):
            print(f"📌 Geçici kullanıcı {user_id} için varsayılan simülasyon oluşturuluyor")
            return generate_default_simulation()
        
        headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}"
        }
        profile_url = f"{SUPABASE_API_URL}/rest/v1/profiles?id=eq.{user_id}"
        print("📌 Supabase GET:", profile_url)

        profile_resp = requests.get(profile_url, headers=headers)
        print("📌 Supabase status:", profile_resp.status_code)
        print("📌 Supabase response:", profile_resp.text[:300], "...")

        if profile_resp.status_code != 200 or not profile_resp.json():
            print("❌ Profil bulunamadı, varsayılan simülasyon döndürülüyor")
            return generate_default_simulation()

        profile = profile_resp.json()[0]
        current_title = profile.get("current_title", "Bilinmeyen Pozisyon")
        skills = ", ".join(profile.get("skills", [])) or "Belirtilmemiş"
        print(f"📌 Profil verisi: title={current_title}, skills={skills}")


        user_analysis = analyze_user_profile(profile)
        print(f"📌 Kullanıcı analizi: {user_analysis.get('personalization_params', {})}")

        base_prompt = f"""
        Sen bir kariyer simülasyonu üreticisisin. MUTLAKA kullanıcının gerçek profiline uygun simülasyon üret.
        
        KULLANICI PROFİLİ (DİKKATLE OKU):
        Üniversite: {profile.get("university", "Belirtilmemiş")}
        Bölüm: {profile.get("degree", "Belirtilmemiş")}
        Mezuniyet Yılı: {profile.get("graduation_year", "Belirtilmemiş")}
        Mevcut Pozisyon: {current_title}
        Beceriler: {skills}
        Deneyim Seviyesi: {profile.get("experience_level", "Belirtilmemiş")}
        Sektör Odağı: {user_analysis.get('industry_focus', 'Genel')}
        Rol Tipi: {user_analysis.get('role_type', 'Genel')}
        Teknik Beceriler: {user_analysis.get('technical_skills', {})}
        Soft Beceriler: {user_analysis.get('soft_skills', [])}
        Eksik Beceriler: {user_analysis.get('skill_gaps', [])}
        Kariyer Yörüngesi: {user_analysis.get('career_trajectory', 'Belirtilmemiş')}

        ❗❗ KRİTİK KURALLAR ❗❗
        1. Kullanıcının bölümü "{profile.get("degree", "")}" - SİMÜLASYON MUTLAKA BU ALANDA OLMALI!
        2. Industry focus: "{user_analysis.get('industry_focus', 'Genel')}" - Buna göre senaryo yaz!
        3. Role type: "{user_analysis.get('role_type', 'Genel')}" - Pozisyon seviyesine uygun olsun!
        
        BÖLÜME GÖRE ZORUNLU REHBERLİK:
        
        → Eğer "Endüstri Mühendisliği" mezunuysa:
        - ✅ Üretim planlama, kalite kontrol, süreç iyileştirme, verimlilik analizi görevleri
        - ✅ SAP, Excel, Minitab, AutoCAD, MATLAB araçları
        - ✅ Fabrika/üretim ortamında, manufacturing şirketinde
        - ✅ Maliyet optimizasyonu, lean manufacturing, 6 sigma konuları
        - ❌ Kod yazma, web development, mobil app geliştirme YOK!
        
        → Eğer "Bilgisayar/Yazılım Mühendisliği" mezunuysa:
        - ✅ Kod yazma, sistem tasarımı, debugging, code review görevleri
        - ✅ GitHub, VS Code, Jira, Docker, AWS araçları
        - ✅ Teknoloji şirketinde, startup'ta veya yazılım departmanında
        - ✅ API geliştirme, database yönetimi, DevOps konuları
        - ❌ Fabrika üretimi, kalite kontrol, makine mühendisliği görevleri YOK!
        
        → Eğer "Makine Mühendisliği" mezunuysa:
        - ✅ Tasarım, CAD çalışmaları, prototip geliştirme, test görevleri
        - ✅ SolidWorks, AutoCAD, ANSYS, MATLAB araçları
        - ✅ İmalat şirketinde, ar-ge departmanında
        - ✅ Mekanik sistemler, termodinamik, malzeme mühendisliği
        
        → Eğer diğer bölümler varsa ona göre uyarla!
        
        YANIT FORMATI (SADECE JSON):
        {{
          "title": "Kullanıcının bölümüne uygun başlık",
          "category": "Bölümün ana kategorisi", 
          "difficulty": "Deneyim seviyesine göre",
          "context": "Bölüme uygun şirket ve ortam tanımı",
          "daily_schedule": [
            {{
              "time": "09:00",
              "task": "Bölüme özel görev",
              "description": "Detaylı açıklama",
              "priority": "Yüksek",
              "department": "İlgili departman",
              "team_size": 3,
              "tools": ["Bölüme uygun araçlar"],
              "duration_min": 60
            }}
          ],
          "emails": [
            {{"from": "email@company.com", "subject": "Bölüme uygun konu", "summary": "Özet"}}
          ],
          "meetings": [
            {{"time": "11:00", "participants": ["İlgili roller"], "topic": "Bölüme uygun konu", "summary": "Özet"}}
          ],
          "situation": "Bölüme özel gerçekçi problem",
          "question": "Bu durumda ne yaparsınız?",
          "options": [
            {{"id":"a","text":"Seçenek1","feedback":"Analiz"}},
            {{"id":"b","text":"Seçenek2","feedback":"Analiz"}}
          ]
        }}
        
        ❗ UYARI: Yalnızca geçerli JSON döndür, başka hiçbir metin ekleme!
        ❗ KONTROL: Simülasyon kullanıcının bölümüne uygun mu? Eğer değilse baştan yaz!
        """

        prompt = base_prompt

        gemini_payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.4, "maxOutputTokens": 3000}
        }
        response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json=gemini_payload
        )

        print("📌 Gemini status:", response.status_code)
        if response.status_code != 200:
            print("❌ Gemini API hatası:", response.text)
            return jsonify({"success": False, "message": "Gemini API hatası"}), 400

        result = response.json()
        ai_response = result['candidates'][0]['content']['parts'][0]['text']
        print("📌 Ham Gemini yanıt (ilk 500 karakter):", ai_response[:500])

        json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
        if not json_match:
            print("❌ Gemini yanıtında JSON bulunamadı")
            print("📌 Tam yanıt:", ai_response)
            return jsonify({"success": False, "message": "Gemini yanıtında JSON bulunamadı"}), 500

        cleaned = json_match.group(0)
        print("📌 Temizlenen JSON (ilk 300 karakter):", cleaned[:300])

        try:
            scenario = json.loads(cleaned)
            
            user_degree = profile.get("degree", "").lower()
            scenario_title = scenario.get("title", "").lower()
            scenario_category = scenario.get("category", "").lower()
            scenario_context = scenario.get("context", "").lower()
            
            print(f"🔍 Uygunluk kontrolü: Bölüm='{user_degree}' | Senaryo='{scenario_title}'")
            
            degree_mismatch = False
            mismatch_reason = ""
            
            if "endüstri mühendisliği" in user_degree:
                if any(keyword in scenario_title + scenario_category + scenario_context for keyword in 
                       ["backend", "frontend", "developer", "yazılım", "kod", "programming", "react", "javascript", "python", "api"]):
                    degree_mismatch = True
                    mismatch_reason = "Endüstri Mühendisi için yazılım geliştirme simülasyonu üretildi"
                    
            elif any(keyword in user_degree for keyword in ["bilgisayar", "yazılım", "computer", "software"]):
                if any(keyword in scenario_title + scenario_category + scenario_context for keyword in 
                       ["üretim", "fabrika", "kalite kontrol", "süreç", "manufacturing", "sap", "lean"]):
                    degree_mismatch = True
                    mismatch_reason = "Yazılım Mühendisi için üretim simülasyonu üretildi"
                    
            elif any(keyword in user_degree for keyword in ["makine", "mechanical"]):
                if any(keyword in scenario_title + scenario_category + scenario_context for keyword in 
                       ["yazılım", "kod", "programming", "web", "frontend", "backend"]):
                    degree_mismatch = True
                    mismatch_reason = "Makine Mühendisi için yazılım simülasyonu üretildi"
            
            if degree_mismatch:
                print(f"❌ UYUMSUZLUK: {mismatch_reason}")
                print("🔄 Bölüme özel simülasyon oluşturuluyor...")
                return generate_degree_specific_simulation(profile)
            
            print("✅ Senaryo bölüme uygun - kabul ediliyor")
            return jsonify({"success": True, "data": scenario})
            
        except Exception as e:
            print("❌ JSON parse hatası:", str(e))
            print("📌 Ham yanıt:", ai_response)
            return generate_degree_specific_simulation(profile)

    except Exception as e:
        print("❌ career_simulation genel hata:", traceback.format_exc())
        return jsonify({"success": False, "message": f"Hata: {str(e)}"}), 500

# Interface for task simulation
@app.route("/task-simulation", methods=["POST"])
def task_simulation():
    """Bir görev için detaylı simülasyon oluştur"""
    try:
        data = request.json
        task = data.get('task', {})
        user = data.get('user', {})
        
        task_type = task.get('task', '').lower()
        current_title = user.get('current_title', 'Developer')
        
        if 'email' in task_type or 'mail' in task_type:
            prompt = f"""
            Kullanıcı {current_title} pozisyonunda ve "{task.get('task')}" görevini yapıyor.
            Bu görev için gerçekçi bir email simülasyonu oluştur.
            
            SADECE JSON formatında yanıt ver, başka hiçbir açıklama veya metin ekleme:
            {{
                "type": "email",
                "scenario": "Email senaryosu açıklaması",
                "incoming_email": {{
                    "from": "gönderen@company.com",
                    "subject": "Konu başlığı",
                    "body": "Email içeriği",
                    "priority": "Yüksek|Orta|Düşük",
                    "requires_response": true
                }},
                "context": "Bu emaile nasıl yanıt vermeli açıklama",
                "success_criteria": ["Başarı kriterleri listesi"]
            }}
            """
        elif 'kod' in task_type or 'code' in task_type or 'geliştir' in task_type:
            prompt = f"""
            Kullanıcı {current_title} pozisyonunda ve "{task.get('task')}" görevini yapıyor.
            Bu görev için gerçekçi bir kod yazma simülasyonu oluştur.
            
            SADECE JSON formatında yanıt ver, başka hiçbir açıklama veya metin ekleme:
            {{
                "type": "coding",
                "scenario": "Kod yazma senaryosu",
                "problem": "Çözülmesi gereken problem açıklaması",
                "requirements": ["Gereksinimler listesi"],
                "example_input": "Örnek girdi",
                "expected_output": "Beklenen çıktı",
                "constraints": ["Kısıtlamalar"],
                "hints": ["İpuçları"],
                "difficulty": "Kolay|Orta|Zor"
            }}
            """
        elif 'toplantı' in task_type or 'meeting' in task_type:
            prompt = f"""
            Kullanıcı {current_title} pozisyonunda ve "{task.get('task')}" görevini yapıyor.
            Bu görev için gerçekçi bir toplantı simülasyonu oluştur.
            
            SADECE JSON formatında yanıt ver, başka hiçbir açıklama veya metin ekleme:
            {{
                "type": "meeting",
                "scenario": "Toplantı senaryosu",
                "agenda": ["Gündem maddeleri"],
                "participants": [
                    {{"name": "İsim", "role": "Rol", "personality": "Kişilik"}},
                    {{"name": "İsim", "role": "Rol", "personality": "Kişilik"}}
                ],
                "key_decisions": ["Alınması gereken kararlar"],
                "challenges": ["Karşılaşabilecek zorluklar"],
                "success_metrics": ["Başarı metrikleri"]
            }}
            """
        else:
            prompt = f"""
            Kullanıcı {current_title} pozisyonunda ve "{task.get('task')}" görevini yapıyor.
            Bu görev için genel bir simülasyon oluştur.
            
            SADECE JSON formatında yanıt ver, başka hiçbir açıklama veya metin ekleme:
            {{
                "type": "general",
                "scenario": "Görev senaryosu",
                "mini_event": "Bu görev sırasında yaşanabilecek bir olay",
                "challenge": "Karşılaşabilecek zorluk",
                "decision": {{
                    "question": "Karar sorusu",
                    "options": [
                        {{"id": "a", "text": "Seçenek 1"}},
                        {{"id": "b", "text": "Seçenek 2"}}
                    ]
                }},
                "resources": ["Kullanabileceği kaynaklar"],
                "tips": ["İpuçları"]
            }}
            """
        
        gemini_payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 2000,
                "topP": 0.8,
                "topK": 10
            }
        }
        
        response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json=gemini_payload
        )
        
        if response.status_code == 200:
            result = response.json()
            ai_response = result['candidates'][0]['content']['parts'][0]['text']
            
            print(f"📌 Ham Gemini yanıt (task-simulation): {ai_response[:500]}...")
            
            json_content = None
            
            markdown_match = re.search(r'```json\s*(\{.*?\})\s*```', ai_response, re.DOTALL)
            if markdown_match:
                json_content = markdown_match.group(1)
                print("📌 Markdown kod bloğundan JSON çıkarıldı")
            else:
                json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
                if json_match:
                    json_content = json_match.group(0)
                    print("📌 Regex ile JSON çıkarıldı")
            
            if json_content:
                print(f"📌 Çıkarılan JSON içeriği: {json_content[:300]}...")
                
                try:
                    simulation_data = json.loads(json_content)
                    return jsonify({"success": True, "data": simulation_data})
                except json.JSONDecodeError as je:
                    print(f"📌 JSON parse hatası: {str(je)}")
                    print(f"📌 Hatalı JSON: {json_content}")
                    return jsonify({"success": False, "message": f"JSON parse hatası: {str(je)}"}), 400
            else:
                print(f"📌 JSON formatı bulunamadı. Ham yanıt: {ai_response}")
                return jsonify({"success": False, "message": "JSON formatı bulunamadı"}), 400
        
        print(f"📌 Gemini API hatası: {response.status_code} - {response.text}")
        return jsonify({"success": False, "message": "Görev simülasyonu oluşturulamadı"}), 400
        
    except Exception as e:
        print(f"Task simulation error: {str(e)}")
        return jsonify({"success": False, "message": f"Hata: {str(e)}"}), 500

# Email simülation chat
@app.route("/email-chat", methods=["POST"])
def email_chat():
    """Email konversasyonu için LLM chat"""
    try:
        data = request.json
        user_message = data.get('message', '')
        chat_context = data.get('context', {})
        user_role = data.get('user_role', 'Employee')
        
        prompt = f"""
        Sen bir müşteri/iş ortağı rolündesin. Kullanıcı {user_role} pozisyonunda çalışıyor.
        
        Kontext: {chat_context.get('scenario', 'İş emaili konversasyonu')}
        
        Kullanıcının mesajı: "{user_message}"
        
        Bu mesaja gerçekçi, profesyonel bir müşteri/iş ortağı gibi yanıt ver.
        Yanıtın JSON formatında olsun:
        {{
            "reply": "Email yanıtı",
            "tone": "Profesyonel|Samimi|Resmi|Acil",
            "satisfaction": "Memnun|Nötr|Memnun değil",
            "next_action": "Bir sonraki beklenen aksiyon",
            "feedback": "Kullanıcının mesajı hakkında geri bildirim"
        }}
        """
        
        gemini_payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1000}
        }
        
        response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json=gemini_payload
        )
        
        if response.status_code == 200:
            result = response.json()
            ai_response = result['candidates'][0]['content']['parts'][0]['text']
            
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                reply_data = json.loads(json_match.group(0))
                return jsonify({"success": True, "data": reply_data})
        
        return jsonify({"success": False, "message": "Email yanıtı oluşturulamadı"}), 400
        
    except Exception as e:
        print(f"Email chat error: {str(e)}")
        return jsonify({"success": False, "message": f"Hata: {str(e)}"}), 500

# Code evaluation endpoint
@app.route("/evaluate-code", methods=["POST"])
def evaluate_code():
    """Kullanıcının yazdığı kodu değerlendir"""
    try:
        data = request.json
        user_code = data.get('code', '')
        problem = data.get('problem', '')
        requirements = data.get('requirements', [])
        
        prompt = f"""
        Kullanıcının yazdığı kodu değerlendir:
        
        Problem: {problem}
        Gereksinimler: {', '.join(requirements)}
        
        Kullanıcının kodu:
        ```
        {user_code}
        ```
        
        Değerlendirmeyi JSON formatında döndür:
        {{
            "correctness": "Doğru|Kısmen doğru|Yanlış",
            "efficiency": "Verimli|Orta|Verimsiz",
            "readability": "Okunabilir|Orta|Karmaşık",
            "best_practices": "İyi|Orta|Kötü",
            "feedback": "Detaylı geri bildirim",
            "suggestions": ["İyileştirme önerileri"],
            "corrected_code": "Düzeltilmiş kod (eğer gerekirse)",
            "explanation": "Çözümün açıklaması"
        }}
        """
        
        gemini_payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.3, "maxOutputTokens": 2000}
        }
        
        response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json=gemini_payload
        )
        
        if response.status_code == 200:
            result = response.json()
            ai_response = result['candidates'][0]['content']['parts'][0]['text']
            
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                evaluation = json.loads(json_match.group(0))
                return jsonify({"success": True, "data": evaluation})
        
        return jsonify({"success": False, "message": "Kod değerlendirilemedi"}), 400
        
    except Exception as e:
        print(f"Code evaluation error: {str(e)}")
        return jsonify({"success": False, "message": f"Hata: {str(e)}"}), 500

# Complete task (without scoring)
@app.route("/complete-task", methods=["POST"])
def complete_task():
    """Görev tamamlandığında ilerleme kaydet"""
    try:
        data = request.json
        user_id = data.get('user_id')
        task_id = data.get('task_id')
        completion_data = data.get('completion_data', {})
        
        # Supabase save task completion
        task_completion = {
            "user_id": user_id,
            "task_id": task_id,
            "completion_data": completion_data,
            "completed_at": "now()"
        }
        
        headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(
            f"{SUPABASE_API_URL}/rest/v1/task_completions",
            headers=headers,
            json=task_completion
        )
        
        if response.status_code in [200, 201]:
            return jsonify({"success": True, "message": "Görev tamamlandı"})
        else:
            return jsonify({"success": False, "message": "Görev kaydedilemedi"}), 400
            
    except Exception as e:
        print(f"Task completion error: {str(e)}")
        return jsonify({"success": False, "message": f"Hata: {str(e)}"}), 500

# Get hint for user during task
@app.route("/get-hint", methods=["POST"])
def get_hint():
    """Kullanıcıya görev sırasında ipucu ver"""
    try:
        data = request.json
        current_task = data.get('task', {})
        user_progress = data.get('progress', {})
        user_role = data.get('user_role', 'Employee')
        
        prompt = f"""
        Kullanıcı {user_role} pozisyonunda "{current_task.get('task', '')}" görevini yapıyor.
        Şu anki ilerleme: {user_progress}
        
        Kullanıcıya yardımcı olacak bir ipucu ver. JSON formatında:
        {{
            "hint": "İpucu metni",
            "type": "Teknik|Süreç|İletişim|Strateji",
            "urgency": "Düşük|Orta|Yüksek",
            "action": "Önerilen aksiyon"
        }}
        """
        
        gemini_payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.6, "maxOutputTokens": 500}
        }
        
        response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json=gemini_payload
        )
        
        if response.status_code == 200:
            result = response.json()
            ai_response = result['candidates'][0]['content']['parts'][0]['text']
            
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                hint_data = json.loads(json_match.group(0))
                return jsonify({"success": True, "data": hint_data})
        
        return jsonify({"success": False, "message": "İpucu oluşturulamadı"}), 400
        
    except Exception as e:
        print(f"Hint generation error: {str(e)}")
        return jsonify({"success": False, "message": f"Hata: {str(e)}"}), 500

# Get realistic AI responses during meetings
@app.route("/meeting-chat", methods=["POST"])
def meeting_chat():
    """Toplantıda gerçekçi AI katılımcı yanıtları"""
    try:
        data = request.json
        user_message = data.get('message', '')
        participant = data.get('participant', 'Proje Yöneticisi')
        context = data.get('context', {})
        conversation_history = data.get('conversation_history', [])
        base_prompt = data.get('prompt', '')
        
        if not user_message:
            return jsonify({"success": False, "message": "Mesaj boş olamaz"}), 400

        # Detailed prompt with conversation context
        conversation_context = ""
        if conversation_history:
            conversation_context = "Önceki konuşma:\n" + "\n".join([
                f"{msg.get('speaker', 'Bilinmeyen')}: {msg.get('message', '')}" 
                for msg in conversation_history[-3:]  # Son 3 mesaj
            ])

        enhanced_prompt = f"""
        {base_prompt}
        
        {conversation_context}
        
        ÇOK ÖNEMLİ: Yanıtın gerçek bir iş toplantısındaki gibi olsun:
        - Kısa ve net olsun (1-2 cümle max)
        - Kişiliğe uygun olsun
        - Yapıcı eleştiri veya öneriler içerebilir
        - Bazen karşı görüş bildirebilir
        - Somut örnekler verebilir
        - Takip soruları sorabilir
        
        Yanıtını SADECE JSON formatında ver, başka hiçbir şey ekleme:
        """

        gemini_payload = {
            "contents": [{"parts": [{"text": enhanced_prompt}]}],
            "generationConfig": {
                "temperature": 0.8,  
                "maxOutputTokens": 500,
                "topP": 0.9
            }
        }
        
        response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json=gemini_payload,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            ai_response = result['candidates'][0]['content']['parts'][0]['text']
            
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                try:
                    response_data = json.loads(json_match.group(0))
                    
                    if not response_data.get('response'):
                        response_data['response'] = "İlginç bir bakış açısı. Bu konuyu daha detaylı konuşabilir miyiz?"
                    
                    return jsonify({"success": True, "data": response_data})
                except json.JSONDecodeError:
                    fallback_responses = {
                        'Proje Yöneticisi': "Bu konuda deadline'ımızı nasıl etkiler? Kaynak planlaması yapmamız gerekiyor.",
                        'Senior Developer': "Teknik implementasyon açısından hangi approach'u öneriyorsun?",
                        'UX Designer': "Kullanıcı deneyimi açısından bu değişiklik nasıl bir etki yaratır?",
                        'QA Engineer': "Bu feature için test senaryolarımızı nasıl genişletmeliyiz?"
                    }
                    
                    return jsonify({
                        "success": True, 
                        "data": {
                            "response": fallback_responses.get(participant, "İyi bir öneri, detaylarını konuşalım."),
                            "emotion": "neutral",
                            "follow_up_question": None,
                            "action_item": None
                        }
                    })
        
        return jsonify({"success": False, "message": "AI yanıtı oluşturulamadı"}), 400
        
    except Exception as e:
        print(f"Meeting chat error: {str(e)}")
        return jsonify({"success": False, "message": f"Hata: {str(e)}"}), 500

# Save personality assessment results
@app.route("/save-personality-assessment", methods=["POST"])
def save_personality_assessment():
    """Kullanıcının kişilik testi sonuçlarını kaydet"""
    try:
        data = request.json
        print(f"Received personality assessment data: {data}")
        
        user_id = data.get('user_id')
        assessment_results = data.get('assessment_results', {})
        
        if not user_id:
            print("Error: Missing user_id")
            return jsonify({"success": False, "message": "Kullanıcı ID eksik"}), 400
            
        if not assessment_results:
            print("Error: Missing assessment_results")
            return jsonify({"success": False, "message": "Test sonuçları eksik"}), 400
        
        if str(user_id).startswith('temp_'):
            print(f"Temporary user {user_id}, skipping database save")
            return jsonify({
                "success": True,
                "message": "Geçici kullanıcı - sonuçlar yerel olarak kaydedildi"
            })
        
        print(f"Database column missing, only saving to localStorage for user {user_id}")
        return jsonify({
            "success": True,
            "message": "Kişilik testi sonuçları yerel olarak kaydedildi (veritabanı desteği yakında)"
        })
        
        """
        # Supabase'e kişilik testi sonuçlarını kaydet
        headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # Önce mevcut profili güncelle
        personality_data = {
            "personality_assessment": assessment_results
        }
        
        print(f"Updating user {user_id} with personality data")
        response = requests.patch(
            f"{SUPABASE_API_URL}/rest/v1/profiles?id=eq.{user_id}",
            headers=headers,
            json=personality_data
        )
        
        print(f"Supabase response status: {response.status_code}")
        print(f"Supabase response: {response.text}")
        
        if response.status_code == 200:
            return jsonify({
                "success": True,
                "message": "Kişilik testi sonuçları kaydedildi"
            })
        else:
            return jsonify({
                "success": False,
                "message": f"Kayıt hatası: {response.text}"
            }), 400
        """
            
    except Exception as e:
        print(f"Personality assessment save error: {str(e)}")
        return jsonify({"success": False, "message": f"Hata: {str(e)}"}), 500

#   Get user analysis
@app.route("/get-user-analysis/<uuid:user_id>", methods=["GET"])
def get_user_analysis(user_id):
    """Kullanıcının analiz edilmiş profilini getir"""
    try:
        headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}"
        }
        
        response = requests.get(
            f"{SUPABASE_API_URL}/rest/v1/profiles?id=eq.{user_id}",
            headers=headers
        )
        
        if response.status_code == 200:
            profiles = response.json()
            if profiles:
                profile = profiles[0]
                user_analysis = analyze_user_profile(profile)
                
                return jsonify({
                    "success": True,
                    "data": {
                        "profile": profile,
                        "analysis": user_analysis
                    }
                })
            return jsonify({"success": False, "message": "Profil bulunamadı"}), 404
        return jsonify({"success": False, "message": "Veri alınamadı"}), 400
        
    except Exception as e:
        print(f"User analysis error: {str(e)}")
        return jsonify({"success": False, "message": f"Hata: {str(e)}"}), 500

def generate_degree_specific_simulation(profile):
    """Kullanıcının bölümüne özel garantili simülasyon oluştur"""
    
    degree = profile.get("degree", "").lower()
    experience_level = profile.get("experience_level", "junior")
    university = profile.get("university", "")
    first_name = profile.get("first_name", "Kullanıcı")
    
    print(f"🎯 Bölüme özel simülasyon oluşturuluyor: {degree}")
    
    if "endüstri mühendisliği" in degree:
        return jsonify({
            "success": True,
            "data": {
                "title": "Endüstri Mühendisi - Üretim Süreç Analizi",
                "company": "ProduTech Manufacturing A.Ş.",
                "role": f"{'Senior' if experience_level == 'senior' else 'Junior'} Endüstri Mühendisi",
                "category": "Üretim & Süreç Optimizasyonu",
                "difficulty": "Orta" if experience_level == "junior" else "Zor",
                "context": f"{university} {degree} mezunu {first_name} olarak, 250 çalışanlı otomotiv yan sanayi üretim tesisinde çalışıyorsunuz. Şirket ISO 9001 ve IATF 16949 sertifikalarına sahip, lean manufacturing prensiplerine göre çalışıyor.",
                "daily_schedule": [
                    {
                        "time": "08:00",
                        "task": "Vardiya Devir Raporu İncelemesi",
                        "description": "Gece vardiyasından gelen üretim ve kalite raporlarını analiz etme",
                        "department": "Üretim Planlama",
                        "priority": "Yüksek",
                        "duration_min": 30,
                        "team_size": 1,
                        "tools": ["SAP", "Excel", "Üretim Raporları"]
                    },
                    {
                        "time": "08:30",
                        "task": "Hat Başı Toplantısı",
                        "description": "Vardiya liderleri ile günlük hedefleri ve sorunları değerlendirme",
                        "department": "Üretim",
                        "priority": "Kritik",
                        "duration_min": 45,
                        "team_size": 8,
                        "tools": ["Tableau", "KPI Dashboard"]
                    },
                    {
                        "time": "09:30",
                        "task": "Zaman Etüdü ve İş Ölçümü",
                        "description": "Yeni ürün hattında cycle time analizi yapma",
                        "department": "Süreç Mühendisliği",
                        "priority": "Yüksek",
                        "duration_min": 120,
                        "team_size": 2,
                        "tools": ["Kronometre", "Video Analiz", "MTM Tabloları"]
                    },
                    {
                        "time": "12:00",
                        "task": "Kaizen Projesi Geliştirme",
                        "description": "Atık azaltma için 5S implementasyonu planlama",
                        "department": "Sürekli İyileştirme",
                        "priority": "Orta",
                        "duration_min": 90,
                        "team_size": 4,
                        "tools": ["Fishbone Diagram", "5 Why Analysis", "PDCA"]
                    },
                    {
                        "time": "14:00",
                        "task": "Kalite Kontrol Analizi",
                        "description": "SPC charts inceleme ve süreç kapasitesi hesaplama",
                        "department": "Kalite Güvence",
                        "priority": "Yüksek",
                        "duration_min": 75,
                        "team_size": 3,
                        "tools": ["Minitab", "Control Charts", "Cp/Cpk Analizi"]
                    },
                    {
                        "time": "15:30",
                        "task": "Tedarikçi Performans Değerlendirmesi",
                        "description": "Hammadde kalitesi ve teslimat performansı analizi",
                        "department": "Tedarik Zinciri",
                        "priority": "Orta",
                        "duration_min": 60,
                        "team_size": 2,
                        "tools": ["Supplier Scorecard", "SAP MM", "Excel Pivot"]
                    }
                ],
                "emails": [
                    {"from": "production.manager@produtech.com", "subject": "Üretim Hedefi Revizyonu", "summary": "Bu hafta %3 artırılmış üretim hedefi ve kaynak planlaması"},
                    {"from": "quality@produtech.com", "subject": "Müşteri Şikayeti - Acil", "summary": "BMW'den gelen part reject raporu ve düzeltici faaliyet talebi"},
                    {"from": "maintenance@produtech.com", "subject": "Planlı Bakım Programı", "summary": "Önümüzdeki hafta için ekipman bakım takvimi"}
                ],
                "meetings": [
                    {"time": "08:30", "participants": ["Vardiya Liderleri", "Kalite Sorumlusu"], "topic": "Günlük Üretim Planlama", "summary": "Kapasite, kalite ve teslimat hedefleri"},
                    {"time": "16:00", "participants": ["Plant Manager", "Mühendislik Ekibi"], "topic": "Haftalık İyileştirme Review", "summary": "Kaizen projelerinin ilerleme durumu"}
                ],
                "situation": "Ana üretim hattında beklenmedik bir şekilde %15 verimlilik düşüşü yaşanıyor. Müşteri siparişlerinde gecikme riski var ve üst yönetim acil çözüm bekliyor. İlk analiz sonuçlarına göre sorun ekipman, operatör performansı veya süreç akışından kaynaklanıyor olabilir.",
                "question": "Bu kritik durumda hangi yaklaşımı benimsersiniz?",
                "options": [
                    {"id":"a","text":"Immediate root cause analysis ile 8D metodolojisi uygulayarak sistematik problem çözme","feedback":"Mükemmel yaklaşım. 8D (8 Disciplines) endüstride standart problem solving metodudur. Kök nedeni bulup kalıcı çözüm sağlar. Takım çalışmasını da destekler."},
                    {"id":"b","text":"Hemen yedek ekipman devreye alıp üretimi sürdürme, sonra analiz yapma","feedback":"Pragmatik yaklaşım, üretim sürekliliğini sağlar ama kök neden çözülmezse tekrar edebilir. Kısa vadeli çözüm."},
                    {"id":"c","text":"En deneyimli operatörleri bu hatta görevlendirip performansı izleme","feedback":"İnsan faktörüne odaklanmış çözüm. Faydalı olabilir ama ekipman veya süreç sorunuysa çözmez. Diğer hatları etkileyebilir."},
                    {"id":"d","text":"Tüm üretim parametrelerini fabrika ayarlarına resetleyip sıfırdan başlama","feedback":"Riskli yaklaşım. Daha fazla problem yaratabilir ve standardizasyon ilkelerine aykırı. Sorunun kaynağını anlamadan müdahale tehlikelidir."}
                ]
            },
            "message": "Endüstri Mühendisliği'ne özel simülasyon oluşturuldu"
        })
        
    elif any(keyword in degree for keyword in ["bilgisayar", "yazılım", "computer", "software"]):
        return jsonify({
            "success": True,
            "data": {
                "title": "Software Engineer - Microservices Geliştirme",
                "company": "DevTech Solutions",
                "role": f"{'Senior' if experience_level == 'senior' else 'Junior'} Software Engineer",
                "category": "Yazılım Geliştirme",
                "difficulty": "Orta" if experience_level == "junior" else "Zor",
                "context": f"{university} {degree} mezunu {first_name} olarak, 50+ developer'lı bir teknoloji şirketinde cloud-native uygulamalar geliştiriyorsunuz. Microservices architecture, Docker, Kubernetes teknolojileri kullanılıyor.",
                "daily_schedule": [
                    {
                        "time": "09:00",
                        "task": "Daily Standup Toplantısı",
                        "description": "Scrum ekibi ile günlük planlama ve impediment'ların konuşulması",
                        "department": "Backend Development",
                        "priority": "Yüksek",
                        "duration_min": 30,
                        "team_size": 8,
                        "tools": ["Jira", "Slack", "Zoom"]
                    },
                    {
                        "time": "09:30",
                        "task": "API Endpoint Development",
                        "description": "User service için yeni REST API endpoints yazma",
                        "department": "Backend",
                        "priority": "Kritik",
                        "duration_min": 120,
                        "team_size": 1,
                        "tools": ["VS Code", "Node.js", "Express", "MongoDB"]
                    },
                    {
                        "time": "12:00",
                        "task": "Code Review Session",
                        "description": "Team lead ile pull request'leri review etme",
                        "department": "Development",
                        "priority": "Yüksek",
                        "duration_min": 60,
                        "team_size": 3,
                        "tools": ["GitHub", "SonarQube", "ESLint"]
                    },
                    {
                        "time": "14:00",
                        "task": "Unit Test Writing",
                        "description": "Yeni API endpoints için comprehensive test coverage",
                        "department": "Quality Assurance",
                        "priority": "Yüksek",
                        "duration_min": 90,
                        "team_size": 1,
                        "tools": ["Jest", "Supertest", "Istanbul"]
                    },
                    {
                        "time": "15:30",
                        "task": "DevOps Pipeline Optimization",
                        "description": "CI/CD pipeline'ında build time iyileştirme",
                        "department": "DevOps",
                        "priority": "Orta",
                        "duration_min": 75,
                        "team_size": 2,
                        "tools": ["Jenkins", "Docker", "Kubernetes", "AWS"]
                    }
                ],
                "emails": [
                    {"from": "product.manager@devtech.com", "subject": "Sprint Planning - New Features", "summary": "Gelecek sprint için kullanıcı hikayelerinin teknik analizi"},
                    {"from": "devops@devtech.com", "subject": "Production Issue Alert", "summary": "API response time'larda artış tespit edildi, investigation gerekli"},
                    {"from": "security@devtech.com", "subject": "Vulnerability Scan Results", "summary": "Dependency'lerde güvenlik açığı tespit edildi, update gerekli"}
                ],
                "meetings": [
                    {"time": "09:00", "participants": ["Scrum Team", "Product Owner"], "topic": "Daily Standup", "summary": "Sprint progress ve impediment'lar"},
                    {"time": "16:00", "participants": ["Tech Lead", "Senior Developers"], "topic": "Architecture Review", "summary": "Microservices communication patterns"}
                ],
                "situation": "Production'da kritik bir API endpoint'te unexpected error rate artışı var (%0.1'den %2.5'e çıktı). Monitoring sistemleri alarm veriyor ve müşteri deneyimi etkileniyor. Database connection pool, memory usage ve network latency metriklerini inceleme gerekiyor.",
                "question": "Bu production issue'yu nasıl handle edersiniz?",
                "options": [
                    {"id":"a","text":"Incident response procedure başlatıp, monitoring dashboard'larını deep dive analysis yapma","feedback":"Mükemmel yaklaşım. Önce impact assessment, sonra systematic debugging. Industry best practice olan incident management sürecini takip ediyor."},
                    {"id":"b","text":"Hemen rollback yapıp previous stable version'a dönme","feedback":"Safe approach ama root cause'u çözmez. Eğer issue yeni deploy'dan kaynaklıysa mantıklı, ama investigation eksik kalır."},
                    {"id":"c","text":"Load balancer'dan problematic instance'ları çıkarıp scale up yapma","feedback":"Pragmatik immediate action ama underlying problem persist edebilir. Temporary fix, permanent solution değil."},
                    {"id":"d","text":"Database cache'ini clear edip application server'ları restart etme","feedback":"Risky approach. Data loss riski var ve root cause analysis yapmadan shotgun debugging yaklaşımı. Professional ortamda önerilmez."}
                ]
            },
            "message": "Yazılım Mühendisliği'ne özel simülasyon oluşturuldu"
        })
        
    else:
        # Standard simulation
        return jsonify({
            "success": True,
            "data": {
                "title": f"{degree.title()} - Profesyonel Gelişim Simülasyonu",
                "company": "MultiFlex Corp.",
                "role": f"{'Senior' if experience_level == 'senior' else 'Junior'} Specialist",
                "category": "Genel İş Deneyimi",
                "difficulty": "Orta",
                "context": f"{university} {degree} mezunu {first_name} olarak, çok disiplinli bir şirkette uzmanlık alanınızda projeler yürütüyorsunuz.",
                "daily_schedule": [
                    {
                        "time": "09:00",
                        "task": "Ekip Koordinasyonu",
                        "description": "Günlük hedefler ve proje durumu değerlendirmesi",
                        "department": "Proje Yönetimi",
                        "priority": "Yüksek",
                        "duration_min": 45,
                        "team_size": 6,
                        "tools": ["Teams", "Project Management Tool"]
                    },
                    {
                        "time": "10:00",
                        "task": "Analiz ve Araştırma",
                        "description": "Alan uzmanlığınız kapsamında detaylı inceleme",
                        "department": "Araştırma",
                        "priority": "Yüksek",
                        "duration_min": 120,
                        "team_size": 1,
                        "tools": ["Excel", "Analiz Araçları"]
                    },
                    {
                        "time": "14:00",
                        "task": "Rapor Hazırlama",
                        "description": "Bulgularınızı dokumentasyona dökme",
                        "department": "Dokümantasyon",
                        "priority": "Orta",
                        "duration_min": 90,
                        "team_size": 1,
                        "tools": ["Word", "PowerPoint"]
                    }
                ],
                "emails": [
                    {"from": "manager@multiflex.com", "subject": "Proje Güncelleme Talebi", "summary": "İlerleme raporu ve önümüzdeki adımlar"}
                ],
                "meetings": [
                    {"time": "09:00", "participants": ["Proje Ekibi"], "topic": "Günlük Değerlendirme", "summary": "Hedefler ve sorunlar"}
                ],
                "situation": "Projenizde beklenmedik bir zorlukla karşılaştınız ve alternatif yaklaşımlar değerlendirmeniz gerekiyor.",
                "question": "Bu durumda nasıl hareket edersiniz?",
                "options": [
                    {"id":"a","text":"Sistematik analiz yapıp alternatif çözümler geliştirmek","feedback":"Methodical approach, sürdürülebilir sonuçlar verir"},
                    {"id":"b","text":"Ekiple brainstorm yapıp yaratıcı çözümler bulmak","feedback":"Collaborative approach, iyi fikirler çıkabilir"},
                    {"id":"c","text":"Benzer projelerden referans alıp adapte etmek","feedback":"Practical approach ama unique challenge'ları kaçırabilir"},
                    {"id":"d","text":"Hızlı karar verip deneme yanılma ile ilerlemek","feedback":"Risky approach, resources waste edebilir"}
                ]
            },
            "message": f"{degree} alanına uygun genel simülasyon oluşturuldu"
        })

def generate_default_simulation():
    """Dinamik varsayılan simülasyon - localStorage'dan kullanıcı bilgilerini al"""
    
    import random
    
    scenarios = [
        {
            "title": "Frontend Developer - React Projesi",
            "company": "TechStart A.Ş.",
            "role": "Junior Frontend Developer", 
            "category": "Yazılım Geliştirme",
            "difficulty": "Orta",
            "context": "Startup teknoloji şirketinde frontend developer olarak çalışıyorsunuz. 8 kişilik geliştirme ekibinde React ve TypeScript kullanıyorsunuz.",
            "daily_schedule": [
                {
                    "time": "09:00",
                    "task": "Daily Standup Toplantısı", 
                    "description": "Ekip ile günlük planlama",
                    "department": "Geliştirme",
                    "priority": "Yüksek",
                    "duration_min": 30,
                    "team_size": 8,
                    "tools": ["Slack", "Jira"]
                },
                {
                    "time": "09:30", 
                    "task": "Component Geliştirme",
                    "description": "Yeni kullanıcı arayüzü componentleri",
                    "department": "Frontend",
                    "priority": "Yüksek", 
                    "duration_min": 120,
                    "team_size": 1,
                    "tools": ["VS Code", "React", "TypeScript"]
                },
                {
                    "time": "12:00",
                    "task": "Code Review",
                    "description": "Ekip arkadaşlarının kodlarını inceleme",
                    "department": "Geliştirme",
                    "priority": "Orta",
                    "duration_min": 60,
                    "team_size": 3,
                    "tools": ["GitHub", "Pull Requests"]
                },
                {
                    "time": "14:00",
                    "task": "Bug Fix",
                    "description": "Müşteri raporlarından gelen hataları düzeltme",
                    "department": "Geliştirme", 
                    "priority": "Kritik",
                    "duration_min": 90,
                    "team_size": 1,
                    "tools": ["DevTools", "GitHub"]
                },
                {
                    "time": "16:00",
                    "task": "API Entegrasyonu",
                    "description": "Backend API'leri ile frontend bağlantısı",
                    "department": "Full Stack",
                    "priority": "Yüksek",
                    "duration_min": 90,
                    "team_size": 2,
                    "tools": ["Postman", "Axios", "Redux"]
                }
            ],
            "situation": "Müşteri acil bir feature değişikliği istedi ve deadline yaklaşıyor.",
            "question": "Bu durumda nasıl hareket edersiniz?",
            "options": [
                {"id":"a","text":"Hızlı geliştirip sonra refactor yapmak","feedback":"Hızlı çözüm ama teknik borç oluşturur","score":3},
                {"id":"b","text":"Temiz kod yazmaya odaklanmak","feedback":"Kaliteli ama deadline riski var","score":4},
                {"id":"c","text":"Ekip ile scope'u yeniden değerlendirmek","feedback":"Mantıklı yaklaşım, beklentileri yönetir","score":5},
                {"id":"d","text":"Ekstra mesai yapıp her şeyi tamamlamak","feedback":"Burnout riski, sürdürülebilir değil","score":2}
            ]
        },
        {
            "title": "Endüstri Mühendisi - Üretim Planlama", 
            "company": "ManufactureTech A.Ş.",
            "role": "Junior Endüstri Mühendisi",
            "category": "Üretim & Süreç Optimizasyonu", 
            "difficulty": "Orta",
            "context": "Orta ölçekli üretim şirketinde endüstri mühendisi olarak çalışıyorsunuz. Otomotiv yan sanayi alanında faaliyet gösteriyor.",
            "daily_schedule": [
                {
                    "time": "08:30",
                    "task": "Üretim Raporu İncelemesi",
                    "description": "Günlük üretim verilerini analiz etme",
                    "department": "Üretim Planlama", 
                    "priority": "Yüksek",
                    "duration_min": 30,
                    "team_size": 1,
                    "tools": ["Excel", "SAP"]
                },
                {
                    "time": "09:00",
                    "task": "Süreç İyileştirme Toplantısı",
                    "description": "Haftalık verimlilik değerlendirmesi",
                    "department": "Mühendislik",
                    "priority": "Yüksek", 
                    "duration_min": 60,
                    "team_size": 6,
                    "tools": ["Teams", "PowerPoint"]
                },
                {
                    "time": "11:00",
                    "task": "Fabrika Hat Analizi",
                    "description": "Üretim hattında zaman etüdü yapma",
                    "department": "Üretim",
                    "priority": "Yüksek",
                    "duration_min": 120,
                    "team_size": 2,
                    "tools": ["Kronometre", "Analiz Formu"]
                },
                {
                    "time": "14:00",
                    "task": "Kalite Kontrol İncelemesi", 
                    "description": "Hata oranlarını azaltma stratejileri",
                    "department": "Kalite",
                    "priority": "Yüksek",
                    "duration_min": 90,
                    "team_size": 3,
                    "tools": ["Minitab", "Kalite Formları"]
                },
                {
                    "time": "16:00",
                    "task": "Envanter Optimizasyonu",
                    "description": "Stok seviyelerini optimize etme",
                    "department": "Lojistik",
                    "priority": "Orta",
                    "duration_min": 60,
                    "team_size": 2,
                    "tools": ["SAP", "Excel"]
                }
            ],
            "situation": "Üretim hattında beklenmedik verimlilik düşüşü tespit edildi.",
            "question": "İlk olarak ne yaparsınız?",
            "options": [
                {"id":"a","text":"Detaylı kök neden analizi yapmak","feedback":"Sistematik yaklaşım, sürdürülebilir çözüm","score":5},
                {"id":"b","text":"Hemen ekipman değiştirmek","feedback":"Pahalı ve aceleye gelmiş karar","score":2},
                {"id":"c","text":"Operatörlerle konuşmak","feedback":"İyi başlangıç ama veri eksik","score":3},
                {"id":"d","text":"Geçmiş verileri incelemek","feedback":"Faydalı ama anında aksiyon eksik","score":4}
            ]
        },
        {
            "title": "Pazarlama Uzmanı - Dijital Kampanya",
            "company": "BrandForce Ajans",
            "role": "Junior Pazarlama Uzmanı",
            "category": "Pazarlama & Satış",
            "difficulty": "Orta", 
            "context": "Dijital pazarlama ajansında çalışıyorsunuz. Müşterilerin online görünürlüğünü artırmak için kampanyalar yönetiyorsunuz.",
            "daily_schedule": [
                {
                    "time": "09:00",
                    "task": "Kampanya Performans Analizi",
                    "description": "Önceki günün reklam verilerini inceleme",
                    "department": "Pazarlama",
                    "priority": "Yüksek",
                    "duration_min": 45,
                    "team_size": 1,
                    "tools": ["Google Analytics", "Facebook Ads Manager"]
                },
                {
                    "time": "10:00",
                    "task": "Müşteri Brifingi",
                    "description": "Yeni proje için müşteriyle görüşme",
                    "department": "Account Management",
                    "priority": "Kritik",
                    "duration_min": 60,
                    "team_size": 4,
                    "tools": ["Zoom", "Presentation"]
                },
                {
                    "time": "11:30",
                    "task": "Kreatif Çalışma",
                    "description": "Sosyal medya içeriklerini hazırlama",
                    "department": "Kreatif",
                    "priority": "Yüksek",
                    "duration_min": 90,
                    "team_size": 2,
                    "tools": ["Canva", "Photoshop"]
                },
                {
                    "time": "14:00",
                    "task": "A/B Test Kurulumu",
                    "description": "Farklı reklam varyasyonlarını test etme",
                    "department": "Performance",
                    "priority": "Orta",
                    "duration_min": 75,
                    "team_size": 1,
                    "tools": ["Google Ads", "Facebook Business"]
                },
                {
                    "time": "16:00",
                    "task": "Rapor Hazırlama",
                    "description": "Müşteriye sunulacak aylık rapor",
                    "department": "Pazarlama",
                    "priority": "Yüksek", 
                    "duration_min": 90,
                    "team_size": 1,
                    "tools": ["Excel", "PowerPoint", "Data Studio"]
                }
            ],
            "situation": "Müşterinin kampanya bütçesi yarı yarıya azaltıldı ama hedefler aynı kaldı.",
            "question": "Bu durumda stratejiyi nasıl ayarlarsınız?",
            "options": [
                {"id":"a","text":"Hedefleri yeniden müzakere etmek","feedback":"Gerçekçi yaklaşım, sürdürülebilir","score":5},
                {"id":"b","text":"Daha ucuz kanallara odaklanmak","feedback":"Mantıklı ama kalite riski var","score":4},
                {"id":"c","text":"Aynı hedeflerle devam etmek","feedback":"İmkansız, müşteriyi hayal kırıklığına uğratır","score":1},
                {"id":"d","text":"Organik stratejilere yönelmek","feedback":"Uzun vadeli iyi ama anında sonuç beklenirse risk","score":3}
            ]
        }
    ]
    
    selected_scenario = random.choice(scenarios)
    
    selected_scenario["emails"] = [
        {"from": "manager@company.com", "subject": "Günlük Hedefler", "summary": "Bugünkü öncelikli görevler"},
        {"from": "team@company.com", "subject": "Proje Güncellemesi", "summary": "Ekip çalışması durumu"}
    ]
    
    selected_scenario["meetings"] = [
        {"time": "09:00", "participants": ["Takım Lideri", "Ekip"], "topic": "Günlük Planlama", "summary": "Günün hedefleri"},
        {"time": "15:00", "participants": ["Müdür"], "topic": "İlerleme Değerlendirmesi", "summary": "Haftalık durum raporu"}
    ]
    
    return jsonify({
        "success": True,
        "data": selected_scenario,
        "message": f"Dinamik simülasyon: {selected_scenario['category']}"
    })

#   Get real jobs with AI
@app.route("/api/jobs", methods=["GET"])
def get_real_jobs_with_ai():
    try:
        print("DEBUG API params →", request.args)
        print("DEBUG RAW URL →", request.url)

        title = request.args.get("title")
        location = request.args.get("location")

        print(f"📌 İş arama: {title} - {location}")

        # 1️⃣ SerpAPI ile iş ilanlarını ara
        serp_url = "https://serpapi.com/search"
        params = {
            "engine": "google",
            "q": f'"{title}" job opening {location} site:kariyer.net OR site:secretcv.com OR site:yenibiris.com OR site:indeed.com OR site:glassdoor.com OR site:linkedin.com/jobs',
            "num": 25,
            "api_key": SERPAPI_KEY
        }

        resp = requests.get(serp_url, params=params, timeout=10)
        data = resp.json()
        job_links = []

        if "organic_results" in data:
            for result in data.get("organic_results", [])[:8]:
                link = result.get("link", "")
                title_text = result.get("title", "").lower()
                bad_keywords = ["search", "jobs", "listing", "browse", "filter"]
                if link and not any(bad in link.lower() for bad in bad_keywords):
                    if any(site in link for site in [
                        "kariyer.net", 
                        "secretcv.com", 
                        "yenibiris.com", 
                        "indeed.com", 
                        "glassdoor.com", 
                        "linkedin.com/jobs"
                    ]):
                        job_links.append({
                            "url": link,
                            "title": result.get("title", ""),
                            "snippet": result.get("snippet", "")
                        })

        if not job_links:
            print("❌ Tek iş ilanı linki bulunamadı, geniş arama yapılıyor...")
            params["q"] = f'"{title}" {location} site:kariyer.net OR site:secretcv.com'
            resp = requests.get(serp_url, params=params, timeout=10)
            data = resp.json()
            for result in data.get("organic_results", [])[:6]:
                link = result.get("link", "")
                if link:
                    job_links.append({
                        "url": link,
                        "title": result.get("title", ""),
                        "snippet": result.get("snippet", "")
                    })

        if not job_links:
            return jsonify({"success": False, "message": "İş ilanı linki bulunamadı", "jobs": []}), 200

        print(f"📌 Bulunan linkler:")
        for i, link in enumerate(job_links):
            print(f"  {i+1}. {link['url']}")

        # Scraping 
        job_data_for_ai = []
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

        for job_link in job_links:
            try:
                print(f"📌 Hızlı scraping: {job_link['url']}")
                response = requests.get(job_link['url'], headers=headers, timeout=8)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, "html.parser")
                    title_tag = soup.find('title')
                    headings = soup.find_all(['h1', 'h2', 'h3'])
                    body = soup.find('body')
                    job_data_for_ai.append({
                        "url": job_link['url'],
                        "title_tag": title_tag.get_text() if title_tag else "",
                        "headings": " ".join([h.get_text() for h in headings]),
                        "body_snippet": body.get_text()[:1000] if body else "",
                        "search_title": job_link['title'],
                        "search_snippet": job_link['snippet']
                    })
                    print("   ✅ Sayfa bilgileri alındı")
                else:
                    raise Exception("HTTP başarısız")
            except Exception:
                job_data_for_ai.append({
                    "url": job_link['url'],
                    "title_tag": "",
                    "headings": "",
                    "body_snippet": "",
                    "search_title": job_link['title'],
                    "search_snippet": job_link['snippet']
                })
                print("   ⚠️ Scraping başarısız, snippet kullanılacak")
            time.sleep(1)

       
        prompt = f"""
Aşağıdaki verilerden "{title}" pozisyonu için iş ilanı detaylarını çıkar.
Kurallar:
- **"not specified", "belirtilmemiş", "unknown", "n/a" gibi ifadeleri ASLA kullanma.** Bunları yazarsan cevap geçersiz sayılır.
- Eksik veya yarım bırakma. Her alanı dikkatli incele ve doldur.
- Şirket adını, konumu ve pozisyon adını mutlaka belirt. Bu bilgiler eksikse ilgili alanı tahmine dayalı olarak doldur ama "not specified" yazma.
- Requirements kısmında ilanın açıklamasını inceleyerek **anahtar becerileri ve teknolojileri** listele. En az 6 tane özgün ve alakalı tek kelimelik beceri yaz. Genel terimler ya da "not specified" yazma.
- Eğer ilanda açıkça "başvuru kapandı", "ilan süresi doldu", "yayından kaldırıldı" gibi ifadeler varsa bu ilanı tamamen atla.

Veri:
{json.dumps(job_data_for_ai, ensure_ascii=False, indent=2)}

JSON yanıt formatı (dikkatlice doldur):

{{
  "jobs": [
    {{
      "title": "Pozisyon adı – kesinlikle doldur, tahmin etmen gerekiyorsa et",
      "company": {{
        "name": "Şirket adı – mutlaka yaz, 'not specified' yazma"
      }},
      "description": "İş açıklaması (en az 50 karakter)",
      "url": "İlan linki",
      "requirements": [
        "Python", "Django", "AWS", "CI/CD", "SQL", "Linux"
      ],  # En az 6–8 beceri, açıklamadan çıkar
      "location_city": "{location}",
      "salary_range": "Bilgi yoksa boş bırak",
      "experience_level": "Bilgi yoksa boş bırak"
    }}
  ]
}}
"""

        gemini_payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.3, "maxOutputTokens": 2048}
        }
        ai_response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json=gemini_payload,
            timeout=20
        )

        if ai_response.status_code != 200:
            return jsonify({"success": False, "message": "AI analizi başarısız", "jobs": []}), 500

        result = ai_response.json()
        ai_text = result['candidates'][0]['content']['parts'][0]['text']
        print(f"📌 AI yanıtı (ilk 300): {ai_text[:300]}...")

        import re
        json_match = re.search(r'(\{(?:.|\n)*\})', ai_text)
        if not json_match:
            return jsonify({"success": False, "message": "AI yanıtı parse edilemedi", "jobs": []}), 500

        try:
            ai_data = json.loads(json_match.group(1))
            jobs = ai_data.get("jobs", [])

            final_jobs = []
            for job in jobs:
                if job.get("title") and job.get("url"):
                    if not job.get("company", {}).get("name"):
                        job["company"] = {"name": "Unknown Company"}
                    if not job.get("requirements"):
                        job["requirements"] = ["Not specified"]
                    final_jobs.append(job)

            print(f"✅ İş ilanları oluşturuldu: {len(final_jobs)} ilan")
            return jsonify({
                "success": True,
                "jobs": final_jobs,
                "message": f"{len(final_jobs)} iş ilanı bulundu"
            })
        except json.JSONDecodeError as e:
            print(f"❌ JSON parse hatası: {e}")
            return jsonify({"success": False, "message": "AI yanıtı geçersiz", "jobs": []}), 500

    except Exception as e:
        import traceback
        print("❌ FULL TRACEBACK:\n", traceback.format_exc())
        return jsonify({"success": False, "message": f"Python hata: {str(e)}", "jobs": []}), 500

@app.route("/api/missing_skills", methods=["POST"])
def save_missing_skills():
    try:
        data = request.json
        user_id = data.get("user_id")
        skill = data.get("skill")

        if not user_id or not skill:
            return jsonify({"success": False, "message": "Eksik parametre"}), 400

        headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "user_id": user_id,
            "skill": skill
        }

        response = requests.post(
            f"{SUPABASE_API_URL}/rest/v1/missing_skills",
            headers=headers,
            json=payload
        )

        if response.status_code in [200, 201]:
            return jsonify({"success": True, "message": "Eksik bilgi kaydedildi"}), 200
        else:
            return jsonify({"success": False, "message": response.text}), 400

    except Exception as e:
        print("Eksik beceri kaydetme hatası:", e)
        return jsonify({"success": False, "message": str(e)}), 500
    
@app.route("/api/missing_skills/<user_id>", methods=["GET"])
def get_missing_skills(user_id):
    try:
        headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}"
        }
        url = f"{SUPABASE_API_URL}/rest/v1/missing_skills?user_id=eq.{user_id}"

        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            skills = response.json()
            return jsonify({"success": True, "data": skills}), 200
        else:
            return jsonify({"success": False, "message": "Eksik beceri bulunamadı"}), 404

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route("/update-skills/<user_id>", methods=["PUT"])
def update_skills(user_id):
    try:
        data = request.json
        new_skills = data.get("skills", [])

        if not isinstance(new_skills, list):
            return jsonify({"success": False, "message": "Skills bir liste olmalı"}), 400

        headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}",
            "Content-Type": "application/json"
        }

        response = requests.patch(
            f"{SUPABASE_API_URL}/rest/v1/profiles?id=eq.{user_id}",
            headers=headers,
            json={"skills": new_skills}
        )

        if response.status_code in [200, 204]:
            return jsonify({"success": True, "message": "Beceriler güncellendi"}), 200
        else:
            return jsonify({"success": False, "message": response.text}), 400

    except Exception as e:
        print("update_skills hatası:", e)
        return jsonify({"success": False, "message": str(e)}), 500

# Skill Level Endpoints
@app.route("/api/save-skill-level", methods=["POST"])
def save_skill_level():
    try:
        data = request.json
        user_id = data.get("user_id")
        skill = data.get("skill")
        level = data.get("level")

        if not user_id or not skill or level is None:
            return jsonify({"success": False, "message": "Eksik parametre"}), 400

        headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }

        delete_url = f"{SUPABASE_API_URL}/rest/v1/skill_levels?user_id=eq.{user_id}&skill=eq.{skill}"
        requests.delete(delete_url, headers=headers)

        payload = {
            "user_id": user_id,
            "skill": skill,
            "level": int(level),
            "updated_at": "now()"
        }

        response = requests.post(
            f"{SUPABASE_API_URL}/rest/v1/skill_levels",
            headers=headers,
            json=payload
        )

        if response.status_code in [200, 201]:
            return jsonify({"success": True, "message": "Beceri seviyesi kaydedildi"}), 200
        else:
            return jsonify({"success": False, "message": response.text}), 400

    except Exception as e:
        print("Skill level save error:", e)
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/get-skill-levels/<user_id>", methods=["GET"])
def get_skill_levels(user_id):
    try:
        headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}"
        }

        url = f"{SUPABASE_API_URL}/rest/v1/skill_levels?user_id=eq.{user_id}"
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            levels = response.json()
            return jsonify({"success": True, "data": levels}), 200
        else:
            return jsonify({"success": False, "message": "Beceri seviyesi bulunamadı"}), 404

    except Exception as e:
        print("Skill levels fetch error:", e)
        return jsonify({"success": False, "message": str(e)}), 500

@app.route("/generate-industry-insights/<user_id>", methods=["GET"])
def generate_industry_insights(user_id):
    try:
        headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}"
        }

        profile_resp = requests.get(
            f"{SUPABASE_API_URL}/rest/v1/profiles?id=eq.{user_id}",
            headers=headers
        )
        profile_data = profile_resp.json()

        if not profile_data:
            profile_resp = requests.get(
                f"{SUPABASE_API_URL}/rest/v1/profiles?user_id=eq.{user_id}",
                headers=headers
            )
            profile_data = profile_resp.json()

        if not profile_data:
            return jsonify({"success": False, "message": "Profil bulunamadı"}), 404

        user_data = profile_data[0]
        job_title = user_data.get("current_title", "bilinmeyen meslek")

        payload = {
            "contents": [{
                "parts": [{
                    "text": f"Kariyer analizi yap. Meslek: {job_title}. "
                            f"2025 sektörel trendleri, popüler beceriler, "
                            f"gelecek 3 yıl öngörüleri ve önerilen gelişim alanlarını "
                            f"3 maddelik kısa bir liste halinde yaz."
                }]
            }]
        }

        gemini_resp = requests.post(
            GEMINI_API_URL,
            headers={"Content-Type": "application/json"},
            params={"key": GEMINI_API_KEY},
            json=payload
        )

        if gemini_resp.status_code != 200:
            return jsonify({"success": False, "message": "Gemini API hatası"}), 500

        llm_output = gemini_resp.json()
        insights = llm_output.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")

        return jsonify({"success": True, "insights": insights})

    except Exception as e:
        print("LLM sektör içgörü hatası:", e)
        return jsonify({"success": False, "message": str(e)}), 500


# Enhanced learning module generator
@app.route("/generate-learning-module", methods=["POST"])
def generate_learning_module():
    try:
        data = request.json
        topic = data.get("topic", "")
        if not topic:
            return jsonify({"success": False, "message": "Eksik konu"}), 400

        prompt = f"""
        Sen bir uzman eğitmensin. Konu: {topic}
        
        Kullanıcı için detaylı, interaktif ve profesyonel bir eğitim modülü oluştur.
        
        GEREKSINIMLER:
        - En az 3-5 adımdan oluşsun
        - Her adımda praktik örnek ve alıştırma olsun
        - Kod örnekleri varsa syntax highlighting için uygun formatta ver
        - İnteraktif sorular sorun
        - Final testi ekle (3-5 soru)
        
        JSON formatında döndür:
        {{
          "title": "{topic} Uzmanlığı Eğitimi",
          "description": "Bu modülde {topic} konusunda uzmanlaşacaksınız",
          "steps": [
            {{
              "step": 1,
              "title": "Temel Kavramlar ve Giriş",
              "content": "Detaylı anlatım... (HTML formatında, <h4>, <p>, <strong> etiketleri kullanılabilir)",
              "examples": ["Gerçek dünyadan örnek 1", "Pratik örnek 2"],
              "interactive_question": "Kullanıcıya sorulacak düşünmeye sevk eden soru",
              "code_example": "// Kod örneği varsa\\nconsole.log('Merhaba Dünya');"
            }},
            {{
              "step": 2,
              "title": "Uygulamalı Örnekler",
              "content": "İleri seviye konular ve pratik uygulamalar",
              "challenge": "Kullanıcıdan yapılması istenen kodlama görevi veya pratik",
              "code_example": "Daha karmaşık kod örnekleri"
            }},
            {{
              "step": 3,
              "title": "İleri Teknikler ve Best Practices",
              "content": "Profesyonel seviye bilgiler",
              "examples": ["Industry standard örnekleri"],
              "interactive_question": "Derinlemesine düşünme sorusu"
            }}
          ],
          "final_quiz": [
            {{"q": "Bu konuda önemli olan nedir?", "a": ["Seçenek A", "Seçenek B", "Seçenek C"], "correct": "Seçenek B"}},
            {{"q": "Hangi yaklaşım daha iyidir?", "a": ["Yaklaşım 1", "Yaklaşım 2"], "correct": "Yaklaşım 1"}},
            {{"q": "Best practice nedir?", "a": ["A yöntemi", "B yöntemi", "C yöntemi"], "correct": "A yöntemi"}}
          ]
        }}
        
        KURAL: Cevapları MUTLAKA gerçekçi ve doğru yap, rastgele seçme!
        """

        gemini_payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 4000
            }
        }

        response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json=gemini_payload,
            timeout=30
        )

        if response.status_code != 200:
            return jsonify({"success": False, "message": "AI yanıt hatası"}), 500

        ai_text = response.json()['candidates'][0]['content']['parts'][0]['text']
        
        import re
        json_match = re.search(r'\{.*\}', ai_text, re.DOTALL)
        if not json_match:
            return jsonify({"success": False, "message": "JSON formatı bulunamadı"}), 500

        module_data = json.loads(json_match.group(0))
        return jsonify({"success": True, "data": module_data})

    except Exception as e:
        print("generate_learning_module hatası:", traceback.format_exc())
        return jsonify({
            "success": False,
            "message": f"Server hatası: {str(e)}"
        }), 500


import re, json, traceback

@app.route("/evaluate-answer", methods=["POST"])
def evaluate_answer():
    try:
        data = request.json
        question = data.get("question")
        answer = data.get("answer")
        topic = data.get("topic")

        if not all([question, answer, topic]):
            return jsonify({"success": False, "message": "Eksik parametreler"}), 400

        prompt = f"""
        Konu: {topic}
        Soru: {question}
        Öğrenci Cevabı: {answer}

        Bu cevabı değerlendir. 
        Sadece aşağıdaki formatta geçerli bir JSON döndür, başka hiçbir şey yazma:
        {{
          "correct": true/false,
          "feedback": "Detaylı ve yapıcı geri bildirim",
          "score": 0-10
        }}
        """

        gemini_payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 500
            }
        }

        response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json=gemini_payload,
            timeout=30
        )

        if response.status_code != 200:
            return jsonify({"success": False, "message": "AI değerlendirme hatası"}), response.status_code

        ai_text = response.json()['candidates'][0]['content']['parts'][0]['text']
        clean_text = re.sub(r'```(json)?', '', ai_text).strip()
        json_match = re.search(r'\{.*\}', clean_text, re.DOTALL)

        if not json_match:
            return jsonify({"success": False, "message": "Değerlendirme formatı bulunamadı"}), 500

        try:
            evaluation_data = json.loads(json_match.group(0))
        except json.JSONDecodeError as e:
            return jsonify({"success": False, "message": f"JSON parse hatası: {str(e)}"}), 500

        return jsonify({"success": True, "data": evaluation_data})

    except Exception as e:
        print("evaluate_answer hatası:", traceback.format_exc())
        return jsonify({
            "success": False,
            "message": f"Server hatası: {str(e)}"
        }), 500

# Challenge evaluation endpoint  
@app.route("/evaluate-challenge", methods=["POST"])
def evaluate_challenge():
    try:
        data = request.json
        challenge = data.get("challenge")
        solution = data.get("solution")
        topic = data.get("topic")

        if not all([challenge, solution, topic]):
            return jsonify({"success": False, "message": "Eksik parametreler"}), 400

        prompt = f"""
        Konu: {topic}
        Görev: {challenge}
        Öğrenci Çözümü: {solution}
        
        Bu çözümü incele ve detaylı geri bildirim ver.
        
        JSON formatında döndür:
        {{
          "score": 1-10 arası puan,
          "review": "Detaylı inceleme ve değerlendirme",
          "suggestions": "İyileştirme önerileri"
        }}
        """

        gemini_payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 1500
            }
        }

        response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json=gemini_payload,
            timeout=30
        )

        if response.status_code != 200:
            return jsonify({"success": False, "message": "AI inceleme hatası"}), 500

        ai_text = response.json()['candidates'][0]['content']['parts'][0]['text']
        
        import re
        json_match = re.search(r'\{.*\}', ai_text, re.DOTALL)
        if not json_match:
            return jsonify({"success": False, "message": "İnceleme formatı bulunamadı"}), 500

        review_data = json.loads(json_match.group(0))
        return jsonify({"success": True, "data": review_data})
        
    except Exception as e:
        print("evaluate_challenge hatası:", traceback.format_exc())
        return jsonify({
            "success": False,
            "message": f"Server hatası: {str(e)}"
        }), 500


# Complete skill endpoint
@app.route("/api/complete-skill", methods=["POST"])
def complete_skill():
    try:
        data = request.json
        user_id = data.get("user_id")
        skill = data.get("skill")
        score = data.get("score", 100)
        
        if not all([user_id, skill]):
            return jsonify({"success": False, "message": "User ID ve skill gerekli"}), 400
        
        headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        
        delete_response = requests.delete(
            f"{SUPABASE_API_URL}/rest/v1/missing_skills?user_id=eq.{user_id}&skill=eq.{skill}",
            headers=headers
        )
        
        if delete_response.status_code not in [200, 204]:
            print("Missing skill silme hatası:", delete_response.text)
        
        
        from datetime import datetime
        completed_skill_data = {
            "user_id": user_id,
            "skill": skill,
            "score": score,
            "completed_at": datetime.now().isoformat()
        }
        
        insert_response = requests.post(
            f"{SUPABASE_API_URL}/rest/v1/completed_skills",
            headers=headers,
            json=completed_skill_data
        )
        
        if insert_response.status_code not in [200, 201]:
            return jsonify({
                "success": False, 
                "message": f"Tamamlanan skill ekleme hatası: {insert_response.text}"
            }), 500
        
        return jsonify({
            "success": True,
            "message": "Skill başarıyla tamamlandı",
            "data": insert_response.json()
        })
        
    except Exception as e:
        print("complete_skill hatası:", traceback.format_exc())
        return jsonify({
            "success": False,
            "message": f"Server hatası: {str(e)}"
        }), 500


@app.route("/api/personality-analysis", methods=["POST"])
def personality_analysis():
    """LLM ile detaylı kişilik analizi yapma"""
    try:
        data = request.json
        user_context = data.get('user_context', {})
        analysis_type = data.get('analysis_type', 'basic')
        
        # Kullanıcı bilgilerini topla
        personality_type = user_context.get('personalityType', 'Belirtilmemiş')
        responses = user_context.get('responses', {})
        skills = user_context.get('skills', [])
        experiences = user_context.get('experiences', [])
        current_title = user_context.get('currentTitle', '')
        location = user_context.get('location', '')
        first_name = user_context.get('firstName', 'Kullanıcı')
        
        # LLM için detaylı prompt hazırla
        analysis_prompt = f"""
Kişilik Analizi Uzmanı olarak, aşağıdaki kullanıcının detaylı kişilik analizi raporu hazırla:

KULLANICI BİLGİLERİ:
- İsim: {first_name}
- Kişilik Tipi: {personality_type}
- Mevcut Pozisyon: {current_title}
- Lokasyon: {location}
- Beceriler: {', '.join(skills) if skills else 'Belirtilmemiş'}
- İş Deneyimleri: {len(experiences)} adet deneyim

KIŞILIK TESTİ YANITLARI:
{json.dumps(responses, ensure_ascii=False, indent=2)}

Lütfen aşağıdaki formatta JSON yanıtı ver:

{{
    "personality_overview": "Kişilik tipinin genel açıklaması ve bu kullanıcıya özgü yorumlar",
    "personality_traits": [
        {{
            "name": "Özellik Adı",
            "score": 85,
            "description": "Bu özelliğin kullanıcıdaki yansıması"
        }}
    ],
    "career_fit": {{
        "suitable_careers": ["Kariyer 1", "Kariyer 2", "Kariyer 3"],
        "explanation": "Neden bu kariyerler uygun olduğunun açıklaması"
    }},
    "strengths": [
        {{
            "title": "Güçlü Yön Başlığı",
            "description": "Detaylı açıklama"
        }}
    ],
    "development_areas": [
        {{
            "title": "Gelişim Alanı Başlığı", 
            "description": "Nasıl geliştirilebileceği"
        }}
    ],
    "recommendations": [
        {{
            "category": "Kariyer Gelişimi",
            "suggestion": "Önerinin açıklaması",
            "action_items": ["Yapılacak 1", "Yapılacak 2"]
        }}
    ]
}}

Analizi Türkçe yap ve kullanıcının mevcut durumunu dikkate alarak kişiselleştirilmiş öneriler sun.
"""

        print(f"🧠 {first_name} için kişilik analizi yapılıyor...")
        
        # Gemini API ile analiz yap
        gemini_payload = {
            "contents": [{
                "parts": [{
                    "text": analysis_prompt
                }]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 2048,
            }
        }
        
        response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json=gemini_payload
        )
        
        if response.status_code != 200:
            print("Gemini API hatası:", response.text)
            return jsonify({
                "success": False,
                "message": f"LLM analizi başarısız: {response.text}"
            }), 500
            
        result = response.json()
        print("✅ Gemini yanıtı alındı")
        
        # Gemini yanıtından metni çıkar
        if 'candidates' in result and len(result['candidates']) > 0:
            content = result['candidates'][0]['content']['parts'][0]['text']
            
            # JSON formatındaki yanıtı parse et
            try:
                # JSON kısmını bul ve parse et
                json_start = content.find('{')
                json_end = content.rfind('}') + 1
                
                if json_start != -1 and json_end > json_start:
                    json_content = content[json_start:json_end]
                    analysis_result = json.loads(json_content)
                    
                    print(f"📊 {first_name} için analiz tamamlandı")
                    return jsonify({
                        "success": True,
                        **analysis_result
                    })
                else:
                    raise ValueError("JSON formatı bulunamadı")
                    
            except (json.JSONDecodeError, ValueError) as e:
                print("JSON parse hatası:", e)
                print("Ham içerik:", content)
                
                # Fallback: Ham metni döndür
                return jsonify({
                    "success": True,
                    "personality_overview": content,
                    "personality_traits": [],
                    "career_fit": {"suitable_careers": [], "explanation": ""},
                    "strengths": [],
                    "development_areas": [],
                    "recommendations": []
                })
        else:
            return jsonify({
                "success": False,
                "message": "LLM'den geçerli yanıt alınamadı"
            }), 500
            
    except Exception as e:
        print("personality_analysis hatası:", traceback.format_exc())
        return jsonify({
            "success": False,
            "message": f"Server hatası: {str(e)}"
        }), 500


if __name__ == "__main__":
    print("🚀 KariyerAI Backend başlatılıyor...")
    print(f"📋 Supabase URL: {SUPABASE_API_URL if SUPABASE_API_URL else '❌ Tanımlanmadı'}")
    print(f"🤖 Gemini API: {'✅ Yapılandırıldı' if GEMINI_API_KEY else '❌ Yapılandırılmadı'}")
    app.run(debug=True, port=5000)

