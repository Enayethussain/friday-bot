const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const express = require('express');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('🤖 FRIDAY AI Bot Server is Live and Running!');
});

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8853543182:AAFUsZqjCAHWv7RLqejdLChwND5Nz5S5nK8';
const bot = new Telegraf(BOT_TOKEN);

const EKQR_API_KEY = process.env.EKQR_API_KEY || '2a3c9149-8ecf-4646-b80d-6a363906d23b';
const EKQR_BASE_URL = 'https://portal.ekqr.in';

const ADMIN_TELEGRAM_ID = 5964994313; // Apni asli Telegram ID yahan rakhein

bot.start((ctx) => {
  ctx.reply(
    `Namaste ${ctx.from.first_name}! 🤖\n\nFRIDAY AI Assistant download karne ke liye niche click karein:`,
    Markup.inlineKeyboard([
      [Markup.button.callback('📲 Buy FRIDAY AI App (₹49)', 'buy_app')]
    ])
  );
});

bot.command('getkey', async (ctx) => {
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
    await ctx.reply('⚠️ License key mil gayi, lekin APK file bhejte waqt error aaya. Make sure app-release.apk project folder mein ho.');
  }
});

bot.action('buy_app', async (ctx) => {
  console.log('>>> BUTTON CLICKED BY:', ctx.from.username || ctx.from.first_name);
  await ctx.answerCbQuery();
  
  const chatId = ctx.chat.id;
  const orderId = 'ORD_' + Date.now();
  const customerName = ctx.from.first_name || 'Valued Customer';

  try {
    ctx.reply('⏳ Aapka payment link generate ho raha hai, kripya intezaar karein...');

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
      redirect_url: 'https://t.me/FridayAIShopBot'
    });

    console.log('EKQR Raw Response:', JSON.stringify(response.data, null, 2));

    if (response.data && (response.data.status === true || response.data.status === 'success' || response.data.status === 'SUCCESS')) {
      const d = response.data.data;
      const paymentUrl = d.payment_url; // EKQR se mila payment link

      if (paymentUrl) {
        await ctx.reply(
          `💳 **Complete Your Payment (₹49)**\n\n` +
          `🆔 Order ID: \`${orderId}\`\n\n` +
          `Neeche diye gaye button par click karke payment karein. Payment hote hi aapko APK aur License Key mil jayegi!`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.url('🔗 Open Payment Page', paymentUrl)],
              [Markup.button.url('📲 Pay via PhonePe', d.upi_intent?.phonepe_link || paymentUrl)]
            ])
          }
        );
      } else {
        await ctx.reply('⚠️ Payment link nahi mil paya. Kripya baad mein koshish karein.');
      }
    } else {
      await ctx.reply('❌ Payment order create karne mein samasya aayi: ' + (response.data.msg || response.data.message || 'Unknown error'));
    }

  } catch (error) {
    console.error('EKQR Error:', error.response?.data || error.message);
    await ctx.reply('❌ Server error ki wajah se payment link generate nahi ho paya.');
  }
});

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
          await bot.telegram.sendMessage(chatId, '⚠️ License key mil gayi hai, lekin APK file bhejte waqt error aaya. Project folder mein app-release.apk honi zaroori hai.');
        }
      }
    }

    res.status(200).json({ status: true, message: 'Webhook handled successfully' });
  } catch (error) {
    console.error('Webhook Error:', error.message);
    res.status(500).json({ status: false, error: error.message });
  }
});

bot.launch();
console.log('FRIDAY Bot ab active hai aur Webhook system ready hai!');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));