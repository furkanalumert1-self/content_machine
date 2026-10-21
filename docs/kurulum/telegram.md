# Telegram — onay ve bildirim kurulumu

Video hazır olunca Telegram'a **önizleme videosu** + **✅ Onayla / ❌ Reddet** düğmeleri gelir. Hatalar ve token uyarıları da buraya gelir. Bot token'ını ve kimliğinizi **sohbete yazmayın**; yalnızca GitHub Secrets'a ekleyin.

## 1. Bot oluşturun (telefonda, 2 dk)
1. Telegram'da arama → **BotFather** (mavi onay işaretli olanı seçin) → **Başlat / Start**.
2. `/newbot` yazıp gönderin.
3. Bota bir **ad** verin (ör. `Content Machine`).
4. Bir **kullanıcı adı** verin; `bot` ile bitmeli (ör. `furkan_icerik_bot`).
5. BotFather `123456789:AA...` biçiminde bir **token** gönderir. Bu, botun şifresidir — kopyalayın, kimseyle paylaşmayın.
6. BotFather'ın mesajındaki bağlantıdan **kendi botunuzu açın** ve **Başlat / Start**'a basın. (Bunu yapmazsanız bot size mesaj gönderemez.)

## 2. Telegram kimliğinizi (chat ID) bulun
Bilgisayarda tarayıcıya şu adresi yazın; `TOKEN` yerine 5. adımdaki token'ı koyun:
```
https://api.telegram.org/botTOKEN/getUpdates
```
Çıkan metinde `"from":{"id":123456789` gibi bir sayı göreceksiniz — bu sizin kimliğinizdir. Sayfayı kapatın.
(Boş görünürse botunuza bir mesaj daha yazıp sayfayı yenileyin.)

## 3. GitHub'a ekleyin
GitHub → `content_machine` → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Name | Değer |
|---|---|
| `TELEGRAM_BOT_TOKEN` | 1. bölüm 5. adımdaki token |
| `TELEGRAM_CHAT_ID` | 2. bölümdeki sayı |

## 4. Deneyin
GitHub → **Actions** → **Telegram test** → **Run workflow**. Birkaç saniye içinde botunuzdan "bağlantı testi" mesajı gelmeli. Gelmezse işin logunda eksik olan değişkenin adı yazar.

## Onay nasıl çalışır?
1. Video sabah üretilir (~08:45) → önizleme ve düğmeler gelir.
2. **Onayla** → video planlanan saatten sonraki ilk yayın kontrolünde paylaşılır. **Reddet** → asla paylaşılmaz.
3. Düğme basışları yayın kontrolü sırasında işlenir (12:07–14:52 ve 19:07–22:52 arası, 15 dk'da bir). Yani sabah bastığınız onay 12:07'de uygulanır. Panel (ADIM 9) anında uygular.
4. Onaylamazsanız video yayınlanmaz (onaylı modda).

## Güvenlik
- Düğmeler **yalnızca sizin Telegram hesabınızdan** çalışır; başka biri botu bulsa bile basışı yok sayılır.
- Her düğme imzalıdır ve videonun o anki içeriğine bağlıdır. Videoyu panelden düzenlerseniz eski Telegram düğmeleri **geçersiz** olur; yeni içeriği yeniden onaylamanız gerekir.
- Gönderilen her mesajda token/anahtar kalıpları otomatik maskelenir.
- Token sızdığını düşünürseniz: BotFather → `/revoke` → yeni token'ı GitHub'da güncelleyin.
