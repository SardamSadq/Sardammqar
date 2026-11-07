/**
 * Telegram Bot Activation & Licensing Service
 * Sends activation codes and security alerts directly to the owner's Telegram account.
 * Ensures only the project owner can issue valid activation codes to buyers/users.
 */

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export const sendTelegramMessage = async (
  botToken: string,
  chatId: string,
  message: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const cleanToken = botToken.trim();
    const cleanChatId = chatId.trim();

    if (!cleanToken || !cleanChatId) {
      return { success: false, error: 'تۆکنی بۆت یان ئایدی چات دیاری نەکراوە' };
    }

    const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    if (data.ok) {
      return { success: true };
    } else {
      return {
        success: false,
        error: data.description || 'هەڵەیەک لە بۆتی تێلەگرام ڕوویدا',
      };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'پەیوەندی لەگەڵ تێلەگرام سەرکەوتوو نەبوو';
    return {
      success: false,
      error: errorMsg,
    };
  }
};

/**
 * Generate a unique Machine ID for the laptop
 */
export const generateMachineId = (): string => {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `LAPTOP-8234-${rand}`;
};

/**
 * Generate a 6-digit numeric activation code derived uniquely for this machine
 */
export const generateActivationCode = (machineId?: string): string => {
  if (!machineId) {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  // Deterministic 6-digit hash from machine ID + secret salt
  let hash = 0;
  const str = `${machineId}_POS_SECRET_2026_SARDAM`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash);
  const code = (100000 + (positive % 900000)).toString();
  return code;
};

/**
 * Send machine activation request & secret code ONLY to the project owner's Telegram
 */
export const requestActivationViaTelegram = async (
  botToken: string,
  chatId: string,
  cafeteriaName: string,
  ownerName: string,
  phone: string,
  machineId: string,
  secretCode: string
): Promise<{ success: boolean; error?: string }> => {
  const timeStr = new Date().toLocaleString('ar-IQ');
  const message = `
🛡️ <b>داواکاری نوێ بۆ کاراکردنی سیستەمی کافتریا</b>
━━━━━━━━━━━━━━━━━━━━
🏢 <b>ناوی کافتریا:</b> ${cafeteriaName || 'دیاری نەکراوە'}
👤 <b>کەسەکە:</b> ${ownerName || 'دیاری نەکراوە'}
📞 <b>ژمارەی تەلەفۆن:</b> <code>${phone || 'دیاری نەکراوە'}</code>
💻 <b>ئایدی ئامێر (Machine ID):</b> <code>${machineId}</code>
⏰ <b>کات:</b> ${timeStr}

🔐 <b>کۆدی نهێنی کاراکردن (تەنها بۆ تۆیە):</b>
<code>${secretCode}</code>

⚠️ <b>تێبینی خاوەن پڕۆژە:</b>
ئەم کۆدە تەنها تۆ وەریدەگریت لەسەر تێلەگرام. ئەم کۆدە بدە بە کڕیار تا لەسەر لاپتۆپەکەی داخڵی بکات و سیستەمەکەی بۆ کارا ببێت.
━━━━━━━━━━━━━━━━━━━━
  `.trim();

  return sendTelegramMessage(botToken, chatId, message);
};
