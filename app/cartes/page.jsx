"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

// Fonction pour récupérer toutes les cartes depuis Strapi
async function fetchAllCardsFromStrapi() {
  const apiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
  const response = await fetch(`${apiUrl}/api/cards`, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  return data.data || [];
}

// Fonction pour récupérer l'image de la carte depuis Scryfall en utilisant l'ID de la carte
async function fetchCardImageFromScryfall(cardId) {
  const response = await fetch(`https://api.scryfall.com/cards/${cardId}`);
  const data = await response.json();
  return data.image_uris?.normal || "/placeholder.png";
}

export default function ToutesLesCartes() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCardsWithImages = async () => {
      const strapiCards = await fetchAllCardsFromStrapi();
      
      // Pour chaque carte, récupérez l'image depuis Scryfall
      const cardsWithImages = await Promise.all(
        strapiCards.map(async (card) => {
          const imageUrl = await fetchCardImageFromScryfall(card.attributes.cardId);
          return {
            ...card,
            imageUrl,
          };
        })
      );

      setCards(cardsWithImages);
      setLoading(false);
    };

    getCardsWithImages();
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-24">
      <h1 className="text-3xl font-bold mb-8">Toutes les cartes</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div key={card.id} className="border rounded-lg p-4 shadow-lg">
              <Image
                src={card.imageUrl}
                alt={card.attributes.name}
                width={200}
                height={280}
                className="object-cover"
              />
              <h2 className="text-xl font-semibold mt-4">{card.attributes.name}</h2>
              <p className="mt-2 text-gray-600">ID: {card.attributes.cardId}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
