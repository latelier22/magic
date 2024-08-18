import { NextResponse } from "next/server";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import path from "path";
import fs from "fs";
import fetch from "node-fetch"; // Assure-toi que fetch est disponible

// Configurer le répertoire temporaire pour stocker la clé JSON
const TMP_DIR = path.join('/tmp');
const serviceAccountKeyPath = path.join(TMP_DIR, 'service-account-key.json');

// Désactiver le bodyParser de Next.js
export const config = {
  api: {
    bodyParser: false,
  },
};

// Recréer le fichier JSON à partir de la variable d'environnement
function recreateServiceAccountKey() {
  if (!process.env.GOOGLE_CLOUD_KEY_BASE64) {
    throw new Error("La variable d'environnement GOOGLE_CLOUD_KEY_BASE64 est manquante.");
  }

  const decodedKey = Buffer.from(process.env.GOOGLE_CLOUD_KEY_BASE64, 'base64').toString('utf-8');
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR);
  }
  fs.writeFileSync(serviceAccountKeyPath, decodedKey);
}

export async function POST(req) {
  try {
    // Recréer la clé JSON à partir de la variable d'environnement
    recreateServiceAccountKey();

    // Lire l'image envoyée par le frontend
    const formData = await req.formData();
    const file = formData.get("file");

    if (file) {
      // Convertir le fichier en buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Convertir l'image en base64 sans le préfixe
      const base64Image = buffer.toString("base64");

      // Initialiser le client Google Vision
      const client = new ImageAnnotatorClient({
        keyFilename: serviceAccountKeyPath,
      });

      // Appeler l'API Google Vision pour analyser l'image
      const [result] = await client.textDetection({
        image: {
          content: base64Image,
        },
      });

      // Extraire les annotations de texte
      const detections = result.textAnnotations[0]?.description.split("\n") || [];

      // Organiser les informations dans un format JSON plus structuré
      const titre = detections[0] || "";

      // Faire une requête vers l'API Scryfall avec le titre extrait
      const scryfallResponse = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(titre)}`);
      const scryfallData = await scryfallResponse.json();

      // Construire la réponse finale avec les données extraites et la réponse de Scryfall
      const jsonResponse = {
        success: true,
        titre,
        description: detections.slice(2, 6).join(" ") || "",
        citation: detections[7] || "",
        auteur: detections[8] || "",
        footer: detections.slice(10).join(" ") || "",
        scryfall: scryfallData,
      };

      return NextResponse.json(jsonResponse);
    } else {
      return NextResponse.json({
        success: false,
        message: "No file uploaded",
      });
    }
  } catch (error) {
    console.error("Erreur lors de l'analyse de l'image :", error);
    return NextResponse.json({
      success: false,
      message: "Error processing image",
    });
  }
}
