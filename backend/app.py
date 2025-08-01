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
           (örneğin: kahve molası, Slack üzerinden acil mesaj, müşteri talebi değişiklik bildirimi vb.)
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

if __name__ == "__main__":
    print("🚀 KariyerAI Backend başlatılıyor...")
    print(f"📋 Supabase URL: {SUPABASE_API_URL if SUPABASE_API_URL else '❌ Tanımlanmadı'}")
    print(f"🤖 Gemini API: {'✅ Yapılandırıldı' if GEMINI_API_KEY else '❌ Yapılandırılmadı'}")
    app.run(debug=True, port=5000)

