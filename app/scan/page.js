"use client";

import { useState } from "react";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardData, setCardData] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0] || null;
    setSelectedFile(file);
    setCardData(null); // Réinitialise les données de la carte lors d'un nouvel upload
    setError(null); // Réinitialise les erreurs lors d'un nouvel upload
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

  return (
    <div className="container">
      <h1>Uploader une image de carte Magic: The Gathering</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!selectedFile || loading}>
        {loading ? "Téléchargement en cours..." : "Uploader"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {cardData && (
        <div className="card-info">
          <h2>{cardData.name}</h2>
          <img src={cardData.image_uris?.normal} alt={cardData.name} />
          <p>{cardData.mana_cost}</p>
          <p>{cardData.type_line}</p>
          <p>{cardData.oracle_text}</p>
        </div>
      )}
    </div>
  );
}
