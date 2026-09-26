const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('🤖 FRIDAY AI Bot Server & License Verifier is Live!');
});

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8853543182:AAFUsZqjCAHWv7RLqejdLChwND5Nz5S5nK8';
const bot = new Telegraf(BOT_TOKEN);

const ADMIN_TELEGRAM_ID = 5964994313; // Apni asli Telegram ID yahan rakhein

// 🌐 AAPKI GOOGLE DRIVE KI DIRECT DOWNLOAD LINK
const APK_DOWNLOAD_URL = 'https://drive.google.com/uc?export=download&id=11ywowcAdRe6VhUZtUHv9XhWFTDXn32FU';

// Apni UPI ID yahan daalein jahan user ₹49 pay karega
const ADMIN_UPI_ID = '8538957454@superyes'; // Apni asli UPI ID yahan daalein

// Active License Keys ka memory store (Server-side validation ke liye)
const activeLicenses = new Set();

bot.start((ctx) => {
  ctx.reply(
    `Namaste ${ctx.from.first_name}! 🤖\n\nFRIDAY AI Assistant (App + Lifetime License) paane ke liye niche click karein:`,
    Markup.inlineKeyboard([
      [Markup.button.callback('📲 Buy FRIDAY AI App (₹49)', 'buy_app')]
    ])
  );
});

// Manual Payment Instructions Action
bot.action('buy_app', async (ctx) => {
  await ctx.answerCbQuery();
  
  await ctx.reply(
    `💳 **Complete Your Payment (₹49)**\n\n` +
    `Kripya niche di gayi UPI ID par **₹49** transfer karein:\n\n` +
    `👉 UPI ID: \`${ADMIN_UPI_ID}\`\n\n` +
    `📸 **Payment karne ke baad payment ka screenshot is chat par bhej dein.**\n` +
    `Screenshot verify hone ke turant baad aapko **License Key** aur **App Download Link** mil jayegi!`,
    { parse_mode: 'Markdown' }
  );
});

// Admin Free License / Verification Command (/getkey)
bot.command('getkey', async (ctx) => {
  if (ctx.from.id !== ADMIN_TELEGRAM_ID) {
    return ctx.reply('❌ Yeh command sirf bot admin ke liye hai!');
  }

  const licenseKey = 'FRIDAY-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString().slice(-4);
  
  // Key ko server memory mein save kar lo taaki app isko verify kar sake
  activeLicenses.add(licenseKey);

  await ctx.reply(
    `🎁 **Secure License Key Generated!**\n\n` +
    `🔑 **License Key:**\n\`${licenseKey}\`\n\n` +
    `📥 **Download FRIDAY AI APK:**\n` +
    `Neeche diye gaye button par click karke app download karein aur ye license key enter karein.\n\n` +
    `🛡️ *Safety Note:* Play Protect warning aane par **'More Details' > 'Install Anyway'** par click karein. App 100% safe hai!`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.url('📥 Download FRIDAY AI APK', APK_DOWNLOAD_URL)]
      ])
    }
  );
});

// 🔒 SERVER-SIDE LICENSE VERIFICATION ENDPOINT (App yahan request bhejegi)
app.post('/api/verify-license', (req, res) => {
  const { licenseKey } = req.body;

  if (!licenseKey) {
    return res.status(400).json({ success: false, message: 'License key is required' });
  }

  // Check karo ki key active database mein hai ya nahi
  if (activeLicenses.has(licenseKey.trim())) {
    return res.status(200).json({ success: true, message: 'License verified successfully!' });
  } else {
    return res.status(401).json({ success: false, message: 'Invalid or expired license key!' });
  }
});

bot.launch();
console.log('FRIDAY Bot & Manual UPI Server is running!');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));