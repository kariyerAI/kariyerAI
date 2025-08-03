from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
import json
from dotenv import load_dotenv


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
import traceback

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
            "Prefer": "return=representation"  # ID'nin dönmesi için gerekli
        }

        response = requests.post(
            f"{SUPABASE_API_URL}/rest/v1/profiles",
            headers=headers,
            json=profile_data
        )

        print("Supabase response:", response.status_code, response.text)

        if response.status_code in [200, 201]:
            data = response.json()
            return jsonify({
                "success": True,
                "message": "Profil başarıyla kaydedildi",
                "data": data  # id: uuid dönecek
            })
        else:
            return jsonify({
                "success": False,
                "message": f"Supabase hatası: {response.text}"
            }), 400

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

if __name__ == "__main__":
    print("🚀 KariyerAI Backend başlatılıyor...")
    print(f"📋 Supabase URL: {SUPABASE_API_URL if SUPABASE_API_URL else '❌ Tanımlanmadı'}")
    print(f"🤖 Gemini API: {'✅ Yapılandırıldı' if GEMINI_API_KEY else '❌ Yapılandırılmadı'}")
    app.run(debug=True, port=5000)

