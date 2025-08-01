from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)  # CORS sorunlarını çözmek için

# Environment variables
SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")
SUPABASE_API_URL = os.getenv("SUPABASE_API_URL")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = os.getenv("GEMINI_API_URL", 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent')
import traceback
@app.route('/')
def home():
    return 'KariyerAI Backend çalışıyor!'

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
            "experiences": profile_data_raw.get("experiences", []),  # jsonb destekli alan
            "university": profile_data_raw.get("university"),
            "degree": profile_data_raw.get("degree"),
            "graduation_year": profile_data_raw.get("graduationYear"),
            "gpa": profile_data_raw.get("gpa"),
        }
        print("Supabase'e gönderilen veri:", profile_data)

        headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}",
            "Content-Type": "application/json"
        }

        response = requests.post(
            f"{SUPABASE_API_URL}/rest/v1/profiles",

            headers=headers,
            json=profile_data
        )

        print("Supabase response status:", response.status_code)
        print("Supabase response text:", response.text)

        if response.status_code == 201:
            if response.text:
                data = response.json()
            else:
                data = None
            return jsonify({
                "success": True,
                "message": "Profil başarıyla kaydedildi",
                "data": data
            })
        else:
            return jsonify({
                "success": False,
                "message": f"Supabase hatası: {response.text}"
            }), 400

    except Exception as e:
        print("save_profile hatası:\n", traceback.format_exc())
        return jsonify({
            "success": False,
            "message": f"Server hatası: {str(e)}"
        }), 500


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
        
        # Gemini AI prompt
        prompt = f"""
        Lütfen aşağıdaki CV metnini dikkatlice analiz et ve aşağıdaki JSON yapısına uygun şekilde, **sadece** JSON olarak yanıt ver:

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


@app.route("/user-stats/<user_id>", methods=["GET"])
def get_user_stats(user_id):
    """
    Belirli bir kullanıcıya ait istatistikleri ('user_stats' tablosundan) çeker.
    """
    try:
        headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}"
        }
        response = requests.get(
            f"{SUPABASE_API_URL}/rest/v1/user_stats?user_id=eq.{user_id}",
            headers=headers
        )
        if response.status_code == 200:
            data = response.json()
            return jsonify({"success": True, "data": data[0] if data else None})
        else:
            return jsonify({"success": False, "message": f"İstatistik bulunamadı: {response.text}"}), 404
    except Exception as e:
        print("get_user_stats hatası:\n", traceback.format_exc())
        return jsonify({"success": False, "message": f"Server hatası: {str(e)}"}), 500

@app.route("/user-stats", methods=["POST"])
def upsert_user_stats():
    """
    Kullanıcı istatistiklerini 'user_stats' tablosuna kaydeder veya günceller.
    """
    try:
        stats_data = request.json
        headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }
        response = requests.post(
            f"{SUPABASE_API_URL}/rest/v1/user_stats",
            headers=headers,
            json=stats_data
        )
        if response.status_code in [200, 201]:
            return jsonify({"success": True, "message": "İstatistikler kaydedildi"})
        else:
            return jsonify({"success": False, "message": f"Supabase hatası: {response.text}"}), 400
    except Exception as e:
        print("upsert_user_stats hatası:\n", traceback.format_exc())
        return jsonify({"success": False, "message": f"Server hatası: {str(e)}"}), 500

@app.route("/skill-gaps/<user_id>", methods=["GET"])
def get_skill_gaps(user_id):
    """
    Belirli bir kullanıcıya ait beceri eksikliklerini ('skill_gaps' tablosundan) çeker.
    """
    try:
        headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}"
        }
        response = requests.get(
            f"{SUPABASE_API_URL}/rest/v1/skill_gaps?user_id=eq.{user_id}",
            headers=headers
        )
        if response.status_code == 200:
            data = response.json()
            return jsonify({"success": True, "data": data})
        else:
            return jsonify({"success": False, "message": f"Beceri eksiklikleri bulunamadı: {response.text}"}), 404
    except Exception as e:
        print("get_skill_gaps hatası:\n", traceback.format_exc())
        return jsonify({"success": False, "message": f"Server hatası: {str(e)}"}), 500

@app.route("/skill-gaps", methods=["POST"])
def add_skill_gap():
    """
    'skill_gaps' tablosuna yeni bir beceri eksikliği ekler.
    """
    try:
        gap_data = request.json
        headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}",
            "Content-Type": "application/json"
        }
        response = requests.post(
            f"{SUPABASE_API_URL}/rest/v1/skill_gaps",
            headers=headers,
            json=gap_data
        )
        if response.status_code == 201:
            return jsonify({"success": True, "message": "Beceri eksikliği eklendi"})
        else:
            return jsonify({"success": False, "message": f"Supabase hatası: {response.text}"}), 400
    except Exception as e:
        print("add_skill_gap hatası:\n", traceback.format_exc())
        return jsonify({"success": False, "message": f"Server hatası: {str(e)}"}), 500

@app.route("/tasks/<user_id>", methods=["GET"])
def get_tasks(user_id):
    """
    Belirli bir kullanıcıya ait görevleri ('tasks' tablosundan) çeker.
    """
    try:
        headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}"
        }
        response = requests.get(
            f"{SUPABASE_API_URL}/rest/v1/tasks?user_id=eq.{user_id}",
            headers=headers
        )
        if response.status_code == 200:
            data = response.json()
            return jsonify({"success": True, "data": data})
        else:
            return jsonify({"success": False, "message": f"Görevler bulunamadı: {response.text}"}), 404
    except Exception as e:
        print("get_tasks hatası:\n", traceback.format_exc())
        return jsonify({"success": False, "message": f"Server hatası: {str(e)}"}), 500

@app.route("/tasks", methods=["POST"])
def add_task():
    """
    'tasks' tablosuna yeni bir görev ekler.
    """
    try:
        task_data = request.json
        headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}",
            "Content-Type": "application/json"
        }
        response = requests.post(
            f"{SUPABASE_API_URL}/rest/v1/tasks",
            headers=headers,
            json=task_data
        )
        if response.status_code == 201:
            return jsonify({"success": True, "message": "Görev eklendi"})
        else:
            return jsonify({"success": False, "message": f"Supabase hatası: {response.text}"}), 400
    except Exception as e:
        print("add_task hatası:\n", traceback.format_exc())
        return jsonify({"success": False, "message": f"Server hatası: {str(e)}"}), 500

@app.route("/activities/<user_id>", methods=["GET"])
def get_activities(user_id):
    """
    Belirli bir kullanıcıya ait son aktiviteleri ('activities' tablosundan) çeker.
    En yeni aktiviteler önce gelecek şekilde sıralanır.
    """
    try:
        headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}"
        }
        response = requests.get(
            f"{SUPABASE_API_URL}/rest/v1/activities?user_id=eq.{user_id}&order=created_at.desc",
            headers=headers
        )
        if response.status_code == 200:
            data = response.json()
            return jsonify({"success": True, "data": data})
        else:
            return jsonify({"success": False, "message": f"Aktiviteler bulunamadı: {response.text}"}), 404
    except Exception as e:
        print("get_activities hatası:\n", traceback.format_exc())
        return jsonify({"success": False, "message": f"Server hatası: {str(e)}"}), 500

@app.route("/activities", methods=["POST"])
def add_activity():
    """
    'activities' tablosuna yeni bir aktivite ekler.
    """
    try:
        activity_data = request.json
        headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}",
            "Content-Type": "application/json"
        }
        response = requests.post(
            f"{SUPABASE_API_URL}/rest/v1/activities",
            headers=headers,
            json=activity_data
        )
        if response.status_code == 201:
            return jsonify({"success": True, "message": "Aktivite eklendi"})
        else:
            return jsonify({"success": False, "message": f"Supabase hatası: {response.text}"}), 400
    except Exception as e:
        print("add_activity hatası:\n", traceback.format_exc())
        return jsonify({"success": False, "message": f"Server hatası: {str(e)}"}), 500

@app.route("/config", methods=["GET"])
def get_config():
    """
    Frontend'in Supabase istemcisini başlatması için gerekli
    Supabase URL'sini ve Anon Key'ini sağlar.
    Bu endpoint, hassas anahtarları doğrudan frontend'e ifşa etmeden
    yapılandırma bilgilerini güvenli bir şekilde aktarır.
    """
    try:
        # Ortam değişkenlerinin tanımlı olduğundan emin olun
        if not SUPABASE_API_URL or not SUPABASE_ANON_KEY:
            # Eksik bir anahtar varsa hata döndür
            return jsonify({
                "success": False,
                "message": "Supabase URL veya Anon Key ortam değişkenlerinde tanımlı değil. Lütfen .env dosyanızı kontrol edin."
            }), 500

        return jsonify({
            "success": True,
            "supabaseUrl": SUPABASE_API_URL,
            "supabaseAnonKey": SUPABASE_ANON_KEY
        })
    except Exception as e:
        print("get_config hatası:\n", traceback.format_exc())
        return jsonify({
            "success": False,
            "message": f"Yapılandırma bilgileri alınamadı: {str(e)}"
        }), 500

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

if __name__ == "__main__":
    print("🚀 KariyerAI Backend başlatılıyor...")
    print(f"📋 Supabase URL: {SUPABASE_API_URL if SUPABASE_API_URL else '❌ Tanımlanmadı'}")
    print(f"🤖 Gemini API: {'✅ Yapılandırıldı' if GEMINI_API_KEY else '❌ Yapılandırılmadı'}")
    # Uygulamayı hata ayıklama modunda çalıştır (geliştirme için uygundur)
    app.run(debug=True, port=5000)