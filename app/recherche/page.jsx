"use client";
import Image from "next/image";
import { useState } from "react";
import { useSession } from "next-auth/react";

// Fonction pour rechercher une carte par nom
async function searchCardByName(searchTerm) {
  const response = await fetch(
    `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(searchTerm)}`
  );
  return response.json();
}

// Fonction pour vérifier si la carte existe déjà dans Strapi
async function checkCardInStrapi(cardId, token) {
  const apiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
  const response = await fetch(
    `${apiUrl}/api/cards?filters[cardId][$eq]=${cardId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const data = await response.json();
  return data.data.length > 0 ? data.data[0] : null;
}

// Fonction pour ajouter la carte dans Strapi si elle n'existe pas encore
async function addCardToStrapi(card, token) {
  const apiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
  const response = await fetch(`${apiUrl}/api/cards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      data: {
        cardId: card.id,
        name: card.name,
        image_uris: card.image_uris,
      },
    }),
  });
  return response.json();
}

// Fonction pour vérifier si la carte est déjà associée à l'utilisateur
async function checkUserCardRelation(userId, cardId, token) {
  const apiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
  const response = await fetch(
    `${apiUrl}/api/user-cards?populate=*&filters[user][id][$eq]=${userId}&filters[card][id][$eq]=${cardId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const data = await response.json();
  return data.data.length > 0 ? data.data[0] : null;
}

// Fonction pour ajouter une nouvelle relation user-card dans Strapi
async function addUserCardToStrapi(userId, card, token) {
  const apiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
  const response = await fetch(`${apiUrl}/api/user-cards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      data: {
        user: userId,
        card: card.id,
        count: 1,
      },
    }),
  });
  return response.json();
}

// Fonction pour mettre à jour le count d'une relation user-card existante
async function updateUserCardCountInStrapi(userCardId, newCount, token) {
  const apiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
  const response = await fetch(`${apiUrl}/api/user-cards/${userCardId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      data: {
        count: newCount,
      },
    }),
  });
  return response.json();
}

export default function Recherche() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchedCard, setSearchedCard] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    const cardData = await searchCardByName(searchTerm);
    setSearchedCard(cardData);
    console.log(cardData)
    setLoading(false);
  };

  const handleAddCard = async () => {
    if (!searchedCard || !session) return;

    const token = session.jwt;
    const userId = session.user.id;

    // Étape 1: Vérifier si la carte existe déjà dans Strapi
    let existingCard = await checkCardInStrapi(searchedCard.id, token);

    // Étape 2: Si la carte n'existe pas, l'ajouter
    if (!existingCard) {
      const newCard = await addCardToStrapi(searchedCard, token);
      existingCard = newCard.data;
    }

    // Étape 3: Vérifier si la carte est déjà associée à l'utilisateur
    const existingUserCard = await checkUserCardRelation(userId, existingCard.id, token);

    if (existingUserCard) {
      const confirmUpdate = confirm(
        `Vous avez déjà cette carte en ${existingUserCard.attributes.count} exemplaire(s). Voulez-vous augmenter le nombre ?`
      );
      if (confirmUpdate) {
        await updateUserCardCountInStrapi(
          existingUserCard.id,
          existingUserCard.attributes.count + 1,
          token
        );
        alert("Le nombre d'exemplaires a été mis à jour.");
      }
    } else {
      await addUserCardToStrapi(userId, existingCard, token);
      alert("Carte ajoutée avec succès.");
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-24">
      <div className="mb-8">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mySelect mb-4 p-2 border rounded"
          placeholder="Rechercher une carte par nom"
        />
        <button
          onClick={handleSearch}
          className="mb-4 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Rechercher une carte
        </button>
      </div>

      {loading && <p>Loading...</p>}

      {searchedCard && (
        <div>
          <Image
            src={searchedCard.image_uris?.normal}
            alt={searchedCard.name}
            width={300}
            height={420}
            className="mx-auto"
          />
          <p className="text-center text-lg mt-2">{searchedCard.name}</p>
          {session && (
            <button
              onClick={handleAddCard}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Ajouter la carte
            </button>
          )}
        </div>
      )}
    </main>
  );
}
