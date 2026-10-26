// "Türk e-ticaretinde tekrar satış getiren 25 taktik" — Sepet Röntgeni PDF rehberinin içeriği.
// Kural: her rakam bir kaynağa dayanır (KAYNAKLAR); örnek mesajlar yalnızca ticari ileti onayı olan müşteriler içindir.

export const TITLE = 'Türk e-ticaretinde tekrar satış getiren 25 taktik';
export const SUBTITLE = 'Elindeki müşteriyi geri getirmenin, ünlü markalardan röntgenlenmiş yolları.';

export const INTRO = [
  'Bu rehber, Sepet Röntgeni videolarında anlattığımız taktiklerin mağazana uygulanabilir hâli.',
  'Her taktikte üç şey var: neden işe yaradığı, nasıl uygulayacağın ve kopyalayıp düzenleyebileceğin örnek bir mesaj.',
  'Rakamların hepsi kaynaklı; kaynaklar en sonda. Rakam vermediğimiz yerde, elimizde güvenilir bir rakam olmadığı içindir.',
];

export const LEGAL = [
  'Ticari SMS ve e-postayı yalnızca ticari ileti onayı veren müşterilere gönder. Türkiye\'de bu onaylar İleti Yönetim Sistemi (İYS) üzerinden yönetilir.',
  'Her ticari mesajda müşterinin kolayca çıkabileceği bir ret yolu bulunsun. Örnek mesajlardaki [ret bilgisi] yazan yere kendi ret metnini ekle.',
  'Kişiselleştirme için kullandığın verileri KVKK kapsamında, müşteriye açıkladığın amaçla ve gerekli izinlerle işle.',
  'Bu rehber hukuki danışmanlık değildir; emin olmadığın durumda bir uzmana danış.',
];

/** @type {{ title: string, intro: string, items: { t: string, why: string, how: string[], msg?: string, src?: string[] }[] }[]} */
export const CHAPTERS = [
  {
    title: 'İlk siparişten sonra',
    intro: 'İkinci sipariş, sadakatin başladığı yer. İlk teslimattan sonraki günler en değerli zaman.',
    items: [
      {
        t: 'Müşteriyi sıfırdan başlatma',
        why: 'Bir araba yıkama deneyinde aynı ödül için yine 8 yıkama gerekiyordu, ama ilk 2 damgası hazır basılı kartı alanlar kartı daha sık ve daha hızlı doldurdu. Yolun bir kısmı bitmiş görünen hedef, daha ulaşılabilir hissettirir.',
        how: ['Sadakat programın varsa ilk siparişten sonra ilk adımları hediye olarak doldur.', 'Mesajda kalan adımı göster, toplam adımı değil.'],
        msg: 'Merhaba [Ad], ilk siparişin için kartına 2 damga hediye ettik. Ödülüne sadece birkaç sipariş kaldı. [ret bilgisi]',
        src: ['nunes'],
      },
      {
        t: 'Beklenmedik küçük bir hediye ekle',
        why: 'Klasik bir deneyde karşılıksız bir içecek ikram edilen kişiler, ikram edenden daha çok çekiliş bileti aldı. Beklenmedik bir iyilik, karşılık verme isteği doğurur.',
        how: ['İlk siparişe duyurmadığın küçük bir hediye ekle: numune, mini ürün, kullanım kartı.', 'Önceden "hediye var" deme; sürpriz olmalı.'],
        msg: 'Kutundaki küçük sürprizi fark ettin mi? Senin için seçtik. Beğenirsen bize yaz. [ret bilgisi]',
        src: ['regan'],
      },
      {
        t: 'Kutuya el yazısı bir not koy',
        why: 'Teslimat anı, markanla ilk fiziksel temas. Kişisel bir dokunuş, kutuyu sıradan bir paketten ayırır ve karşılıklılık etkisini güçlendirir.',
        how: ['Müşterinin adını yazdığın tek cümlelik bir teşekkür notu ekle.', 'Notta bir sonraki adımı da söyle: bakım ipucu, kullanım önerisi.'],
      },
      {
        t: 'Müşteriye küçük bir emek adımı ver',
        why: 'Bir deneyde IKEA kutusunu kendi kuranlar, aynı kutunun hazır kurulmuş hâli için %63 daha fazla ödemeye razı oldu. Ama etki, iş tamamlanınca ortaya çıktı.',
        how: ['Ürünü kişiselleştirebileceği kısa bir adım sun: isim ekleme, renk seçme, set oluşturma.', 'Adımı kısa tut; yarım kalan emek aynı etkiyi yaratmıyor.'],
        msg: 'Siparişini kişiselleştirmek ister misin? İsmini ekle, rengini seç. İki dakikanı alır. [ret bilgisi]',
        src: ['norton'],
      },
      {
        t: 'İkinci sipariş için tek ve net bir sebep ver',
        why: 'Genel bir "yeni ürünlerimize göz at" mesajı, kimseye özel değildir. Müşterinin ilk aldığı ürüne bağlı tek bir öneri, ona bir sonraki adımı gösterir.',
        how: ['İlk siparişteki ürünü tamamlayan tek bir ürün belirle.', 'Ürünün bitmesi ya da yenilenmesi gereken zamana yakın gönder.'],
        msg: '[Ürün] ile en çok birlikte alınan ürün: [Tamamlayıcı ürün]. Senin için ayırdık. [ret bilgisi]',
      },
    ],
  },
  {
    title: 'Sepet ve ödeme',
    intro: 'Sepete ürün ekleyen biri, karar vermek üzere olan biridir. Onu kaybetmek değil, hatırlatmak gerekir.',
    items: [
      {
        t: 'Terk edilen sepete aynı gün hatırlat',
        why: '50 çalışmanın ortalamasına göre online sepetlerin yaklaşık %70\'i ödemeye ulaşmıyor. Bir saha deneyinde hatırlatma reklamlarının ilk haftalık etkisinin yarısı, ilk iki günde görüldü. İlgi en sıcakken yapılan hatırlatma daha çok işe yarıyor.',
        how: ['İlk hatırlatmayı aynı gün gönder.', 'İkinci hatırlatmayı ertesi gün, son hatırlatmayı birkaç gün sonra planla.'],
        msg: '[Ad], sepetinde [Ürün] seni bekliyor. Kaldığın yerden devam etmek için tek tık yeter. [ret bilgisi]',
        src: ['baymard', 'sahni'],
      },
      {
        t: 'Hatırlatmayı indirimle başlatma',
        why: 'Her terk edilen sepete indirim gönderirsen, müşteri sepeti indirim beklemek için terk etmeyi öğrenebilir. İlk mesajın görevi hatırlatmak, ikna etmek değil.',
        how: ['İlk mesajda sadece ürünü ve sepete dönüş yolunu göster.', 'İndirimi, varsa, son hatırlatmaya sakla.'],
      },
      {
        t: 'Ücretsiz kargo eşiğini sepetin biraz üstüne koy',
        why: 'Amazon ücretsiz kargo eşiği 49 dolarken siparişte ortalama 3,31 ürün vardı; eşik 25 dolara inince bu sayı 2,53\'e düştü. Ama dikkat: bir çalışmada ücretsiz kargo satışı artırdı, kârı artırmadı.',
        how: ['Ortalama sepet tutarını hesapla; eşiği onun biraz üstüne koy.', 'Eşik değişikliğinden önce ve sonra kârı da ölç, sadece satışı değil.'],
        src: ['wharton', 'lewis'],
      },
      {
        t: 'Eşiğe kalan tutarı sepette göster',
        why: 'Eşiği bilmeyen müşteri, ona doğru ilerleyemez. Kalan tutarı görmek, "bir ürün daha" kararını kolaylaştırır.',
        how: ['Sepet sayfasında "Ücretsiz kargo için X TL kaldı" çubuğu göster.', 'Eşiği tamamlayan uygun fiyatlı ürünleri hemen altında öner.'],
      },
      {
        t: 'Gerçek kıtlığı açıkça söyle, sahtesini asla',
        why: '1975\'teki bir deneyde aynı kurabiye, 2 kurabiye kalan kavanozdan alınınca 10\'luk kavanozdakinden daha çekici bulundu. Ama tat puanı değişmedi; değişen algıydı.',
        how: ['Stok gerçekten azaldığında ürün sayfasında ve sepette göster.', 'Gerçek olmayan kıtlık yazma: güveni zedeler, yanıltıcı reklam sayılabilir.'],
        msg: 'Favorilerindeki [Ürün] stokta azaldı. Haber vermek istedik. [ret bilgisi]',
        src: ['worchel'],
      },
    ],
  },
  {
    title: 'Sadakat ve puan',
    intro: 'Puan programı bir indirim aracı değil, bir geri çağırma aracıdır.',
    items: [
      {
        t: 'Puanı küçük ve yakın ödüllere böl',
        why: 'Starbucks\'ın ABD\'deki şirket mağazalarında harcamanın %59\'unu Rewards üyeleri yapıyor. Yakın görünen ödül, bir sonraki alışverişi başka yere götürmeyi zorlaştırır.',
        how: ['Tek büyük ödül yerine birkaç küçük ödül basamağı kur.', 'İlk ödül, ilk birkaç siparişte ulaşılabilir olsun.'],
        src: ['starbucks'],
      },
      {
        t: 'Her siparişten sonra ödüle kalan adımı yaz',
        why: 'Müşteri ilerlemesini görmezse, ilerlediğini hissetmez. Kalan adım, toplam adımdan daha motive edicidir.',
        how: ['Sipariş onayı ve kargo mesajına ödüle kalan sipariş sayısını ekle.', 'Ödül bölümünü müşteri hesabının en üstüne taşı.'],
        msg: 'Siparişin yolda! Ödülüne sadece [N] sipariş kaldı. [ret bilgisi]',
      },
      {
        t: 'Puanlar silinmeden önce hatırlat',
        why: 'Kayıptan kaçınma: kayıplar, aynı büyüklükteki kazançlardan daha güçlü hissedilir. Kaybedeceği bir şeyi gören müşteri harekete geçer.',
        how: ['Puan süresi dolmadan önce bir hatırlatma gönder.', 'Bu mesajı yalnızca puanlar gerçekten siliniyorsa gönder.'],
        msg: '[Ad], biriken [N] puanın [tarih] tarihinde siliniyor. Kullanmak için birkaç gün kaldı. [ret bilgisi]',
        src: ['kahneman'],
      },
      {
        t: 'Düzenli alımlarda hatırlatma ritmi kur',
        why: 'Duolingo\'ya göre 7 günlük seri yapan kullanıcıların kursu bitirme ihtimali 3,6 kat daha yüksek. Bu bir ilişki, kanıtlanmış bir sebep değil; ama düzenli ritmin alışkanlığı desteklediğini gösteriyor.',
        how: ['Biten ürünlerde (mama, kahve, bakım) ortalama tükenme süresini hesapla.', 'Hatırlatmayı ürün bitmeden kısa süre önce gönder.'],
        msg: '[Ürün] bitmek üzere olabilir. Aynı ürünü tek tıkla yeniden sipariş et. [ret bilgisi]',
        src: ['duolingo'],
      },
      {
        t: 'Sık alanlara yıllık kargo üyeliği dene',
        why: 'Tahminlere göre ABD\'de Prime üyeleri Amazon\'da yılda yaklaşık 1.170 dolar, üye olmayanlar 570 dolar harcıyor. Ama çok alışveriş yapanlar zaten üye olmaya daha yatkın; fark tek başına üyelikten gelmiyor olabilir.',
        how: ['Önce yalnızca en sık alan müşteri grubuna küçük bir yıllık kargo üyeliği öner.', 'Her siparişte üyeliğin ona ne kazandırdığını göster.'],
        src: ['cirp'],
      },
    ],
  },
  {
    title: 'Sessiz ve kayıp müşteri',
    intro: 'Kayıp müşterinin de son kullanma tarihi var. Ne kadar beklersen, geri dönmesi o kadar zorlaşır.',
    items: [
      {
        t: 'Mağazan için "kayıp müşteri" tanımı yap',
        why: 'Tanımı olmayan kitleye mesaj gönderemezsin. Ürününün ne sıklıkla alındığına göre bir sessizlik süresi belirle.',
        how: ['Başlangıç için son siparişinden 90 gün geçen müşterileri "sessiz" say.', 'Sık alınan ürünlerde süreyi kısalt, nadir alınanlarda uzat.'],
      },
      {
        t: 'Sessiz müşteriye erken ulaş',
        why: 'Türkiye\'de bir e-ticaret şirketinin verisinde 6–9 ay önce kaybedilen müşterilerin %47,3\'ü geri kazanıldı; 15 aydan uzun süredir alışveriş yapmayanlarda bu oran %16,8\'e düştü.',
        how: ['Sessizlik başladığı anda ilk hatırlatmayı gönder; aylarca bekleme.', 'Geri kazanma mesajlarını sessizlik süresine göre aşamalandır.'],
        msg: '[Ad], seni bir süredir görmedik. Son aldığın [Ürün] için yeni seçenekler geldi. [ret bilgisi]',
        src: ['itu'],
      },
      {
        t: 'İndirimi son adıma sakla',
        why: 'İlk geri çağırma mesajı bir hatırlatmadır. İndirimle başlarsan, geri dönen her müşteriye gereksiz yere indirim vermiş olursun.',
        how: ['1. mesaj: hatırlatma ve yenilik. 2. mesaj: kişisel öneri. 3. mesaj: gerekiyorsa indirim.', 'Hangi aşamada kaç kişinin döndüğünü ölç.'],
      },
      {
        t: 'Ayrılanın tercihlerini silme',
        why: 'Netflix\'te iptal ettikten sonra izleme geçmişin ve önerilerin 24 ay saklanıyor. Geri dönen kullanıcı kaldığı yerden devam ediyor; dönüşün önünde engel yok.',
        how: ['Sessiz müşterinin sepetini, favorilerini ve beden bilgisini sakla.', 'Hesabı silmek isteyenin talebine ise her zaman uy.'],
        src: ['netflix'],
      },
      {
        t: 'Geri döneni kaldığı yerden karşıla',
        why: 'Geri dönen müşteriye sıfırdan başlamış gibi davranmak, dönüşü zorlaştırır. Onu tanıdığını göstermek, güven verir.',
        how: ['Geri dönen müşteriye "tekrar hoş geldin" mesajı ve kayıtlı sepetini göster.', 'Son aldığı kategoriye göre öneri sun.'],
        msg: 'Tekrar hoş geldin [Ad]! Sepetin ve beden bilgin seni bekliyor. [ret bilgisi]',
      },
    ],
  },
  {
    title: 'Kişiselleştirme ve içerik',
    intro: 'Herkese aynı mesajı göndermek kolaydır. Doğru kişiye doğru mesajı göndermek, geri getirir.',
    items: [
      {
        t: 'Müşterileri son aldıkları kategoriye göre ayır',
        why: 'Migros, izin veren üyelerin alışveriş alışkanlıklarını analiz edip "Tam Bana Göre" gibi kampanyalarla kişiye özel teklif sunuyor. Sana göre hazırlanmış teklif, herkese giden indirimden daha anlamlı görünür.',
        how: ['En az üç segmentle başla: son kategori, sipariş sıklığı, son sipariş tarihi.', 'Kişiselleştirme için gereken izinleri önceden al.'],
        src: ['migros'],
      },
      {
        t: 'Yanlış teklif gönderme',
        why: 'Kedi maması alan birine köpek maması indirimi göndermek, "beni tanımıyorlar" demektir. Alakasız mesaj, ret oranını artırır.',
        how: ['Her kampanyadan önce hedef segmenti kontrol et.', 'Emin olmadığın durumda genel bir mesaj yerine hiç mesaj göndermemeyi seç.'],
      },
      {
        t: 'Yıl sonunda müşteriye kendi özetini gönder',
        why: 'Spotify Wrapped 2025, ilk 24 saatte 200 milyonun üzerinde kullanıcıya ulaştı ve kampanya boyunca 600 milyonu aşkın kez paylaşıldı. Kendini anlatan içerik, paylaşmak için iyi bir sebep.',
        how: ['Yıl sonunda müşterine kendi alışveriş özetini gönder: en çok aldığı ürün, kazandığı puan.', 'Özeti paylaşılabilir bir görsel olarak tasarla.'],
        msg: '[Ad], seninle geçen yılımız: [N] sipariş, en sevdiğin ürün [Ürün]. Teşekkürler! [ret bilgisi]',
        src: ['spotify', 'spotify2'],
      },
      {
        t: 'Haftalık bir "yeni ürün günü" kur',
        why: 'Bain\'in analizine göre Zara satışlarının %0,5\'inden azını reklama harcıyor; mağazalara haftada iki kez yeni ürün sevkiyatı yapılıyor. Sık ve küçük yenilik, müşteriye tekrar uğramak için sebep verir.',
        how: ['Her hafta aynı gün küçük bir yeni ürün grubu çıkar.', 'Yenilikleri önce eski müşterilerine duyur.'],
        msg: 'Bu haftanın yenileri geldi. Herkesten önce sana haber veriyoruz. [ret bilgisi]',
        src: ['bain', 'georgetown'],
      },
      {
        t: 'Eski müşteri bütçesini kendin test et',
        why: '"Yeni müşteri kazanmak 5 kat pahalı" cümlesi her yerde. HBR\'deki bir yazıya göre oran, hangi çalışmaya baktığına göre 5 ile 25 kat arasında değişiyor; tek bir sihirli rakam yok. En güvenilir rakam, kendi mağazanın rakamı.',
        how: ['Bu ay reklam bütçenin küçük bir kısmını eski müşterilerine ayır.', 'Son 6 ayda alışveriş yapmayanlara hatırlatma gönder ve dönüşü ölç.'],
        src: ['hbr'],
      },
    ],
  },
];

export const SOURCES = {
  nunes: ['Nunes & Drèze (2006), Journal of Consumer Research', 'https://doi.org/10.1086/500480'],
  regan: ['Regan (1971), Journal of Experimental Social Psychology', 'https://doi.org/10.1016/0022-1031(71)90025-4'],
  norton: ['Norton, Mochon & Ariely (2012), Journal of Consumer Psychology', 'https://doi.org/10.1016/j.jcps.2011.08.002'],
  baymard: ['Baymard Institute, Cart Abandonment Rate', 'https://baymard.com/lists/cart-abandonment-rate'],
  sahni: ['Sahni, Narayanan & Kalyanam (2019), Stanford GSB', 'https://www.gsb.stanford.edu/insights/retargeted-advertising-sooner-better-later'],
  wharton: ['Knowledge at Wharton (2006)', 'https://knowledge.wharton.upenn.edu/?p=5310'],
  lewis: ['Lewis, Singh & Fay (2006), Marketing Science', 'https://doi.org/10.1287/mksc.1050.0150'],
  worchel: ['Worchel, Lee & Adewole (1975), JPSP', 'https://doi.org/10.1037/0022-3514.32.5.906'],
  starbucks: ['Starbucks FY26 3. çeyrek yatırımcı sunumu', 'https://s203.q4cdn.com/326826266/files/doc_financials/2026/q3/Q3-FY26-Digital-IR-Dashboard.pdf'],
  kahneman: ['Kahneman & Tversky (1979), Econometrica', 'https://doi.org/10.2307/1914185'],
  duolingo: ['Duolingo Blog (2022)', 'https://blog.duolingo.com/how-duolingo-streak-builds-habit'],
  cirp: ['CIRP (2025), tahmin', 'https://cirpamazon.substack.com/p/amazon-prime-member-spending-is-even'],
  itu: ['Altan (2015), İTÜ yüksek lisans tezi', 'https://polen.itu.edu.tr/items/db4f238b-ca92-4520-9497-14df143b20b5'],
  netflix: ['Netflix Yardım Merkezi', 'https://help.netflix.com/en/node/407'],
  migros: ['Migros 2025 Entegre Faaliyet Raporu', 'https://migroskurumsalstr.blob.core.windows.net/migroskurumsalstr/-migros-tr2025-interaktif-639088646656876356.pdf'],
  spotify: ['Spotify Newsroom', 'https://newsroom.spotify.com/spotify-timeline/'],
  spotify2: ['Spotify 2025 4. çeyrek', 'https://newsroom.spotify.com/2026-02-10/spotify-q4-2025-earnings/'],
  bain: ['Bain & Company, Faster Fashion', 'https://media.bain.com/faster-fashion/speed/'],
  georgetown: ['Georgetown McDonough (2024)', 'https://msb.georgetown.edu/?p=59588'],
  hbr: ['Harvard Business Review (2014)', 'https://hbr.org/2014/10/the-value-of-keeping-the-right-customers'],
};

export const CLOSING = {
  title: 'Bunları mağazana birlikte uygulayalım',
  text: 'Hangi taktikle başlayacağına karar veremediysen, mağazana birlikte bakalım. Ücretsiz bir görüşmede müşteri verine göre ilk üç adımı çıkaralım.',
  button: 'Ücretsiz görüşme planla',
  url: 'https://cal.com/furkan-alumert',
};
