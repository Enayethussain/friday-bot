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

// ⚠️ APNI REAL TELEGRAM NUMERIC ID YAHAN DAALEIN (Jo @userinfobot se milti hai)
const ADMIN_TELEGRAM_ID = 5964994313; // Apni asli ID se replace kar dein

// Jab koi user bot ko /start bhejega
bot.start((ctx) => {
  ctx.reply(
    `Namaste ${ctx.from.first_name}! 🤖\n\nFRIDAY AI Assistant download karne ke liye niche click karein:`,
    Markup.inlineKeyboard([
      [Markup.button.callback('📲 Buy FRIDAY AI App (₹49)', 'buy_app')]
    ])
  );
});

// Sirf Admin ke liye /getkey command (Secure)
bot.command('getkey', async (ctx) => {
  // Check karein ki command chalane wala asli admin hai ya nahi
  if (ctx.from.id !== ADMIN_TELEGRAM_ID) {
    return ctx.reply('❌ Yeh command sirf bot admin ke liye hai!');
  }

  const licenseKey = 'FRIDAY-ADMIN-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString().slice(-4);
  
  await ctx.reply(
    `🎁 **Admin Free License Generated!**\n\n` +
    `🔑 **Your License Key:**\n\`${licenseKey}\`\n\n` +
    `Neeche aapki **FRIDAY AI APK file** di ja rahi hai:`,
    { parse_mode: 'Markdown' }
  );

  try {
    await ctx.replyWithDocument({
      source: './app-release.apk',
      filename: 'FRIDAY_AI.apk'
    });
  } catch (err) {
    console.error('APK Send Error:', err.message);
    await ctx.reply('⚠️ License key mil gayi, lekin APK file bhejte waqt error aaya.');
  }
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

    // EKQR API call with all name, email, and mobile variations
    const response = await axios.post(`${EKQR_BASE_URL}/api/create_order`, {
      key: EKQR_API_KEY,
      client_txn_id: orderId,
      amount: '49',
      p_info: 'FRIDAY AI Base App',
      customer_name: customerName,
      name: customerName,
      customer_email: 'customer@gmail.com',
      email: 'customer@gmail.com',
      customer_mobile: '9876543210',
      mobile: '9876543210',
      customer_phone: '9876543210',
      phone: '9876543210',
      udf1: chatId.toString(),
      redirect_url: 'https://FridayAIShopBot.com' // Payment ke baad redirect URL
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

// ==========================================
// WEBHOOK ROUTE (Payment Successful hone par chalega)
// ==========================================
app.post('/webhook', async (req, res) => {
  try {
    console.log('Webhook Received:', req.body);
    const { status, udf1, client_txn_id, upi_txn_id } = req.body;

    if (status === true || status === 'success' || status === 'SUCCESS') {
      const chatId = udf1;

      if (chatId) {
        const licenseKey = 'FRIDAY-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString().slice(-4);

        await bot.telegram.sendMessage(chatId,
          `🎉 **Payment Successful!**\n\n` +
          `🆔 Order ID: \`${client_txn_id}\`\n` +
          `🔗 UPI Txn ID: \`${upi_txn_id || 'N/A'}\`\n\n` +
          `🔑 **Your Unique License Key:**\n\`${licenseKey}\`\n\n` +
          `Neeche aapki **FRIDAY AI APK file** di ja rahi hai. Isse install karke ye license key enter karein!`,
          { parse_mode: 'Markdown' }
        );

        try {
          await bot.telegram.sendDocument(chatId, {
            source: './app-release.apk',
            filename: 'FRIDAY_AI.apk'
          });
        } catch (apkErr) {
          console.error('APK Send Error:', apkErr.message);
          await bot.telegram.sendMessage(chatId, '⚠️ License key mil gayi hai, lekin APK file bhejte waqt error aaya. Kripya admin se contact karein.');
        }
      }
    }

    res.status(200).json({ status: true, message: 'Webhook handled successfully' });
  } catch (error) {
    console.error('Webhook Error:', error.message);
    res.status(500).json({ status: false, error: error.message });
  }
});

// Bot launch karein
bot.launch();
console.log('FRIDAY Bot ab active hai aur Webhook system ready hai!');

// Express Server Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));