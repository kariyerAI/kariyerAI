from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
import json
from dotenv import load_dotenv
from bs4 import BeautifulSoup
import time

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
import traceback

@app.route('/')
def home():
    return 'KariyerAI Backend çalışıyor!'

# Profil verisini Supabase'e kaydetmek için
@app.route("/save-profile", methods=["POST"])  
def save_profile():
    try:
        profile_data_raw = request.json
        print("📌 Gelen profil verisi:", profile_data_raw)

        # 🛠 Skills'i Supabase formatına çevir
        skills = profile_data_raw.get("skills", [])
        skills_str = "{" + ",".join([s.replace(",", "") for s in skills]) + "}" if skills else None

        # 🛠 Experiences jsonb formatına çevir
        experiences = profile_data_raw.get("experiences", [])
        experiences_json = json.dumps(experiences) if experiences else None

        # Supabase'e gönderilecek veri
        profile_data = {
            "first_name": profile_data_raw.get("firstName"),
            "last_name": profile_data_raw.get("lastName"),
            "email": profile_data_raw.get("email"),
            "phone": profile_data_raw.get("phone"),
            "location": profile_data_raw.get("location"),
            "current_title": profile_data_raw.get("currentTitle"),
            "experience_level": profile_data_raw.get("experienceLevel"),
            "summary": profile_data_raw.get("summary"),
            "skills": skills_str,                  # ✅ text[] format
            "experiences": (
                profile_data_raw.get("experiences") 
                if isinstance(profile_data_raw.get("experiences"), list)
                else json.loads(profile_data_raw.get("experiences", "[]"))
                ),
            "university": profile_data_raw.get("university"),
            "degree": profile_data_raw.get("degree"),
            "graduation_year": profile_data_raw.get("graduationYear"),
            "gpa": profile_data_raw.get("gpa"),
        }

        headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"  # ✅ ID'nin dönmesi için
        }

        response = requests.post(
            f"{SUPABASE_API_URL}/rest/v1/profiles",
            headers=headers,
            json=profile_data
        )

        print("📌 Supabase response:", response.status_code, response.text)

        if response.status_code in [200, 201]:
            data = response.json()
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
        print("❌ save_profile hatası:", traceback.format_exc())
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

@app.route("/task-simulation", methods=["POST"])
def task_simulation():
    data = request.json
    task = data.get("task")
    user = data.get("user", {})

    prompt = f"""
Aşağıda detayları verilen iş günü görevi için, görevin ve kullanıcının mesleğinin doğasına uygun, gerçekçi ve etkileşimli bir mini simülasyon üret.

- Eğer görev "e-posta kontrolü" ise, örnek e-postalar ve önemli bir karar anı üret.
- Eğer görev "teknik geliştirme" veya "API entegrasyonu" ise, kod snippet'i, hata mesajı, müşteri isteği, test sonucu ve karar anı üret.
- Eğer görev "toplantı" ise, toplantı özeti, alınan kararlar, kısa bir olay ve karar anı üret.
- Eğer görev "gözlem" veya "raporlama" ise, gözlem raporu, beklenmedik olay ve karar anı üret.
- Eğer görev "müşteri görüşmesi" ise, müşteriyle ilgili bir durum, iletişim örneği ve karar anı üret.
- Eğer görev "sosyal etkinlik" veya "kahve molası" ise, sosyal bir olay veya sürpriz üret.
- Eğer görev başka bir türdeyse, o görevin mesleğe uygun tipik çıktısını, yaşanabilecek bir olay ve karar anı üret.
- Her görevde sadece o göreve ve mesleğe uygun içerik üret, gereksiz bilgi ekleme.

Yanıtı sadece geçerli bir JSON olarak ver.

Kullanıcı Bilgileri:
- Meslek: {user.get('current_title', '')}
- Departman: {user.get('department', '')}
- Sektör: {user.get('sector', '')}
- Beceriler: {', '.join(user.get('skills', []))}

Görev Bilgileri:
- Saat: {task.get('time')}
- Görev: {task.get('task')}
- Öncelik: {task.get('priority')}
- Ekip: {task.get('team_size')}
- Araçlar: {', '.join(task.get('tools', []))}
- Süre: {task.get('duration_min')} dk

JSON formatı:
{{
  // Sadece göreve ve mesleğe uygun alanlar!
  // Teknik görev için:
  "code_snippet": "public class PaymentAPI {{ ... }}",
  "error_message": "HTTP 500 Internal Server Error",
  "customer_request": "API'nin döviz desteği eklemesini istiyoruz.",
  "test_result": "Tüm testler geçti, ancak ödeme entegrasyonu başarısız.",
  "emails": [
    {{"from": "pm@company.com", "subject": "API Feedback", "summary": "Müşteri yeni özellik istedi."}}
  ],
  "meeting_summary": "Sprint planlama toplantısında yeni görevler dağıtıldı.",
  "observation_report": "Makine A'da sıcaklık dalgalanması gözlendi.",
  "mini_event": "Takım arkadaşı acil bir hata bildirdi.",
  "decision": {{
    "question": "API endpoint'inde hata oluştu. Ne yaparsın?",
    "options": [
      {{"id": "a", "text": "Logları incele", "feedback": "Sorunun kaynağını bulabilirsin.", "score": 3}},
      {{"id": "b", "text": "Rollback yap", "feedback": "Acele karar riskli olabilir.", "score": 2}}
    ]
  }}
}}
"""
    # Gemini API çağrısı ve JSON parse işlemleri aynı kalabilir

    gemini_payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.4, "maxOutputTokens": 1500}
    }
    response = requests.post(
        f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
        headers={"Content-Type": "application/json"},
        json=gemini_payload
    )

    if response.status_code == 200:
        result = response.json()
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
            "message": f"Gemini API hatası: {response.text}"
        }), 400
    
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
            "num": 15,
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
                    if any(site in link for site in ["kariyer.net/is-ilani/", "secretcv.com/ilan/", "yenibiris.com/is-ilani/"]):
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
Eksik bilgiler varsa varsayılan kullan:
- Şirket adını kesinlikle belirt, boş bırakma
- Requirements için açıklamayı dikkatlice inceleyerek anahtar kelimeleri çıkararak belirle, boş bırakma
- Konumu mutlaka belirt, boş bırakma
- Başvurusu kapanmış, ilan tarihi geçmiş ilanları atla, bu ilan artık başvuru kabul etmiyor yazıyorsa atla

Web sitesi verileri:
{json.dumps(job_data_for_ai, ensure_ascii=False, indent=2)}

Yanıtı JSON olarak ver:
{{
  "jobs": [
    {{
      "title": "Pozisyon adı",
      "company": {{"name": "Şirket adı"}},
      "description": "İş açıklaması (en az 50 karakter)",
      "url": "İlan linki",
      "requirements": ["Python", "JavaScript", "Django"],  # Anahtar kelimeleri çıkararak belirle, en az 6-8 spesifik kelime kullan
      "location_city": "{location}",
      "salary_range": "Bilgi yoksa boş bırak",
      "experience_level": "Bilgi yoksa boş bırak"
    }}
  ]
}}

- title, company.name, url, requirements, location_city alanlarını kesinlikle doldur, not specified yazma inceleyip de bilgi yaz.
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
