const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROQ_KEY = process.env.GROQ_API_KEY;
const DEVELOPER_CHAT_ID = '7677567697';
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const APPS = {
  aceit: {
    name: 'AceIt 🎓',
    desc_en: 'AI-powered study app with flashcards, quiz mode, battle mode, AI tutor and essay checker.',
    desc_ar: 'تطبيق دراسي مدعوم بالذكاء الاصطناعي مع بطاقات تعليمية ومعلم ذكاء اصطناعي.',
    desc_fr: 'Application d\'étude IA avec flashcards, quiz, mode bataille et correcteur d\'essais.',
    version: '3.1.0',
    download_android: 'https://drive.google.com/uc?export=download&id=19jaPREpXUJ-JR0eUcm0vhBWh6nkipc4C',
  },
  sakina: {
    name: 'Sakina 🌿',
    desc_en: 'Mental wellness app with AI companion, mood tracker, breathing exercises and Islamic content.',
    desc_ar: 'تطبيق صحة نفسية مع مرافق ذكاء اصطناعي وتتبع المزاج وتمارين التنفس ومحتوى إسلامي.',
    desc_fr: 'Application bien-être avec compagnon IA, suivi d\'humeur, exercices de respiration.',
    version: '1.0.0',
  },
};

const USERS = {};

async function sendMessage(chatId, text, keyboard = null) {
  const body = { chat_id: chatId, text, parse_mode: 'HTML' };
  if (keyboard) body.reply_markup = { keyboard, resize_keyboard: true, one_time_keyboard: false };
  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function detectLang(text) {
  const arabicPattern = /[\u0600-\u06FF]/;
  const frenchWords = ['bonjour', 'aide', 'merci', 'comment', 'application', 'problème', 'salut'];
  if (arabicPattern.test(text)) return 'ar';
  if (frenchWords.some(w => text.toLowerCase().includes(w))) return 'fr';
  return 'en';
}

function getWelcome(lang, name) {
  if (lang === 'ar') return `أهلاً ${name}! 👋\n\nأنا بوت دعم تطبيقات ZERROUKI YOUCEF 🤖\n\nيمكنني مساعدتك في:\n🎓 /aceit — معلومات عن AceIt\n🌿 /sakina — معلومات عن Sakina\n📱 /apps — جميع التطبيقات\n🆘 /bug — الإبلاغ عن مشكلة\n📞 /contact — تواصل مع المطور\n❓ /help — مساعدة\n\nأو اكتب سؤالك مباشرة وسأجيبك! 💙`;
  if (lang === 'fr') return `Bonjour ${name}! 👋\n\nJe suis le bot de support des applications ZERROUKI YOUCEF 🤖\n\nJe peux vous aider avec:\n🎓 /aceit — Infos sur AceIt\n🌿 /sakina — Infos sur Sakina\n📱 /apps — Toutes les apps\n🆘 /bug — Signaler un problème\n📞 /contact — Contacter le développeur\n❓ /help — Aide\n\nOu posez votre question directement! 💙`;
  return `Hello ${name}! 👋\n\nI'm the support bot for ZERROUKI YOUCEF apps 🤖\n\nI can help you with:\n🎓 /aceit — AceIt info\n🌿 /sakina — Sakina info\n📱 /apps — All apps\n🆘 /bug — Report a bug\n📞 /contact — Contact developer\n❓ /help — Help\n\nOr just type your question! 💙`;
}

function getHelp(lang) {
  if (lang === 'ar') return `❓ <b>المساعدة</b>\n\n<b>الأسئلة الشائعة:</b>\n\n🔹 <b>كيف أحمّل التطبيق؟</b>\n اكتب /aceit أو /sakina للحصول على رابط التحميل\n\n🔹 <b>التطبيق لا يعمل؟</b>\n اكتب /bug لإرسال تقرير\n\n🔹 <b>كيف أتواصل مع المطور؟</b>\n اكتب /contact\n\n🔹 <b>هل التطبيق مجاني؟</b>\n نعم، AceIt و Sakina مجانيان تماماً 🎉`;
  if (lang === 'fr') return `❓ <b>Aide</b>\n\n<b>Questions fréquentes:</b>\n\n🔹 <b>Comment télécharger?</b>\n Tapez /aceit ou /sakina\n\n🔹 <b>L'app ne fonctionne pas?</b>\n Tapez /bug pour signaler\n\n🔹 <b>Contacter le développeur?</b>\n Tapez /contact\n\n🔹 <b>L'app est-elle gratuite?</b>\n Oui, AceIt et Sakina sont totalement gratuits 🎉`;
  return `❓ <b>Help Center</b>\n\n<b>Frequently Asked Questions:</b>\n\n🔹 <b>How to download?</b>\n Type /aceit or /sakina\n\n🔹 <b>App not working?</b>\n Type /bug to report\n\n🔹 <b>Contact developer?</b>\n Type /contact\n\n🔹 <b>Is it free?</b>\n Yes, AceIt and Sakina are completely free 🎉`;
}

async function getAIReply(question, lang) {
  const systemPrompt = lang === 'ar'
    ? 'أنت مساعد دعم لتطبيقات ZERROUKI YOUCEF. التطبيقات هي: AceIt (تطبيق دراسي بالذكاء الاصطناعي) و Sakina (تطبيق صحة نفسية). أجب بشكل مختصر ومفيد باللغة العربية.'
    : lang === 'fr'
    ? 'Vous êtes un assistant de support pour les apps ZERROUKI YOUCEF: AceIt (app étude IA) et Sakina (app bien-être). Répondez brièvement en français.'
    : 'You are a support assistant for ZERROUKI YOUCEF apps: AceIt (AI study app) and Sakina (mental wellness app). Answer briefly and helpfully in English.';

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_KEY },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 300,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: question }]
    })
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || (lang === 'ar' ? 'عذراً، لم أفهم سؤالك.' : lang === 'fr' ? 'Désolé, je n\'ai pas compris.' : 'Sorry, I didn\'t understand. Please try again!');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });

  try {
    const { message } = req.body;
    if (!message) return res.status(200).json({ ok: true });

    const chatId = message.chat.id;
    const text = message.text || '';
    const name = message.from?.first_name || 'Friend';
    const lang = USERS[chatId]?.lang || detectLang(text);
    USERS[chatId] = { lang, name };

    // Commands
    if (text.startsWith('/start')) {
      await sendMessage(chatId, getWelcome(lang, name));

    } else if (text.startsWith('/aceit')) {
      const app = APPS.aceit;
      const desc = lang === 'ar' ? app.desc_ar : lang === 'fr' ? app.desc_fr : app.desc_en;
      await sendMessage(chatId, `🎓 <b>${app.name}</b>\n\n${desc}\n\n<b>${lang === 'ar' ? 'الإصدار' : 'Version'}:</b> ${app.version}\n\n<b>${lang === 'ar' ? 'الميزات' : lang === 'fr' ? 'Fonctionnalités' : 'Features'}:</b>\n⚡ ${lang === 'ar' ? 'مولّد بطاقات تعليمية' : lang === 'fr' ? 'Générateur de flashcards' : 'AI Flashcard Generator'}\n🧠 ${lang === 'ar' ? 'معلم ذكاء اصطناعي' : lang === 'fr' ? 'Tuteur IA' : 'AI Tutor'}\n⚔️ ${lang === 'ar' ? 'وضع المعركة' : lang === 'fr' ? 'Mode Bataille' : 'Battle Mode'}\n📝 ${lang === 'ar' ? 'مدقق المقالات' : lang === 'fr' ? 'Correcteur d\'essais' : 'Essay Checker'}\n🔒 ${lang === 'ar' ? 'آمن ومشفر' : lang === 'fr' ? 'Sécurisé' : 'Secure & Encrypted'}\n\n📥 <b>${lang === 'ar' ? 'تحميل التطبيق' : lang === 'fr' ? 'Télécharger l\'app' : 'Download App'}:</b>\n🤖 <a href="${app.download_android}">${lang === 'ar' ? 'تحميل للأندرويد' : lang === 'fr' ? 'Télécharger pour Android' : 'Download for Android'}</a>`);

    } else if (text.startsWith('/sakina')) {
      const app = APPS.sakina;
      const desc = lang === 'ar' ? app.desc_ar : lang === 'fr' ? app.desc_fr : app.desc_en;
      await sendMessage(chatId, `🌿 <b>${app.name}</b>\n\n${desc}\n\n<b>${lang === 'ar' ? 'الإصدار' : 'Version'}:</b> ${app.version}\n\n<b>${lang === 'ar' ? 'الميزات' : lang === 'fr' ? 'Fonctionnalités' : 'Features'}:</b>\n💙 ${lang === 'ar' ? 'مرافق عاطفي' : lang === 'fr' ? 'Compagnon émotionnel' : 'AI Emotional Companion'}\n😊 ${lang === 'ar' ? 'تتبع المزاج' : lang === 'fr' ? 'Suivi humeur' : 'Mood Tracker'}\n🧘 ${lang === 'ar' ? 'تمارين التنفس' : lang === 'fr' ? 'Exercices de respiration' : 'Breathing Exercises'}\n🕌 ${lang === 'ar' ? 'محتوى إسلامي' : lang === 'fr' ? 'Contenu islamique' : 'Islamic Content'}\n🤝 ${lang === 'ar' ? 'مجتمع مجهول' : lang === 'fr' ? 'Communauté anonyme' : 'Anonymous Community'}\n\n📥 <b>${lang === 'ar' ? 'قريباً على' : lang === 'fr' ? 'Bientôt sur' : 'Coming soon on'} Play Store & App Store</b>`);

    } else if (text.startsWith('/apps')) {
      await sendMessage(chatId, `📱 <b>${lang === 'ar' ? 'تطبيقاتنا' : lang === 'fr' ? 'Nos Applications' : 'Our Apps'}</b>\n\n🎓 <b>AceIt</b> — /aceit\n${lang === 'ar' ? 'تطبيق دراسي بالذكاء الاصطناعي' : lang === 'fr' ? 'App d\'étude IA' : 'AI Study App'}\n\n🌿 <b>Sakina</b> — /sakina\n${lang === 'ar' ? 'تطبيق الصحة النفسية' : lang === 'fr' ? 'App bien-être' : 'Mental Wellness App'}\n\n${lang === 'ar' ? '🚀 المزيد قادم قريباً...' : lang === 'fr' ? '🚀 Plus à venir bientôt...' : '🚀 More apps coming soon...'}\n\n<i>${lang === 'ar' ? 'بواسطة ZERROUKI YOUCEF' : lang === 'fr' ? 'par ZERROUKI YOUCEF' : 'by ZERROUKI YOUCEF'}</i>`);

    } else if (text.startsWith('/download')) {
      const app = APPS.aceit;
      await sendMessage(chatId, `📥 <b>${lang === 'ar' ? 'تحميل AceIt' : lang === 'fr' ? 'Télécharger AceIt' : 'Download AceIt'}</b>\n\n🤖 <b>Android:</b> <a href="${app.download_android}">${lang === 'ar' ? 'اضغط هنا للتحميل' : lang === 'fr' ? 'Cliquez ici pour télécharger' : 'Click here to download'}</a>\n\n${lang === 'ar' ? '⚠️ ملاحظة: قد تحتاج إلى تفعيل "تثبيت من مصادر غير معروفة" في إعدادات هاتفك.' : lang === 'fr' ? '⚠️ Note: Vous devrez peut-être activer "Sources inconnues" dans vos paramètres.' : '⚠️ Note: You may need to enable "Install from unknown sources" in your phone settings.'}`);

    } else if (text.startsWith('/bug')) {
      const report = text.replace('/bug', '').trim();
      if (!report) {
        await sendMessage(chatId, lang === 'ar' ? '🐛 اكتب وصف المشكلة بعد الأمر:\n/bug وصف المشكلة هنا' : lang === 'fr' ? '🐛 Décrivez le problème après la commande:\n/bug description du problème' : '🐛 Describe the bug after the command:\n/bug your bug description here');
      } else {
        await sendMessage(chatId, lang === 'ar' ? '✅ شكراً! تم إرسال تقرير المشكلة للمطور. سنعمل على إصلاحها قريباً! 🔧' : lang === 'fr' ? '✅ Merci! Rapport envoyé au développeur. Nous allons corriger ça bientôt! 🔧' : '✅ Thank you! Bug report sent to the developer. We will fix it soon! 🔧');
        if (DEVELOPER_CHAT_ID !== 'YOUR_TELEGRAM_CHAT_ID') {
          await sendMessage(DEVELOPER_CHAT_ID, `🐛 <b>Bug Report</b>\n\n<b>From:</b> ${name} (${chatId})\n<b>Lang:</b> ${lang}\n\n<b>Report:</b>\n${report}`);
        }
      }

    } else if (text.startsWith('/contact')) {
      await sendMessage(chatId, `📞 <b>${lang === 'ar' ? 'تواصل معنا' : lang === 'fr' ? 'Nous contacter' : 'Contact Us'}</b>\n\n👨‍💻 <b>${lang === 'ar' ? 'المطور' : lang === 'fr' ? 'Développeur' : 'Developer'}:</b> ZERROUKI YOUCEF\n\n📧 <b>Email:</b> youcefamd90@gmail.com\n\n🐛 <b>${lang === 'ar' ? 'الإبلاغ عن مشكلة' : lang === 'fr' ? 'Signaler un bug' : 'Report a bug'}:</b> /bug\n\n⏱ <b>${lang === 'ar' ? 'وقت الرد' : lang === 'fr' ? 'Temps de réponse' : 'Response time'}:</b> ${lang === 'ar' ? 'خلال 24 ساعة' : lang === 'fr' ? 'Dans les 24 heures' : 'Within 24 hours'}`);

    } else if (text.startsWith('/help')) {
      await sendMessage(chatId, getHelp(lang));

    } else if (text.startsWith('/')) {
      await sendMessage(chatId, lang === 'ar' ? '❓ أمر غير معروف. اكتب /help للمساعدة.' : lang === 'fr' ? '❓ Commande inconnue. Tapez /help pour aide.' : '❓ Unknown command. Type /help for assistance.');

    } else {
      // AI reply for any other message
      const reply = await getAIReply(text, lang);
      await sendMessage(chatId, `🤖 ${reply}\n\n${lang === 'ar' ? 'للمزيد: /help' : lang === 'fr' ? 'Pour plus: /help' : 'For more: /help'}`);
    }

  } catch (e) {
    console.error('Bot error:', e);
  }

  return res.status(200).json({ ok: true });
}
