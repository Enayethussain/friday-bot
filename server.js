const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const express = require('express');

const app = express();
app.use(express.json());

// Express root route taaki Render par "Cannot GET /" error na aaye
app.get('/', (req, res) => {
  res.send('🤖 FRIDAY AI Bot Server is Live and Running!');
});

// Bot Token aur EKQR Credentials
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8853543182:AAFUsZqjCAHWv7RLqejdLChwND5Nz5S5nK8';
const bot = new Telegraf(BOT_TOKEN);

const EKQR_API_KEY = process.env.EKQR_API_KEY || '2a3c9149-8ecf-4646-b80d-6a363906d23b';
const EKQR_BASE_URL = 'https://portal.ekqr.in';

// Jab koi user bot ko /start bhejega
bot.start((ctx) => {
  ctx.reply(
    `Namaste ${ctx.from.first_name}! 🤖\n\nFRIDAY AI Assistant download karne ke liye niche click karein:`,
    Markup.inlineKeyboard([
      [Markup.button.callback('📲 Buy FRIDAY AI App (₹49)', 'buy_app')]
    ])
  );
});

// Jab user button dabayega, tab EKQR se QR generate hoga
bot.action('buy_app', async (ctx) => {
  console.log('>>> BUTTON CLICKED BY:', ctx.from.username || ctx.from.first_name);
  await ctx.answerCbQuery();
  
  const chatId = ctx.chat.id;
  const orderId = 'ORD_' + Date.now();
  const customerName = ctx.from.first_name || 'Valued Customer';

  try {
    ctx.reply('⏳ Aapka payment QR code generate ho raha hai, kripya intezaar karein...');

    const response = await axios.post(`${EKQR_BASE_URL}/api/create_order`, {
      key: EKQR_API_KEY,
      client_txn_id: orderId,
      amount: '49',
      p_info: 'FRIDAY AI Base App',
      customer_name: customerName,
      customer_email: 'customer@gmail.com',
      customer_phone: '9999999999',
      udf1: chatId.toString(),
      redirect_url: 'https://t.me/FridayAIShopBot' // Isey apne bot ke username se badal sakte hain
    });

    console.log('EKQR Raw Response:', JSON.stringify(response.data, null, 2));

    if (response.data && response.data.status === true) {
      const qrImageUrl = response.data.data.upi_qr_code || response.data.data.qr_image;
      const upiIntentUrl = response.data.data.upi_intent;

      if (qrImageUrl) {
        await ctx.replyWithPhoto(qrImageUrl, {
          caption: `💳 **Scan & Pay ₹49**\n\n` +
                   `🆔 Order ID: \`${orderId}\`\n\n` +
                   `Payment hote hi aapko APK file aur License Key turant bhej di jayegi!`,
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.url('🔗 Pay via UPI App', upiIntentUrl || 'https://portal.ekqr.in')]
          ])
        });
      } else {
        await ctx.reply('⚠️ QR image link nahi mila. Kripya baad mein koshish karein.');
      }
    } else {
      await ctx.reply('❌ Payment order create karne mein samasya aayi: ' + (response.data.msg || 'Unknown error'));
    }

  } catch (error) {
    console.error('EKQR Error:', error.response?.data || error.message);
    await ctx.reply('❌ Server error ki wajah se QR generate nahi ho paya. Kripya thodi der baad try karein.');
  }
});

// Bot launch karein
bot.launch();
console.log('FRIDAY Bot ab active hai aur QR system ready hai!');

// Express Server Port (Render ke liye zaroori hai)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));