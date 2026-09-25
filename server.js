const express = require('express');
const { Telegraf } = require('telegraf');

const app = express();
app.use(express.json());

// Apne actual tokens yahan daalein (ya environment variables use karein)
const BOT_TOKEN = '8853543182:AAFUsZqjCAHWv7RLqejdLChwND5Nz5S5nK8';
const bot = new Telegraf(BOT_TOKEN);

// Webhook endpoint jo EKQR se payment success hone par hit hoga
app.post('/api/payment-webhook', async (req, res) => {
  const payload = req.body;

  // Check karein ki payment successful hai ya nahi
  if (payload.status === 'success' || payload.status === 'COMPLETED') {
    const chatId = payload.udf1; // Jo chatId humne QR banate waqt bheji thi
    
    // Unique License Key generate karein
    const licenseKey = 'FRIDAY-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();

    try {
      // User ko chat mein APK file aur License key bhej dein
      await bot.telegram.sendDocument(chatId, {
        source: './FRIDAY_AI.apk', // Aapke folder mein APK file honi chahiye
        filename: 'FRIDAY_AI.apk'
      }, {
        caption: 
          `🎉 **Payment Successful!**\n\n` +
          `📥 Aapka FRIDAY AI APK upar bhej diya gaya hai.\n\n` +
          `🔑 **Aapki Secret License Key:**\n\`${licenseKey}\`\n\n` +
          `⚠️ *Dhyan dein:* Yeh key sirf aapke phone par lock hogi. Kisi aur ko share na karein.`
      });

    } catch (err) {
      console.error('APK send karne mein error:', err);
    }

    return res.status(200).json({ status: 'success' });
  }

  res.status(200).json({ status: 'ignored' });
});

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server port ${PORT} par chal raha hai!`);
});