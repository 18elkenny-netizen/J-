
const { findUid } = global.utils;
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const moment = require("moment-timezone");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
	config: {
		name: "wanted2",
		version: "1.1",
		author: "DARK SYSTEM",
		countDown: 5,
		role: 0,
		description: "Créer une affiche de recherche",
		category: "fun",
		guide: {
			fr:
				"{pn} @mention : rechercher un membre du groupe\n" +
				"{pn} lien Facebook : rechercher un profil\n" +
				"{pn} UID : rechercher avec un identifiant"
		}
	},

	onStart: async function ({ api, event, args, message }) {
		try {
			let targetID = null;

			// 1. Recherche par mention
			if (Object.keys(event.mentions || {}).length > 0) {
				targetID = Object.keys(event.mentions)[0];
			}

			// 2. Recherche par réponse à un message
			else if (event.messageReply?.senderID) {
				targetID = event.messageReply.senderID;
			}

			// 3. Recherche par lien Facebook
			else if (args[0]?.startsWith("http")) {
				targetID = await findUid(args[0]);
			}

			// 4. Recherche par UID
			else if (/^\d+$/.test(args[0] || "")) {
				targetID = args[0];
			}

			if (!targetID) {
				return message.reply(
					"╔═══━━━〔 🩸 WANTED SYSTEM 〕━━━═══╗\n\n" +
					"Utilisation :\n\n" +
					"♛ ¥wanted2 @membre\n" +
					"♛ ¥wanted2 lien Facebook\n" +
					"♛ ¥wanted2 UID\n\n" +
					"Ou réponds à un message avec ¥wanted2.\n\n" +
					"╚══════════════════════════════╝"
				);
			}

			// Récupération des informations du profil
			const userInfo = await new Promise((resolve, reject) => {
				api.getUserInfo(targetID, (err, info) => {
					if (err) return reject(err);
					resolve(info?.[targetID] || null);
				});
			});

			if (!userInfo) {
				return message.reply(
					"❌ Impossible de récupérer les informations de ce profil."
				);
			}

			const name = userInfo.name || "Unknown Character";
			const avatarURL =
				userInfo.thumbSrc ||
				userInfo.profileUrl ||
				userInfo.photoUrl;

			if (!avatarURL) {
				return message.reply(
					"❌ Photo de profil indisponible pour ce personnage."
				);
			}

			// Téléchargement de la photo
			const response = await axios.get(avatarURL, {
				responseType: "arraybuffer",
				timeout: 15000
			});

			const avatar = await loadImage(Buffer.from(response.data));

			// Création du Canvas
			const width = 900;
			const height = 1200;

			const canvas = createCanvas(width, height);
			const ctx = canvas.getContext("2d");

			// Fond sombre
			const gradient = ctx.createLinearGradient(
				0, 0, width, height
			);

			gradient.addColorStop(0, "#100707");
			gradient.addColorStop(0.5, "#351010");
			gradient.addColorStop(1, "#080505");

			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, width, height);

			// Décoration
			ctx.strokeStyle = "#9d2929";
			ctx.lineWidth = 12;
			ctx.strokeRect(25, 25, width - 50, height - 50);

			ctx.strokeStyle = "#d6a14b";
			ctx.lineWidth = 3;
			ctx.strokeRect(43, 43, width - 86, height - 86);

			// Titre
			ctx.textAlign = "center";
			ctx.fillStyle = "#d6a14b";
			ctx.font = "bold 100px Georgia";
			ctx.fillText("WANTED", width / 2, 155);

			ctx.fillStyle = "#b52b2b";
			ctx.font = "bold 36px Georgia";
			ctx.fillText("DEAD OR ALIVE", width / 2, 215);

			// Portrait
			const avatarX = 225;
			const avatarY = 270;
			const avatarW = 450;
			const avatarH = 450;

			ctx.fillStyle = "#d6a14b";
			ctx.fillRect(
				avatarX - 9,
				avatarY - 9,
				avatarW + 18,
				avatarH + 18
			);

			ctx.drawImage(
				avatar,
				avatarX,
				avatarY,
				avatarW,
				avatarH
			);

			// Nom du profil
			ctx.fillStyle = "#f1d49a";
			ctx.font = "bold 43px Georgia";

			let displayName = name;

			while (
				ctx.measureText(displayName).width > 760 &&
				displayName.length > 5
			) {
				displayName = displayName.slice(0, -1);
			}

			if (displayName !== name) {
				displayName += "...";
			}

			ctx.fillText(displayName, width / 2, 790);

			// Prime aléatoire
			const bounty =
				Math.floor(Math.random() * 9000000) + 1000000;

			ctx.fillStyle = "#c83b32";
			ctx.font = "bold 35px Georgia";
			ctx.fillText("BOUNTY", width / 2, 870);

			ctx.fillStyle = "#e8c77e";
			ctx.font = "bold 65px Georgia";
			ctx.fillText(
				"$" + bounty.toLocaleString("en-US"),
				width / 2,
				950
			);

			// Signature
			ctx.fillStyle = "#d6a14b";
			ctx.font = "italic 28px Georgia";
			ctx.fillText(
				"THE SHADOW NEVER SLEEPS",
				width / 2,
				1040
			);

			ctx.fillStyle = "#9c2525";
			ctx.font = "bold 25px Georgia";
			ctx.fillText(
				"DARK SYSTEM • OFFICIAL NOTICE",
				width / 2,
				1110
			);

			// Création du fichier temporaire
			const cacheDir = path.join(__dirname, "cache");
			await fs.ensureDir(cacheDir);

			const imagePath = path.join(
				cacheDir,
				`wanted2_${targetID}_${Date.now()}.png`
			);

			await fs.writeFile(
				imagePath,
				canvas.toBuffer("image/png")
			);

			// Envoi dans le groupe actuel
			message.reply(
				{
					body:
						"╔═══━━━〔 🩸 𝐖𝐀𝐍𝐓𝐄𝐃 〕━━━═══╗\n\n" +
						"👤 PERSONNAGE : " + name + "\n" +
						"🆔 UID : " + targetID + "\n" +
						"💰 PRIME : $" +
						bounty.toLocaleString("en-US") + "\n\n" +
						"☠️ Le DARK SYSTEM a identifié sa cible.\n\n" +
						"╚══════════════════════════════╝",
					attachment: fs.createReadStream(imagePath)
				},
				() => fs.remove(imagePath).catch(() => {})
			);

		}
		catch (error) {
			console.error("[WANTED2 ERROR]", error);

			return message.reply(
				"❌ Une erreur est survenue pendant la recherche du profil."
			);
		}
	}
};
        
