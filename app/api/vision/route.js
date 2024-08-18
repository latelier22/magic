import { NextRequest, NextResponse } from "next/server";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import path from "path";
import fs from "fs";
import fetch from "node-fetch"; // Assure-toi que fetch est disponible

// Configurer le répertoire d'uploads
const UPLOAD_DIR = path.resolve(process.env.ROOT_PATH ?? "", "public/uploads");

// Désactiver le bodyParser de Next.js
export const config = {
  api: {
    bodyParser: false,
  },
};

export const POST = async (req) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (file) {
      // Convertir le fichier en buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Sauvegarder l'image sur le disque (optionnel)
      const filePath = path.resolve(UPLOAD_DIR, file.name);
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR);
      }
      fs.writeFileSync(filePath, buffer);

      // Convertir l'image en base64 sans le préfixe
      const base64Image = buffer.toString("base64");

      // Initialiser le client Google Vision
      const client = new ImageAnnotatorClient({
        keyFilename: path.join(process.cwd(), "app/service-account-key.json"),
      });

      // Appeler l'API Google Vision pour analyser l'image
      const [result] = await client.textDetection({
        image: {
          content: base64Image, // Envoie uniquement la chaîne base64 sans préfixe
        },
      });

      // Extraire les annotations de texte
      const detections = result.textAnnotations[0].description.split("\n");

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
        scryfall: scryfallData, // Inclure la réponse de Scryfall dans le résultat
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
};
