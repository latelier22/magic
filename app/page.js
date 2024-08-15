"use client";
import Image from "next/image";
import { useState } from "react";
import { useSession } from "next-auth/react";

// Fonction pour tirer un nombre donné de cartes
async function fetchRandomCards(numCards) {
  const fetchedCards = [];
  for (let i = 0; i < numCards; i++) {
    const response = await fetch("https://api.scryfall.com/cards/random");
    const cardData = await response.json();
    fetchedCards.push(cardData);
  }
  return fetchedCards;
}

// Fonction pour rechercher une carte par nom
async function searchCardByName(searchTerm) {
  const response = await fetch(
    `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(searchTerm)}`
  );
  return response.json();
}

// Fonction pour vérifier si le couple user-card existe déjà dans Strapi
async function checkUserCardRelation(userId, cardId, token) {
  const apiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
  const response = await fetch(`${apiUrl}/api/user-cards?populate=*&filters[user][id][$eq]=${userId}&filters[card][id][$eq]=${cardId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  console.log("verif data",data)
  return data.data.length > 0 ? data.data[0] : null;
}

// Fonction pour ajouter une nouvelle relation user-card dans Strapi
async function addUserCardToStrapi(userId, cardId, token) {
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
        card: cardId,
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

// Fonction pour ajouter une carte avec gestion des doublons
async function handleAddCard(session, searchedCard) {
  if (!session || !searchedCard) return;

  const token = session.jwt;
  const userId = session.user.id;

  // Vérifiez si la relation user-card existe déjà
  const existingUserCard = await checkUserCardRelation(userId, searchedCard.id, token);

  if (existingUserCard) {
    const confirmUpdate = confirm(
      `Vous avez déjà cette carte en ${existingUserCard.attributes.count} exemplaire(s). Voulez-vous augmenter le nombre ?`
    );
    if (confirmUpdate) {
      // Augmentez le nombre de cette carte
      await updateUserCardCountInStrapi(
        existingUserCard.id,
        existingUserCard.attributes.count + 1,
        token
      );
      alert("Le nombre d'exemplaires a été mis à jour.");
    }
  } else {
    // Créez une nouvelle relation user-card
    await addUserCardToStrapi(userId, searchedCard.id, token);
    alert("Carte ajoutée avec succès.");
  }
}

// Composant pour la recherche de cartes
function CardSearch({ onSearch, session }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchedCard, setSearchedCard] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    const cardData = await searchCardByName(searchTerm);
    setSearchedCard(cardData);
    setLoading(false);
  };

  const handleAddCard = async () => {
    if (!searchedCard) return;
    await handleAddCard(session, searchedCard);
  };

  return (
    <div className="mb-8">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 p-2 border rounded"
        placeholder="Rechercher une carte par nom"
      />
      <button
        onClick={handleSearch}
        className="mb-4 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Rechercher une carte
      </button>

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
    </div>
  );
}

// Composant pour l'affichage des cartes
function CardGrid({ cards, flipped, onFlipCard }) {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`card ${flipped[index] ? "flipped" : ""}`}
          onClick={() => onFlipCard(index)}
          style={{
            perspective: "1000px",
            cursor: "pointer",
            width: "200px",
            height: "280px",
          }}
        >
          <div
            style={{
              transformStyle: "preserve-3d",
              transition: "transform 0.6s",
              transform: flipped[index] ? "rotateY(180deg)" : "",
              width: "100%",
              height: "100%",
              position: "relative",
            }}
          >
            <Image
              src="/card-back.jpg"
              alt="Card Back"
              width={200}
              height={280}
              style={{
                backfaceVisibility: "hidden",
                position: "absolute",
                top: 0,
                left: 0,
                transform: "rotateY(180deg)",
              }}
            />
            <Image
              className="hover:scale-110"
              src={card.image_uris?.normal}
              alt={card.name}
              width={200}
              height={280}
              style={{
                backfaceVisibility: "hidden",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Composant pour les contrôles (nombre de cartes et tirage)
function CardControls({ numCards, onNumCardsChange, onDrawCards }) {
  return (
    <div className="mb-8 flex flex-col items-center">
      <input
        type="number"
        min="1"
        value={numCards}
        onChange={(e) => onNumCardsChange(parseInt(e.target.value))}
        className="mb-4 p-2 border rounded"
        placeholder="Nombre de cartes"
      />
      <button
        onClick={onDrawCards}
        className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        RETIREZ {numCards} CARTES
      </button>
    </div>
  );
}

// Composant principal Home
export default function Home() {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [numCards, setNumCards] = useState(5); // Nombre de cartes à tirer
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  const handleNumCardsChange = (value) => {
    if (!isNaN(value) && value > 0) {
      setNumCards(value);
    }
  };

  const handleFlipCard = (index) => {
    const newFlipped = [...flipped];
    newFlipped[index] = !newFlipped[index];
    setFlipped(newFlipped);
  };

  const handleDrawCards = async () => {
    setLoading(true);
    const newCards = await fetchRandomCards(numCards);
    setCards([...cards, ...newCards]); // Ajouter les nouvelles cartes aux anciennes
    setFlipped([...flipped, ...Array(numCards).fill(true)]); // Réinitialiser l'état de retournement pour les nouvelles cartes
    setLoading(false);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-24">
      <CardSearch onSearch={searchCardByName} session={session} />

      <CardControls
        numCards={numCards}
        onNumCardsChange={handleNumCardsChange}
        onDrawCards={handleDrawCards}
      />

      {loading ? (
        <div className="spinner">Loading...</div>
      ) : (
        <CardGrid cards={cards} flipped={flipped} onFlipCard={handleFlipCard} />
      )}
    </main>
  );
}
