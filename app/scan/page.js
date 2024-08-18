"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { handleAddCard } from "@/app/services/strapiServices";

export default function ScanPage() {
  const { data: session } = useSession();
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardData, setCardData] = useState(null);
  const [cardAdded, setCardAdded] = useState(false);
  const [imagePreview, setImagePreview] = useState(null); // Pour stocker l'aperçu de l'image

  const handleFileChange = (e) => {
    const file = e.target.files[0] || null;
    setSelectedFile(file);
    setCardData(null); // Réinitialise les données de la carte lors d'un nouvel upload
    setError(null); // Réinitialise les erreurs lors d'un nouvel upload
    setCardAdded(false); // Réinitialise l'état d'ajout de la carte

    if (file) {
      setImagePreview(URL.createObjectURL(file)); // Génère l'aperçu de l'image
    } else {
      setImagePreview(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/vision", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.scryfall?.object === "card") {
        setCardData(result.scryfall); // Enregistre les données de la carte provenant de Scryfall
      } else {
        setError("Aucune carte trouvée ou Scryfall n'a pas pu identifier la carte.");
      }
    } catch (err) {
      setError("Erreur lors du téléchargement ou de l'analyse.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCardToDeck = async () => {
    if (session && cardData) {
      await handleAddCard(session, cardData); // Ajoute la carte au deck de l'utilisateur
      setCardAdded(true); // Indique que la carte a été ajoutée
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Scanner une carte Magic: The Gathering</h1>
      <input type="file" onChange={handleFileChange} className="mb-4" />
      
      {/* Aperçu de l'image avant le scan */}
      {imagePreview && (
        <div className="mb-4">
          <p className="text-gray-600 mb-2">Aperçu de l&apos;image :</p>
          <img
            src={imagePreview}
            alt="Aperçu"
            className="w-64 h-auto rounded-lg shadow-lg"
          />
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!selectedFile || loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
      >
        {loading ? "Scan en cours..." : "Scanner la carte"}
      </button>

      {error && <p className="text-red-500">{error}</p>}

      {cardData && (
        <div className="card-info text-center">
          <h2 className="text-xl font-bold mb-2">{cardData.name}</h2>
          <img
            src={cardData.image_uris?.normal}
            alt={cardData.name}
            className="mx-auto rounded-lg mb-4"
          />
          {session && !cardAdded && (
            <button
              onClick={handleAddCardToDeck}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Ajouter cette carte à mon deck
            </button>
          )}
          {cardAdded && <p className="text-green-600 mt-4">Carte ajoutée à votre deck !</p>}
        </div>
      )}
    </div>
  );
}
