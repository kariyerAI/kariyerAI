# 🚀 KariyerAI - Yapay Zeka Destekli Kariyer Asistanı
KariyerAI, bireylerin kariyer yolculuklarında ihtiyaç duydukları desteği sunmak üzere geliştirilen, yapay zeka tabanlı kapsamlı bir kariyer gelişim platformudur. Platform, kullanıcıların CV’lerini analiz ederek güçlü yönlerini ve gelişime açık alanlarını belirler, ardından onlara özel iş ilanları, beceri geliştirme önerileri ve kişiselleştirilmiş öğrenme planları sunar. KariyerAI’nin amacı, özellikle iş hayatına yeni girecek olan kullanıcıların kendilerini daha iyi tanımalarını, doğru fırsatlarla buluşmalarını ve kariyerlerini bilinçli bir şekilde yönlendirmelerini sağlamaktır.

Kullanıcılar platforma giriş yaptıktan sonra, ilk olarak CV’lerini sisteme yükler. Gelişmiş yapay zeka motoru, bu belgeyi analiz ederek kişinin eğitim geçmişini, iş deneyimlerini, teknik ve sosyal becerilerini tanımlar, kişi profilini oluşturur. Bu veriler kullanılarak tüm iş ilanı platformlarında yer alan iş ilanlarıyla kullanıcının profilini eşleştirir. Her bir ilan için eşleşme yüzdesi gösterilir ve kullanıcı, hangi pozisyonlara ne kadar uygun olduğunu net bir şekilde görebilir.

İlan detaylarında kullanıcının eşleşen ve o işe göre eksik kalan yetkinlikleri belirtilir. Bu sayede kullanıcı yalnızca hangi iş ilanına başvurması gerektiğini değil, aynı zamanda hangi becerileri geliştirmesi gerektiğini de doğrudan öğrenmiş olur. Platform, eksik yetkinliklere göre otomatik olarak kişiselleştirilmiş bir öğrenme yol haritası oluşturur. Kullanıcı isterse bu önerileri “Öğrenmek İstiyorum” listesine ekleyebilir, hâlihazırda bildiği becerileri ise “Biliyorum” olarak işaretleyebilir. Bu eksik yetkinliklere göre de kullanıcıya öğrenmek istediği yetkinliğin eğitim modülü verilir.

KariyerAI yalnızca teknik becerilere odaklanmaz; aynı zamanda kişisel ve sosyal yetkinlikleri de değerlendirir. Bu kapsamda kullanıcıya 20 soruluk bir kişilik testi sunulur. Bu test sayesinde kullanıcının takım içindeki rolü, iletişim tarzı ve hangi pozisyonlarda daha başarılı olabileceği analiz edilir. Elde edilen sonuçlarla iş simülasyonu daha isabetli hale getirir.

Platformun en güçlü yönlerinden biri de interaktif simülasyonlardır. Kullanıcılar, müşteri görüşmeleri, iş mülakatları, takım toplantıları gibi gerçek dünya senaryolarını deneyimleyerek pratik yapabilir. Sanki gerçekten iş yerinde bilgisayarından çalışıyormuş izlenimi verilir. Her simülasyondan sonra kullanıcıya gerçek zamanlı geri bildirim verilir. Ayrıca, e-posta simülasyon modülü sayesinde kullanıcılar iş başvurusu, networking ya da müşteri yazışmaları gibi profesyonel iletişim becerilerini geliştirme fırsatı bulur.

Tüm bu özellikler, KariyerAI’yi sadece bir iş bulma aracı değil, aynı zamanda tam donanımlı bir kariyer koçu haline getirir. Platform, her kullanıcıya özel olarak şekillenen deneyimiyle kariyer planlamasını daha akıllı, etkili ve kişisel bir hale getirir.

KariyerAI, modern web teknolojileri ve güçlü yapay zeka servislerinin bir araya geldiği, uçtan uca tasarlanmış bir yapay zeka destekli kariyer asistanı platformudur. Sistem; frontend, backend, veritabanı ve üçüncü parti servislerden oluşan çok katmanlı bir mimariye sahiptir.

Platformun kullanıcı arayüzü HTML, CSS ve JavaScript kullanılarak geliştirilmiştir.
Tasarımda, kullanıcı dostu ve modern bir arayüz oluşturulmuştur. Ana bileşenler şunlardır:
HTML: Sayfa iskelet yapıları, form elemanları ve dinamik içerik bölmeleri
CSS: Grid ve Flexbox ile düzenlenen responsive layout, tema renkleri ve tipografi
JavaScript: Form validasyonu, kullanıcı etkileşimleri, API çağrıları ve sayfa içi dinamik davranışlar

Sunucu tarafı işlemler Python programlama dili ile yazılmış, hafif ama güçlü bir web çatısı olan Flask kullanılmıştır.Flask uygulaması, CORS ve dotenv desteğiyle yapılandırılmış, frontend ile entegrasyon sorunsuz bir şekilde sağlanmıştır.

Verilerin yönetimi ve kullanıcı kimlik doğrulaması için Supabase'i kullanır. Supabase, PostgreSQL tabanlı bir açık kaynak BaaS platformudur.

API kullanımı olarak SERPAPI, kullanıcının yetkinliklerine göre Google’dan iş ilanlarını çeken ve eşleşme oranlarına göre filtreleyen bir API’dir. Pozisyon, firma, konum gibi bilgiler frontend’e aktarılır ve güncel iş fırsatları sunulur. Gemini 2.0 API, KariyerAI platformunda kullanıcıların yüklediği CV’leri çoklu ajan (multi-agent) mimarisi ile detaylıca analiz eder; deneyim, eğitim, teknik ve sosyal becerileri otomatik olarak çıkarır ve JSON formatında yapılandırılmış çıktılar üretir. Bu veriler doğrultusunda kullanıcıya özel eğitim modelleri oluşturur, kişiselleştirilmiş simülasyon görevleri tasarlar ve her görev sonrası yapay zeka destekli geri bildirimler sağlar. Böylece kullanıcıların hem becerilerini geliştirmeleri hem de kariyer hedeflerine uygun şekilde yönlendirilmesi mümkün olur.
Ek olarak CORS yapılandırması ile frontend-backend güvenli iletişim sağlanır. Environment (.env) dosyaları ile API key'lerin gizli tutulur.

KariyerAI, modern web geliştirme teknolojileri ile güçlü yapay zeka servislerini birleştirerek kullanıcıya hem görsel açıdan etkileyici hem de işlevsel bir kariyer deneyimi sunar. Flask tabanlı modüler backend yapısı, Supabase entegrasyonu, Google Gemini LLM gücü ve simülasyon özellikleriyle KariyerAI, yalnızca bir platform değil, uçtan uca bir kariyer koçudur.

## ✨ Kariyerinizi Yapay Zeka ile Şekillendirin!

**KariyerAI**, kariyer yolculuğunuzda size rehberlik edecek yeni nesil bir platformdur.  
Gelişmiş yapay zeka teknolojileri kullanarak, profesyonel gelişiminizi hızlandırır ve kariyerinizi bir üst seviyeye taşır.

---

## 🌟 Öne Çıkan Özellikler

### 🎯 Akıllı İş Eşleştirme
- CV'nizi analiz eder  
- Size en uygun pozisyonları önerir  
- %100 kişiselleştirilmiş iş tavsiyeleri sunar  

### 📊 Beceri Analizi
- Mevcut yeteneklerinizi değerlendirir  
- Eksik becerilerinizi tespit eder  
- Sektör trendlerine göre öneriler sunar  

### 🎓 Kişiselleştirilmiş Öğrenme
- Yapay zeka destekli eğitim modülleri  
- İnteraktif öğrenme deneyimi  
- Gerçek dünya senaryoları  

### 🎮 İnteraktif Simülasyonlar
- Gerçek iş senaryoları  
- Pratik yapma imkanı  
- Anlık geri bildirim  

---

## ❓ Neden KariyerAI?

### 🤖 Yapay Zeka Gücü
- Google Gemini AI entegrasyonu  
- Gelişmiş veri analizi  
- Akıllı kariyer tavsiyeleri  

### 🧭 Kişiselleştirilmiş Deneyim
- Her kullanıcıya özel yol haritası  
- Dinamik öğrenme planı  
- Sürekli gelişim takibi  

### 🎮 İnteraktif Simülasyonlar
- Gerçek iş senaryoları
- Pratik yapma imkanı
- Anlık geri bildirim

### 🖥️ Kullanıcı Dostu Arayüz
- Modern ve şık tasarım  
- Kolay navigasyon  
- Responsive yapı  

---

## 🛠️ Teknik Altyapı

### Frontend
- HTML5
- CSS
- JavaScript
- Modern UI Bileşenleri

### Backend
- Python
- Flask
- Google Gemini AI
- Supabase

### API'ler
- SerpAPI (iş ilanları için)
- Gemini AI (analiz için)
- RESTful mimari

---

## 🤖 LLM (Large Language Model) Teknolojileri

### Kullanılan LLM ve Sistemler

#### 1. Ana Model: Google Gemini 2.0 Flash
- CV analizi ve değerlendirme
- Kariyer yol haritası oluşturma
- Beceri analizi ve önerileri
- İnteraktif kariyer koçluğu

#### 2. Multi-Agent Sistemi
- **Kariyer Koçu Agent**
  - Kariyer yol haritası oluşturma
  - Profesyonel gelişim tavsiyeleri
  - Hedef belirleme ve takip

- **Teknik Değerlendirme Agent'ı**
  - Teknik becerilerin analizi
  - Teknoloji trendleri takibi
  - Öğrenme yol haritası oluşturma

- **İş Eşleştirme Agent'ı**
  - İş ilanı analizi
  - CV-pozisyon uyum değerlendirmesi
  - Başvuru stratejisi önerileri

- **Soft Skills Agent'ı**
  - Yumuşak becerilerin değerlendirilmesi
  - İletişim stili analizi
  - Kişilik özelliklerine göre tavsiyeler

### Yapılandırılmış Çıktı Teknikleri

- JSON çıktı formatları 

### Prompt Mühendisliği

#### Kullanılan Teknikler
- Chain-of-Thought Prompting
- Few-Shot Learning
- Zero-Shot Learning
- Context Window Optimizasyonu

### Kişiselleştirme Sistemi

#### Parametreler
- Deneyim seviyesi
- Teknik yetkinlikler
- Kariyer hedefleri
- Öğrenme stili
- Sektör tercihleri

#### Dinamik Ayarlamalar
- Kullanıcı geri bildirimleri
- İlerleme metrikleri
- Öğrenme hızı adaptasyonu
- İlgi alanlarına göre içerik optimizasyonu


---

## 🚀 Hemen Başlayın!

**KariyerAI'yi Deneyin**  
Geleceğin kariyeri, bugünün teknolojisiyle şekilleniyor!

## 🚀 Kurulum Adımları

### 1. Projeyi İndirin
```bash
git clone https://github.com/kariyerAI/kariyerAI.git
cd kariyerAI
```

### 2. Python Sanal Ortam Oluşturun
```bash
# Sanal ortam oluştur
python3 -m venv venv

# Sanal ortamı aktif et
source venv/bin/activate
```

### 3. Gerekli Paketleri Yükleyin
```bash
pip install -r requirements.txt
```

### 4. API Anahtarlarını Ayarlayın
`.env` dosyası oluşturun:
```bash
touch .env
```
`.env` dosyasına API anahtarlarını ekleyin:
```env
GEMINI_API_KEY=your_gemini_key
SERPAPI_KEY=your_serpapi_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### 5. Uygulamayı Çalıştırın
```bash
# Backend'i başlat
python app.py

# Frontend'i başlat (VS Code Live Server ile)
# VS Code'da frontend/html/onboarding_page.html dosyasını açın
# Sol alttaki "Go Live" butonuna tıklayın
# veya
# Sağ tıklayıp "Open with Live Server" seçin

# Tarayıcıda şu adrese gidin:
http://127.0.0.1:5500/frontend/html/onboarding_page.html
```

### Önemli Notlar
- Backend API `http://127.0.0.1:5000` adresinde çalışacak
- Frontend arayüzü `http://127.0.0.1:5500` adresinde çalışacak
- VS Code Live Server eklentisinin yüklü olduğundan emin olun

---

## 📬 İletişim

- **Email:** kariyeraisite@gmail.com  


---

> *"Geleceğin kariyeri, bugünün teknolojisiyle şekilleniyor!" – KariyerAI*

---

#### 🔖 Etiketler  
`#KariyerAI` `#YapayZeka` `#KariyerGelişimi` `#Teknoloji` `#İşArama`
