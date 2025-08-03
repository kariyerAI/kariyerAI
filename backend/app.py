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

# Profil verisini Supabase'e kaydetmek için
@app.route("/save-profile", methods=["POST"])  
def save_profile():
    try:
        profile_data_raw = request.json
        print("Gelen profil verisi:", profile_data_raw)

        profile_data = {
            "first_name": profile_data_raw.get("firstName"),
            "last_name": profile_data_raw.get("lastName"),
            "email": profile_data_raw.get("email"),
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

        # 1️⃣ Profili kaydet
        response = requests.post(
            f"{SUPABASE_API_URL}/rest/v1/profiles",
            headers=headers,
            json=profile_data
        )

        if response.status_code not in [200, 201]:
            return jsonify({"success": False, "message": response.text}), 400

        data = response.json()
        user_id = data[0]["id"] if isinstance(data, list) else data.get("id")

        # 2️⃣ Skill levels tablosuna otomatik 50% ekle
        skills = profile_data_raw.get("skills", [])
        for skill in skills:
            skill_payload = {
                "user_id": user_id,
                "skill": skill,
                "level": 50
            }
            requests.post(
                f"{SUPABASE_API_URL}/rest/v1/skill_levels",
                headers=headers,
                json=skill_payload
            )

        return jsonify({
            "success": True,
            "message": "Profil başarıyla kaydedildi ve skill seviyeleri eklendi",
            "data": data
        })

    except Exception as e:
        print("save_profile hatası:", traceback.format_exc())
        return jsonify({
            "success": False,
            "message": f"Server hatası: {str(e)}"
        }), 500

# Kullanıcı profilini Supabase'den çekmek için
@app.route("/get-profile/<user_id>", methods=["GET"]) 
def get_profile(user_id):
    """Kullanıcı profilini Supabase'den çek"""
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
            data = response.json()
            return jsonify({
                "success": True,
                "data": data[0] if data else None
            })
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

# CV'yi Gemini AI ile analiz etmek için
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

# Servisin sağlık durumunu kontrol etmek için
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

# Kullanıcı profilinden detaylı kariyer simülasyonu senaryosu oluşturmak için
@app.route("/career-simulation/<uuid:user_id>", methods=["GET", "OPTIONS"])
def career_simulation(user_id):
    if request.method == "OPTIONS":
        return jsonify({"message": "CORS preflight OK"}), 200

    print("📌 [career_simulation] İstek alındı | user_id:", user_id)

    try:
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
            print("❌ Profil bulunamadı")
            return jsonify({"success": False, "message": "Profil bulunamadı"}), 404

        profile = profile_resp.json()[0]
        current_title = profile.get("current_title", "Bilinmeyen Pozisyon")
        skills = ", ".join(profile.get("skills", [])) or "Belirtilmemiş"
        print(f"📌 Profil verisi: title={current_title}, skills={skills}")

        prompt = f"""
        Sen bir kariyer simülasyonu üreticisisin. Amacın, kullanıcıya bir iş gününü
        mümkün olan en gerçekçi şekilde yaşatmaktır. 
        Kullanıcının mesleği: {current_title}
        Kullanıcının becerileri: {skills}

        Aşağıdaki kurallara göre detaylı bir JSON senaryosu üret:
        1. Günün başlangıcından (08:30) bitişine (18:00) kadar tüm olayları kapsa.
        2. En az 6-8 farklı görev yaz ve her birinin:
            - Kısa açıklaması
            - Önemi (Kritik, Yüksek, Orta, Düşük)
            - Departman ve ekip bilgisi (ekipte kaç kişi var, kimlerle çalışılıyor)
            - Kullanılan platform ve araçlar (ör: Jira, Slack, Zoom, GitHub, Figma, Postman, Outlook)
            - Tahmini süre (dakika)
        3. Gün içinde gelen ve gönderilmesi gereken e-postaları yaz (konu başlıkları ve içeriği kısa özetle).
        4. Gün boyunca yapılan toplantıları belirt (katılımcılar, konular, kararlar).
        5. Karar verilmesi gereken 1 ana kritik senaryo seç ve bunun için 3-4 seçenek ver:
            - id (a, b, c, d)
            - text (seçenek açıklaması)
            - feedback (detaylı geri bildirim, artı-eksi yönler)
            - score (0-5 arası puan)
        6. Olayları mümkün olduğunca gerçekçi ve detaylı yaz, iş hayatındaki küçük ayrıntıları da ekle
           (örneğin: kahve molası (bunu sadece dinlenmek için bir süre olarak tut simülasyon görevi gibi olmasın), Slack üzerinden acil mesaj, müşteri talebi değişiklik bildirimi vb.)
        7. Cevabı aşağıdaki JSON formatında ve sadece JSON olarak döndür:
        {{
          "title": "Simülasyon Başlığı",
          "category": "Teknik | Liderlik | Problem Çözme",
          "difficulty": "Kolay | Orta | Zor",
          "context": "Şirket, pozisyon, ekip bilgisi, genel ortam",
          "daily_schedule": [
            {{
              "time": "09:00",
              "task": "Kod incelemesi",
              "priority": "Yüksek",
              "department": "Backend",
              "team_size": 6,
              "tools": ["GitHub", "Slack"],
              "duration_min": 45
            }}
          ],
          "emails": [
            {{"from": "pm@company.com", "subject": "Feature Update", "summary": "Müşteri ek özellik istiyor."}}
          ],
          "meetings": [
            {{"time": "11:00", "participants": ["PM", "Lead Dev"], "topic": "Sprint Planning", "summary": "Görevlerin önceliklendirilmesi."}}
          ],
          "situation": "Günün kritik anı ve sorun açıklaması",
          "question": "Hangi strateji izlenmeli?",
          "options": [
            {{"id":"a","text":"Seçenek1","feedback":"Detaylı analiz","score":5}},
            {{"id":"b","text":"Seçenek2","feedback":"Riskli yönleri açıklanmış","score":2}}
          ]
        }}
        ❗ Çok önemli: Yanıtını yalnızca geçerli bir JSON olarak ver,
        JSON dışında hiçbir açıklama, not veya yazı ekleme.Yanıt çok uzunsa, JSON'u kesmeden tamamla.
        Cevabın geçerli bir JSON olmalı, eksik veya yarım bırakma.

        """

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

        # Sadece JSON kısmını yakala
        json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
        if not json_match:
            print("❌ Gemini yanıtında JSON bulunamadı")
            print("📌 Tam yanıt:", ai_response)
            return jsonify({"success": False, "message": "Gemini yanıtında JSON bulunamadı"}), 500

        cleaned = json_match.group(0)
        print("📌 Temizlenen JSON (ilk 300 karakter):", cleaned[:300])

        try:
            scenario = json.loads(cleaned)
        except Exception as e:
            print("❌ JSON parse hatası:", str(e))
            print("📌 Ham yanıt:", ai_response)
            return jsonify({"success": False, "message": "Gemini yanıtı geçersiz JSON"}), 500

        print("✅ Senaryo başarıyla oluşturuldu")
        return jsonify({"success": True, "data": scenario})

    except Exception as e:
        print("❌ career_simulation genel hata:", traceback.format_exc())
        return jsonify({"success": False, "message": f"Hata: {str(e)}"}), 500

# =====================================================
# İNTERAKTİF GÖREV SİSTEMLERİ
# =====================================================

# Görev simülasyonu oluşturma
@app.route("/task-simulation", methods=["POST"])
def task_simulation():
    """Bir görev için detaylı simülasyon oluştur"""
    try:
        data = request.json
        task = data.get('task', {})
        user = data.get('user', {})
        
        task_type = task.get('task', '').lower()
        current_title = user.get('current_title', 'Developer')
        
        # Görev tipine göre farklı simülasyon promptları
        if 'email' in task_type or 'mail' in task_type:
            prompt = f"""
            Kullanıcı {current_title} pozisyonunda ve "{task.get('task')}" görevini yapıyor.
            Bu görev için gerçekçi bir email simülasyonu oluştur.
            
            JSON formatında döndür:
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
            
            JSON formatında döndür:
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
            
            JSON formatında döndür:
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
            
            JSON formatında döndür:
            {{
                "type": "general",
                "scenario": "Görev senaryosu",
                "mini_event": "Bu görev sırasında yaşanabilecek bir olay",
                "challenge": "Karşılaşabilecek zorluk",
                "decision": {{
                    "question": "Karar sorusu",
                    "options": [
                        {{"id": "a", "text": "Seçenek 1", "score": 5}},
                        {{"id": "b", "text": "Seçenek 2", "score": 3}}
                    ]
                }},
                "resources": ["Kullanabileceği kaynaklar"],
                "tips": ["İpuçları"]
            }}
            """
        
        # Gemini API çağrısı
        gemini_payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.6, "maxOutputTokens": 2000}
        }
        
        response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json=gemini_payload
        )
        
        if response.status_code == 200:
            result = response.json()
            ai_response = result['candidates'][0]['content']['parts'][0]['text']
            
            # JSON parse et
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                simulation_data = json.loads(json_match.group(0))
                return jsonify({"success": True, "data": simulation_data})
        
        return jsonify({"success": False, "message": "Görev simülasyonu oluşturulamadı"}), 400
        
    except Exception as e:
        print(f"Task simulation error: {str(e)}")
        return jsonify({"success": False, "message": f"Hata: {str(e)}"}), 500

# Email simülasyon chat sistemi
@app.route("/email-chat", methods=["POST"])
def email_chat():
    """Email konversasyonu için LLM chat"""
    try:
        data = request.json
        user_message = data.get('message', '')
        chat_context = data.get('context', {})
        user_role = data.get('user_role', 'Employee')
        
        # LLM'e müşteri/iş ortağı rolünde davranmasını söyle
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

# Kod değerlendirme sistemi
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
            "score": 85,
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

# Görev tamamlama ve progress tracking
@app.route("/complete-task", methods=["POST"])
def complete_task():
    """Görev tamamlandığında skor ve ilerleme kaydet"""
    try:
        data = request.json
        user_id = data.get('user_id')
        task_id = data.get('task_id')
        score = data.get('score', 0)
        completion_data = data.get('completion_data', {})
        
        # Supabase'e görev tamamlama kaydı ekle
        task_completion = {
            "user_id": user_id,
            "task_id": task_id,
            "score": score,
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

# Gerçek zamanlı feedback ve ipuçları
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



# İş ilanlarını SerpAPI ile bulmak ve AI ile analiz etmek için KULLANILIYOR
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
            "num": 20,
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

        # 2️⃣ Scraping verileri topla
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

        # 3️⃣ AI analizi
        prompt = f"""
Aşağıdaki verilerden "{title}" pozisyonu için iş ilanı detaylarını çıkar.
Kurallar:
- **"not specified", "belirtilmemiş", "unknown", "n/a" gibi ifadeleri ASLA kullanma.** Bunları yazarsan cevap geçersiz sayılır.
- Eksik veya yarım bırakma. Her alanı dikkatli incele ve doldur.
- Şirket adını, konumu ve pozisyon adını mutlaka belirt. Bu bilgiler eksikse ilgili alanı tahmine dayalı olarak doldur ama "not specified" yazma.
- Requirements kısmında ilanın açıklamasını inceleyerek **anahtar becerileri ve teknolojileri** listele. En az 6–8 tane özgün ve alakalı beceri yaz. Genel terimler ya da "not specified" yazma.
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

        # 4️⃣ JSON parse (geliştirilmiş regex)
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

            # 5️⃣ Toleranslı filtreleme
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
        print(f"❌ Genel hata: {str(e)}")
        return jsonify({"success": False, "message": f"Hata: {str(e)}", "jobs": []}), 500
    
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

        # Profil tablosunda becerileri güncelle
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

# -----------------------------------
# SKILL LEVEL ENDPOINTLERİ
# -----------------------------------

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

        # 1️⃣ Aynı user_id + skill varsa önce sil (güncelleme gibi davranır)
        delete_url = f"{SUPABASE_API_URL}/rest/v1/skill_levels?user_id=eq.{user_id}&skill=eq.{skill}"
        requests.delete(delete_url, headers=headers)

        # 2️⃣ Yeni veriyi ekle
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

        # 1️⃣ Önce UUID (id) ile dene
        profile_resp = requests.get(
            f"{SUPABASE_API_URL}/rest/v1/profiles?id=eq.{user_id}",
            headers=headers
        )
        profile_data = profile_resp.json()

        # 2️⃣ Eğer bulunamadıysa user_id ile dene
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

        # Gemini çağrısı
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

# Mevcut get_missing_skills fonksiyonunuz zaten var, bu yüzden bu kısmı kaldırıyoruz


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
        
        # JSON'u çıkar
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
        
        # JSON'u çıkar
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
        
        # 1️⃣ missing_skills tablosundan sil
        delete_response = requests.delete(
            f"{SUPABASE_API_URL}/rest/v1/missing_skills?user_id=eq.{user_id}&skill=eq.{skill}",
            headers=headers
        )
        
        if delete_response.status_code not in [200, 204]:
            print("Missing skill silme hatası:", delete_response.text)
        
        # 2️⃣ completed_skills tablosuna ekle
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
    
# YEDEK KOD SİLME SU AN KULLANILMIYOR   
@app.route("/api/jobs3", methods=["GET"])
def get_real_jobs_with_ai3():
    try:
        print("DEBUG API params →", request.args)
        print("DEBUG RAW URL →", request.url)

        title = request.args.get("title")
        location = request.args.get("location")

        print(f"📌 İş arama: {title} - {location}")

        # 1️⃣ SerpAPI ile TEK İŞ İLANI linklerini bul
        serp_url = "https://serpapi.com/search"
        params = {
            "engine": "google",
            "q": f'"{title}" job opening {location} -"jobs" -"search" site:kariyer.net OR site:secretcv.com OR site:yenibiris.com OR site:indeed.com OR site:glassdoor.com OR site:linkedin.com/jobs',
            "num": 15,
            "api_key": SERPAPI_KEY
        }

        resp = requests.get(serp_url, params=params, timeout=10)
        data = resp.json()

        if "organic_results" not in data:
            return jsonify({"success": False, "message": "Arama sonucu bulunamadı", "jobs": []}), 200

        # 2️⃣ Tek iş ilanı linklerini filtrele (arama sayfası değil)
        job_links = []
        for result in data.get("organic_results", [])[:8]:
            link = result.get("link", "")
            title_text = result.get("title", "").lower()

            # Arama sayfalarını filtrele
            bad_keywords = ["search", "jobs", "listing", "browse", "filter"]

            if link and not any(bad in link.lower() for bad in bad_keywords):
                # Tek iş ilanı olma olasılığı yüksek
                if any(site in link for site in ["kariyer.net/is-ilani/", "secretcv.com/ilan/", "yenibiris.com/is-ilani/"]):
                    job_links.append({
                        "url": link,
                        "title": result.get("title", ""),
                        "snippet": result.get("snippet", "")
                    })

        if not job_links:
            print("❌ Tek iş ilanı linki bulunamadı, geniş arama yapılıyor...")
            # Fallback: Daha geniş arama
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
            print(f"     Title: {link['title'][:100]}...")
            print()

        # 3️⃣ Basit scraping + AI analizi
        job_data_for_ai = []

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }

        for job_link in job_links:
            try:
                print(f"📌 Hızlı scraping: {job_link['url']}")

                response = requests.get(job_link['url'], headers=headers, timeout=8)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, "html.parser")

                    # Sadece title ve h1, h2, h3 taglarını al (ana bilgiler)
                    title_tag = soup.find('title')
                    headings = soup.find_all(['h1', 'h2', 'h3'])

                    title_text = title_tag.get_text() if title_tag else ""
                    headings_text = " ".join([h.get_text() for h in headings])

                    # İlk 1000 karakter body text
                    body = soup.find('body')
                    body_text = body.get_text()[:1000] if body else ""

                    job_data_for_ai.append({
                        "url": job_link['url'],
                        "title_tag": title_text,
                        "headings": headings_text,
                        "body_snippet": body_text,
                        "search_title": job_link['title'],
                        "search_snippet": job_link['snippet']
                    })
                    print(f"   ✅ Sayfa bilgileri alındı")
                else:
                    # Scraping başarısızsa sadece search bilgilerini kullan
                    job_data_for_ai.append({
                        "url": job_link['url'],
                        "title_tag": "",
                        "headings": "",
                        "body_snippet": "",
                        "search_title": job_link['title'],
                        "search_snippet": job_link['snippet']
                    })
                    print(f"   ⚠️ Scraping başarısız, search bilgilerini kullanacak")

                time.sleep(1)

            except Exception as e:
                print(f"❌ Hata: {e}")
                continue

        # 4️⃣ AI'ya analiz ettir
        prompt = f"""
Aşağıdaki web sitesi verilerinden "{title}" pozisyonu için iş ilanı bilgilerini çıkar.
Web sitesi verileri:
{json.dumps(job_data_for_ai, ensure_ascii=False, indent=2)}
GÖREV:
1. title_tag, headings, body_snippet'ten şirket adını bul
2. İş pozisyonu adını bul
3. İş açıklaması oluştur
4. Gereksinimler/beceriler çıkar
JSON formatında döndür:
{{
  "jobs": [
    {{
      "title": "İş pozisyonu (verilerden çıkarılan)",
      "company": {{"name": "Şirket adı (verilerden çıkarılan)"}},
      "description": "İş açıklaması (min 100 karakter)",
      "url": "URL",
      "requirements": ["Teknik", "Beceriler"],
      "location_city": "{location}",
      "salary_range": "Bilgi varsa",
      "experience_level": "Bilgi varsa"
    }}
  ]
}}
KURAL: Şirket adı mutlaka bulunmalı, site adı değil gerçek şirket adı!"""

        # 4️⃣ Gemini API çağrısı
        gemini_payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 2048
            }
        }

        ai_response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json=gemini_payload,
            timeout=20
        )

        if ai_response.status_code != 200:
            print(f"❌ Gemini API hatası: {ai_response.text}")
            return jsonify({"success": False, "message": "AI analizi başarısız", "jobs": []}), 500

        # 5️⃣ Yanıtı parse et
        result = ai_response.json()
        ai_text = result['candidates'][0]['content']['parts'][0]['text']

        print(f"📌 AI yanıtı: {ai_text[:300]}...")

        # JSON çıkar
        import re
        json_match = re.search(r'\{.*\}', ai_text, re.DOTALL)
        if not json_match:
            return jsonify({"success": False, "message": "AI yanıtı parse edilemedi", "jobs": []}), 500

        try:
            ai_data = json.loads(json_match.group(0))
            jobs = ai_data.get("jobs", [])

            # Basit doğrulama
            final_jobs = []
            for job in jobs:
                if (job.get("title") and 
                    job.get("company", {}).get("name") and
                    job.get("description") and 
                    job.get("url") and
                    job.get("requirements")):
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
        print(f"❌ Genel hata: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"İş ilanları alınamadı: {str(e)}",
            "jobs": []
        }), 500

# YEDEK KOD SİLME SU AN KULLANILMIYOR   
@app.route("/api/jobs2", methods=["GET"])
def get_real_jobs_with_ai2():
    try:
        print("DEBUG API params →", request.args)
        print("DEBUG RAW URL →", request.url)

        title = request.args.get("title")
        location = request.args.get("location")

        print(f"📌 İş arama: {title} - {location}")

        # 1️⃣ SerpAPI ile gerçek iş ilanı linklerini bul
        serp_url = "https://serpapi.com/search"
        params = {
            "engine": "google",
            "q": f'"{title}" jobs {location} site:kariyer.net OR site:secretcv.com OR site:yenibiris.com OR site:indeed.com OR site:glassdoor.com',
            "num": 8,
            "api_key": SERPAPI_KEY
        }

        resp = requests.get(serp_url, params=params, timeout=10)
        data = resp.json()

        if "organic_results" not in data:
            return jsonify({"success": False, "message": "Arama sonucu bulunamadı", "jobs": []}), 200

        # 2️⃣ İş sitesi linklerini topla
        job_links = []
        for result in data.get("organic_results", [])[:6]:
            link = result.get("link", "")
            if link:
                job_links.append({
                    "url": link,
                    "title": result.get("title", ""),
                    "snippet": result.get("snippet", "")
                })

        if not job_links:
            return jsonify({"success": False, "message": "İş sitesi linki bulunamadı", "jobs": []}), 200

        print(f"📌 Toplam {len(job_links)} link bulundu")

        # 3️⃣ Gemini'ye linkleri ver, o iş ilanı bulsun
        prompt = f"""
Sen bir iş ilanı uzmanısın. Aşağıdaki linklerde "{title}" pozisyonu için iş ilanları var.
Bu linklerden her biri için iş ilanı bilgilerini çıkar:
Linkler:
{json.dumps(job_links, ensure_ascii=False, indent=2)}
GÖREV:
1. Her link için iş ilanı bilgilerini tahmin et/analiz et
2. URL'den şirket adını çıkar
3. Title'dan pozisyon adını çıkar  
4. Snippet'ten açıklama oluştur
5. "{title}" pozisyonuna uygun beceriler ekle
JSON formatında döndür:
{{
  "jobs": [
    {{
      "title": "Pozisyon adı (title'dan çıkar)",
      "company": {{"name": "Şirket adı (URL'den çıkar)"}},
      "description": "İş açıklaması (snippet'i genişlet)",
      "url": "Orijinal link",
      "requirements": ["Beceri1", "Beceri2", "Beceri3"],
      "location_city": "{location}",
      "salary_range": "Competitive",
      "experience_level": "Mid-level"
    }}
  ]
}}
KURALLAR:
- Her link için ayrı iş ilanı oluştur
- Title boş olmasın
- Company.name boş olmasın  
- Description en az 50 karakter
- Requirements en az 3 beceri
- Gerçekçi bilgiler oluştur
SADECE TAM BİLGİLİ İLANLARI DÖNDÜR!"""

        # 4️⃣ Gemini API çağrısı
        gemini_payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 2048
            }
        }

        ai_response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json=gemini_payload,
            timeout=20
        )

        if ai_response.status_code != 200:
            print(f"❌ Gemini API hatası: {ai_response.text}")
            return jsonify({"success": False, "message": "AI analizi başarısız", "jobs": []}), 500

        # 5️⃣ Yanıtı parse et
        result = ai_response.json()
        ai_text = result['candidates'][0]['content']['parts'][0]['text']

        print(f"📌 AI yanıtı: {ai_text[:300]}...")

        # JSON çıkar
        import re
        json_match = re.search(r'\{.*\}', ai_text, re.DOTALL)
        if not json_match:
            return jsonify({"success": False, "message": "AI yanıtı parse edilemedi", "jobs": []}), 500

        try:
            ai_data = json.loads(json_match.group(0))
            jobs = ai_data.get("jobs", [])

            # Basit doğrulama
            final_jobs = []
            for job in jobs:
                if (job.get("title") and 
                    job.get("company", {}).get("name") and
                    job.get("description") and 
                    job.get("url") and
                    job.get("requirements")):
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
        print(f"❌ Genel hata: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"İş ilanları alınamadı: {str(e)}",
            "jobs": []
        }), 500
    
if __name__ == "__main__":
    print("🚀 KariyerAI Backend başlatılıyor...")
    print(f"📋 Supabase URL: {SUPABASE_API_URL if SUPABASE_API_URL else '❌ Tanımlanmadı'}")
    print(f"🤖 Gemini API: {'✅ Yapılandırıldı' if GEMINI_API_KEY else '❌ Yapılandırılmadı'}")
    app.run(debug=True, port=5000)

