/* =========================================================
   🤖  REDLINE Telegram Bot
   =========================================================
   • يستقبل الطلبات من الموقع (عبر Telegram نفسه أو من PHP)
   • يحفظ السجل في JSON
   • يدعم أوامر سريعة: /start /list /reply /export
   • زر "رد سريع" على كل إشعار
   ========================================================= */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const TOKEN        = process.env.BOT_TOKEN;
const ADMIN_CHAT   = process.env.ADMIN_CHAT_ID;
const COMPANY_NAME = process.env.COMPANY_NAME || 'REDLINE';

if (!TOKEN || TOKEN === 'PUT_YOUR_BOT_TOKEN_HERE') {
  console.error('❌ خطأ: BOT_TOKEN غير معيّن. افتح .env وضع التوكن من @BotFather');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

// ============== تخزين السجل ==============
const DATA_DIR  = path.join(__dirname, 'data');
const LOG_FILE  = path.join(DATA_DIR, 'submissions.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, '[]', 'utf8');

function readLog() {
  try { return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')); }
  catch { return []; }
}
function writeLog(data) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(data, null, 2), 'utf8');
}
function appendLog(entry) {
  const log = readLog();
  entry.id = log.length + 1;
  entry.created_at = new Date().toISOString();
  log.push(entry);
  writeLog(log);
  return entry;
}

// ============== الأوامر ==============
bot.onText(/\/start/, (msg) => {
  const isAdmin = String(msg.chat.id) === String(ADMIN_CHAT);
  const welcome = isAdmin
    ? `👋 <b>أهلاً يا مدير ${COMPANY_NAME}!</b>

أنا البوت الذكي للموقع. أستطيع:

📋 عرض آخر الطلبات
💬 الرد على العملاء مباشرة
📊 إحصائيات سريعة
📁 تصدير كل الطلبات (Excel/JSON)

الأوامر المتاحة:
/list — عرض آخر 5 طلبات
/stats — إحصائيات
/export — تصدير كل الطلبات
/help — المساعدة`
    : `👋 <b>مرحباً بك في ${COMPANY_NAME}!</b>

شكراً لتواصلك معنا. فريقنا سيرد عليك في أقرب وقت.`;

  bot.sendMessage(msg.chat.id, welcome, { parse_mode: 'HTML' });
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id,
    `📚 <b>الأوامر المتاحة:</b>

/start — بدء المحادثة
/list — آخر 5 طلبات (للمسؤول)
/stats — إحصائيات (للمسؤول)
/export — تصدير كل الطلبات (للمسؤول)
` , { parse_mode: 'HTML' });
});

bot.onText(/\/list/, (msg) => {
  if (String(msg.chat.id) !== String(ADMIN_CHAT)) return;
  const log = readLog().slice(-5).reverse();
  if (log.length === 0) {
    return bot.sendMessage(msg.chat.id, '📭 لا توجد طلبات حتى الآن.');
  }
  let text = `📋 <b>آخر ${log.length} طلبات:</b>\n\n`;
  log.forEach((e, i) => {
    text += `${i+1}. <b>${e.type || 'طلب'}</b> — ${e.name || 'بدون اسم'}\n`;
    text += `   📅 ${e.created_at}\n`;
    if (e.whatsapp) text += `   📱 <code>${e.whatsapp}</code>\n`;
    if (e.id) text += `   🆔 #${e.id}\n`;
    text += '\n';
  });
  bot.sendMessage(msg.chat.id, text, { parse_mode: 'HTML' });
});

bot.onText(/\/stats/, (msg) => {
  if (String(msg.chat.id) !== String(ADMIN_CHAT)) return;
  const log = readLog();
  const services = log.filter(e => e.type === 'service_request').length;
  const joins    = log.filter(e => e.type === 'join_team').length;
  const today    = log.filter(e => e.created_at?.startsWith(new Date().toISOString().slice(0,10))).length;

  const text = `📊 <b>إحصائيات ${COMPANY_NAME}</b>

📋 إجمالي الطلبات: <b>${log.length}</b>
🛒 طلبات الخدمات: <b>${services}</b>
👥 طلبات التوظيف: <b>${joins}</b>
📅 طلبات اليوم: <b>${today}</b>
`;

  bot.sendMessage(msg.chat.id, text, { parse_mode: 'HTML' });
});

bot.onText(/\/export/, (msg) => {
  if (String(msg.chat.id) !== String(ADMIN_CHAT)) return;
  const log = readLog();
  if (log.length === 0) return bot.sendMessage(msg.chat.id, '📭 لا توجد بيانات للتصدير.');

  // CSV بسيط
  const keys = Array.from(new Set(log.flatMap(e => Object.keys(e))));
  const csv = [
    keys.join(','),
    ...log.map(e => keys.map(k => JSON.stringify(e[k] ?? '')).join(','))
  ].join('\n');

  const tmpFile = path.join(DATA_DIR, `export_${Date.now()}.csv`);
  fs.writeFileSync(tmpFile, '\uFEFF' + csv, 'utf8'); // BOM for Excel

  bot.sendDocument(msg.chat.id, tmpFile, {}, { filename: `submissions_${Date.now()}.csv` })
    .then(() => setTimeout(() => { try { fs.unlinkSync(tmpFile); } catch {} }, 5000));
});

// ============== زر "رد سريع" على الإشعارات ==============
bot.on('callback_query', async (q) => {
  if (String(q.message.chat.id) !== String(ADMIN_CHAT)) return;

  const data = q.data || '';
  if (data.startsWith('reply:')) {
    const id = data.split(':')[1];
    await bot.answerCallbackQuery(q.id, { text: '✍️ أرسل رسالتك للعميل الآن' });
    // خزّن أن المدير في وضع الرد
    bot._replyMode = bot._replyMode || {};
    bot._replyMode[q.from.id] = id;
    bot.sendMessage(q.message.chat.id,
      `💬 <b>وضع الرد على الطلب #${id}</b>\nأرسل رسالتك الآن (أو /cancel للإلغاء):`,
      { parse_mode: 'HTML' }
    );
  }
});

// ============== معالجة ردود المدير ==============
bot.on('message', async (msg) => {
  if (String(msg.chat.id) !== String(ADMIN_CHAT)) return;
  if (msg.text && msg.text.startsWith('/')) return;

  bot._replyMode = bot._replyMode || {};
  const targetId = bot._replyMode[msg.from.id];

  if (targetId && msg.text) {
    if (msg.text === '/cancel') {
      delete bot._replyMode[msg.from.id];
      return bot.sendMessage(msg.chat.id, '❌ تم إلغاء الرد');
    }

    // حاول ترسل للعميل (لو عندنا chat_id)
    const log = readLog();
    const entry = log.find(e => String(e.id) === String(targetId));
    if (entry && entry.telegram_chat_id) {
      try {
        await bot.sendMessage(entry.telegram_chat_id,
          `💬 <b>رد من ${COMPANY_NAME}:</b>\n\n${msg.text}`,
          { parse_mode: 'HTML' }
        );
        bot.sendMessage(msg.chat.id, `✅ تم إرسال الرد للعميل`);
      } catch (e) {
        bot.sendMessage(msg.chat.id, `⚠️ تعذّر إرسال الرد: ${e.message}`);
      }
    } else {
      bot.sendMessage(msg.chat.id,
        `ℹ️ تم تسجيل الرد محلياً (لا يوجد chat_id للعميل).` +
        `\n\nالرد:\n${msg.text}`);
    }
    delete bot._replyMode[msg.from.id];
  }
});

// ============== استقبال طلب جديد من PHP (عبر HTTP اختياري) ==============
// لو حبيت تستدعي البوت من PHP endpoint آخر
if (process.env.HTTP_PORT) {
  const http = require('http');
  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/submission') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const entry = JSON.parse(body);
          const saved = appendLog(entry);
          // أرسل إشعار للأدمن
          bot.sendMessage(ADMIN_CHAT,
            `🔔 <b>طلب جديد (#${saved.id})</b>\n` +
            `النوع: ${entry.type}\n` +
            `الاسم: ${entry.name || '-'}\n` +
            `واتساب: ${entry.whatsapp || '-'}`,
            {
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [[
                  { text: '💬 رد سريع', callback_data: `reply:${saved.id}` }
                ]]
              }
            }
          );
          res.writeHead(200); res.end('ok');
        } catch (e) {
          res.writeHead(400); res.end('bad');
        }
      });
    } else {
      res.writeHead(404); res.end();
    }
  });
  server.listen(process.env.HTTP_PORT, () => {
    console.log(`🌐 HTTP endpoint on :${process.env.HTTP_PORT}/submission`);
  });
}

// ============== الترحيب ==============
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`🤖 ${COMPANY_NAME} Bot is running...`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
