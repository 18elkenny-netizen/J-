
const axios = require("axios");

const sessions = {};
const stats = {};
const cooldowns = {};

const QUIZ_URL = "https://raw.githubusercontent.com/SAIFUL-404-ST/quiz-api/main/quizzes.json";

const REWARD_COINS = 500;
const REWARD_EXP = 121;
const SESSION_TIME = 60000;
const DAILY_LIMIT = 15;
const RESET_TIME = 12 * 60 * 60 * 1000;

module.exports = {
  config: {
    name: "quiz",
    aliases: ["qz", "quizlist", "qzlist"],
    version: "4.0",
    author: "Dark System",
    countDown: 5,
    role: 0,
    category: "game",
    guide: {
      en: "{pn} quiz - Start quiz\n{pn} quizlist - Show statistics\nReply: answer a/b/c/d"
    }
  },

  loadQuizzes: async function () {
    try {
      const res = await axios.get(QUIZ_URL, {
        timeout: 15000
      });

      const data = res.data;

      // Your JSON contains { questions: [...] }
      if (!data || !Array.isArray(data.questions)) {
        console.error("Invalid quiz JSON structure.");
        return [];
      }

      return data.questions.filter(q =>
        q &&
        typeof q.text === "string" &&
        q.options &&
        typeof q.options === "object" &&
        typeof q.answer === "string" &&
        ["a", "b", "c", "d"].includes(q.answer.toLowerCase()) &&
        ["a", "b", "c", "d"].every(
          key => typeof q.options[key] === "string"
        )
      );

    } catch (error) {
      console.error("Quiz loading error:", error.message);
      return [];
    }
  },

  onStart: async function ({ api, event, args }) {
    const userId = event.senderID;
    const threadID = event.threadID;
    const now = Date.now();

    // Detect quizlist and qzlist aliases
    const commandText = (event.body || "").trim().toLowerCase();
    const commandParts = commandText.split(/\s+/);
    const invokedCommand = commandParts.length > 1
      ? commandParts[commandParts.length - 1]
      : "";

    const input = (args[0] || invokedCommand || "").toLowerCase();

    // Statistics
    if (["quizlist", "qzlist"].includes(input)) {
      if (Object.keys(stats).length === 0) {
        return api.sendMessage(
          "📊 Aucun joueur n'a encore joué au quiz.",
          threadID,
          event.messageID
        );
      }

      let text = "╔══════ 📊 QUIZ STATS ══════╗\n\n";

      for (const uid in stats) {
        text += `👤 ${uid}\n`;
        text += `🏆 Wins: ${stats[uid].won || 0}\n`;
        text += `🎮 Played: ${stats[uid].played || 0}\n\n`;
      }

      text += "╚════════════════════╝";

      return api.sendMessage(text, threadID, event.messageID);
    }

    // Cooldown
    if (cooldowns[userId] && now - cooldowns[userId] < 5000) {
      return api.sendMessage(
        "⏱️ Attends 5 secondes avant de recommencer.",
        threadID,
        event.messageID
      );
    }

    // Prevent multiple simultaneous quizzes
    if (sessions[userId]) {
      return api.sendMessage(
        "⚠️ Tu as déjà un quiz en cours ! Réponds avant d'en commencer un autre.",
        threadID,
        event.messageID
      );
    }

    // Initialize statistics
    if (!stats[userId]) {
      stats[userId] = {
        played: 0,
        won: 0,
        lastReset: now
      };
    }

    const userStats = stats[userId];

    // Reset after 12 hours
    if (now - userStats.lastReset >= RESET_TIME) {
      userStats.played = 0;
      userStats.won = 0;
      userStats.lastReset = now;
    }

    // Play limit
    if (userStats.played >= DAILY_LIMIT) {
      return api.sendMessage(
        "❌ Tu as atteint ta limite de 15 quiz. Réessaie après 12 heures.",
        threadID,
        event.messageID
      );
    }

    cooldowns[userId] = now;

    // Load questions
    const questions = await this.loadQuizzes();

    if (questions.length === 0) {
      return api.sendMessage(
        "❌ Impossible de charger les questions du quiz. Vérifie la connexion ou le fichier JSON.",
        threadID,
        event.messageID
      );
    }

    // Select random question
    const question = questions[
      Math.floor(Math.random() * questions.length)
    ];

    const sessionId = `${userId}_${now}_${Math.random()}`;

    sessions[userId] = {
      sessionId,
      question,
      threadID,
      startTime: now
    };

    userStats.played += 1;

    let msg = "╔══════ 🎯 QUIZ TIME ══════╗\n\n";
    msg += `❓ ${question.text}\n\n`;

    for (const key of ["a", "b", "c", "d"]) {
      msg += `${key.toUpperCase()}. ${question.options[key]}\n`;
    }

    msg += "\n━━━━━━━━━━━━━━━━━━";
    msg += "\n💬 Réponds avec : answer a";
    msg += "\n⏳ Temps : 60 secondes";
    msg += "\n🏆 Récompense : 500 coins + 121 EXP";
    msg += "\n╚════════════════════╝";

    api.sendMessage(
      msg,
      threadID,
      (error, info) => {
        if (error || !info) {
          delete sessions[userId];
          console.error("Quiz message error:", error);
          return;
        }

        global.GoatBot.onReply.set(info.messageID, {
          type: "reply",
          commandName: this.config.name,
          author: userId,
          messageID: info.messageID,
          correctAnswer: question.answer.toLowerCase(),
          sessionId
        });

        // Auto-expire after 60 seconds
        setTimeout(() => {
          const currentSession = sessions[userId];

          if (
            currentSession &&
            currentSession.sessionId === sessionId
          ) {
            delete sessions[userId];

            api.sendMessage(
              "⏰ Temps écoulé ! Ton quiz a expiré.",
              threadID
            );
          }
        }, SESSION_TIME);
      },
      event.messageID
    );
  },

  onReply: async function ({ event, api, Reply, usersData }) {
    const userId = event.senderID;

    // Only the original player can answer
    if (userId !== Reply.author) {
      return api.sendMessage(
        "❌ Ce quiz ne t'appartient pas !",
        event.threadID,
        event.messageID
      );
    }

    const session = sessions[userId];

    if (!session || session.sessionId !== Reply.sessionId) {
      return api.sendMessage(
        "⏰ Cette session de quiz a expiré. Lance un nouveau quiz.",
        event.threadID,
        event.messageID
      );
    }

    // Accept: answer a OR simply a
    const userReply = (event.body || "")
      .trim()
      .toLowerCase()
      .replace(/^answer\s+/, "");

    if (!["a", "b", "c", "d"].includes(userReply)) {
      return api.sendMessage(
        "⚠️ Réponse invalide ! Écris : answer a, answer b, answer c ou answer d.",
        event.threadID,
        event.messageID
      );
    }

    // Close session
    delete sessions[userId];

    try {
      api.unsendMessage(Reply.messageID);

      if (userReply === Reply.correctAnswer) {
        const userData = await usersData.get(userId);

        await usersData.set(userId, {
          money: (userData.money || 0) + REWARD_COINS,
          exp: (userData.exp || 0) + REWARD_EXP,
          data: userData.data || {}
        });

        if (!stats[userId]) {
          stats[userId] = {
            played: 1,
            won: 1,
            lastReset: Date.now()
          };
        } else {
          stats[userId].won += 1;
        }

        return api.sendMessage(
          `╔══════ 🏆 CORRECT ══════╗\n\n` +
          `✅ Bonne réponse !\n\n` +
          `💰 +${REWARD_COINS} coins\n` +
          `⭐ +${REWARD_EXP} EXP\n\n` +
          `╚════════════════════╝`,
          event.threadID,
          event.messageID
        );
      }

      return api.sendMessage(
        `❌ Mauvaise réponse !\n\n` +
        `✅ Bonne réponse : ${Reply.correctAnswer.toUpperCase()}\n` +
        `🎮 Lance un nouveau quiz pour réessayer.`,
        event.threadID,
        event.messageID
      );

    } catch (error) {
      console.error("Quiz reward error:", error);

      return api.sendMessage(
        "❌ Une erreur est survenue pendant le traitement de ta réponse.",
        event.threadID,
        event.messageID
      );
    }
  }
};
