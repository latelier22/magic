// app/sets/page.js
import Image from "next/image";

// Fonction pour récupérer les sets depuis l'API Scryfall
async function fetchSets() {
  const response = await fetch("https://api.scryfall.com/sets");
  const data = await response.json();
  return data.data || [];
}

export default async function SetsPage() {
  const sets = await fetchSets();

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Magic: The Gathering Sets</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sets.map((set) => (
          <div key={set.id} className="border rounded-lg p-4 shadow-lg text-center">
            <div className="mb-4">
              <img
                src={set.icon_svg_uri}
                alt={set.name}
                className="mx-auto h-16 w-16 filter invert"
                style={{ height: "64px", width: "64px" }}
              />
            </div>
            <h2 className="text-xl font-semibold mb-2">{set.name}</h2>
            <p className="text-gray-600 mb-2">Released: {set.released_at}</p>
            <p className="text-gray-600 mb-4">Type: {set.set_type}</p>
            <a
              href={set.scryfall_uri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View on Scryfall
            </a>
          </div>
        ))}
      </div>
    </main>
  );
}
