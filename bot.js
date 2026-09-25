const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');

// Apna BotFather wala token yahan daalein
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8853543182:AAFUsZqjCAHWv7RLqejdLChwND5Nz5S5nK8';
const bot = new Telegraf(BOT_TOKEN);

// EKQR API Credentials (Environment variables se le ya direct daalein)
const EKQR_API_KEY = process.env.EKQR_API_KEY || '2a3c9149-8ecf-4646-b80d-6a363906d23b';
const EKQR_BASE_URL = 'https://portal.ekqr.in'; // Ya aapka jo exact EKQR API base URL ho

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
  
  await ctx.answerCbQuery();
  
  const chatId = ctx.chat.id;
  const orderId = 'ORD_' + Date.now();

  try {
    ctx.reply('⏳ Aapka payment QR code generate ho raha hai, kripya intezaar karein...');

    // EKQR API call karke order / QR banana
    const response = await axios.post(`${EKQR_BASE_URL}/api/create_order`, {
      key: EKQR_API_KEY,
      client_txn_id: orderId,
      amount: '49',
      p_info: 'FRIDAY AI Base App',
      udf1: chatId.toString(), // Webhook par pehchanne ke liye chatId
      redirect_url: 'https://t.me/FridayAIShopBot' // Payment ke baad redirect URL
    });

    console.log('EKQR Raw Response:', JSON.stringify(response.data, null, 2));

    // Check karein ki response successful hai
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

// Bot ko online start karna
bot.launch();
console.log('FRIDAY Bot ab active hai aur QR system ready hai!');

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));