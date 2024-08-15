import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/Auth";
import { redirect } from "next/navigation";
import Image from "next/image";

async function MesCartesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const apiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;

  // Récupération des user-cards associés à l'utilisateur connecté
  const userCardsRes = await fetch(
    `${apiUrl}/api/user-cards?populate=card&filters[user][id][$eq]=${session.user.id}`,
    {
      headers: {
        Authorization: `Bearer ${session.jwt}`,
      },
      cache: "no-store",
    }
  );

  const userCardsData = await userCardsRes.json();
  const userCards = userCardsData.data || [];

  // Pour chaque user-card, faire une requête à l'API Scryfall pour obtenir l'image
  const userCardsWithImages = await Promise.all(
    userCards.map(async (userCard) => {
      const card = userCard.attributes.card.data.attributes;
      const scryfallRes = await fetch(`https://api.scryfall.com/cards/${card.cardId}`);
      const scryfallData = await scryfallRes.json();
      return {
        ...userCard,
        cardName: card.name,
        imageUrl: scryfallData.image_uris?.normal || "/placeholder.png",
        count: userCard.attributes.count,
      };
    })
  );

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 pt-48">
      <h1 className="text-3xl font-bold mb-4">Mes Cartes</h1>
      {userCardsWithImages.length === 0 ? (
        <p>Vous n&apos;avez aucune carte.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userCardsWithImages.map((userCard) => (
            <div key={userCard.id} className="border rounded-lg p-4 shadow-lg">
              <Image
                src={userCard.imageUrl}
                alt={userCard.cardName}
                width={200}
                height={280}
                className="object-cover"
              />
              <h2 className="text-xl font-semibold mt-4">{userCard.cardName}</h2>
              <p className="mt-2 text-gray-600">NOMBRE EXEMPLAIRES: {userCard.count}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default MesCartesPage;
