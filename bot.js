const { Telegraf, Markup } = require('telegraf');

// Apna BotFather wala token yahan daalein
const bot = new Telegraf('8853543182:AAFUsZqjCAHWv7RLqejdLChwND5Nz5S5nK8');

// Jab koi user bot ko /start bhejega
bot.start((ctx) => {
  ctx.reply(
    `Namaste ${ctx.from.first_name}! 🤖\n\nFRIDAY AI Assistant download karne ke liye niche click karein:`,
    Markup.inlineKeyboard([
      [Markup.button.callback('📲 Buy FRIDAY AI App (₹49)', 'buy_app')]
    ])
  );
});

// Jab user button dabayega
bot.action('buy_app', (ctx) => {
  ctx.answerCbQuery(); // button ka loading circle band karega
  ctx.reply('Aapne app buy karne ka option chuna hai! (Yahan hum QR code jodenge)');
});

// Bot ko online start karna
bot.launch();
console.log('FRIDAY Bot ab active hai!');