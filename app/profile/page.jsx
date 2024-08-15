// pages/dashboard.js
"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

function Dashboard() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState(null);
  const router = useRouter();

  const apiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;

  useEffect(() => {
    if (status === "loading") return; // Attendre que la session soit chargée

    if (!session) {
      // Si l'utilisateur n'est pas connecté, redirection vers la page de connexion
      router.push("/login");
    } else {
      // Utiliser le JWT pour récupérer les informations de l'utilisateur depuis Strapi
      fetch(`${apiUrl}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${session.jwt}`,
        },
      })
        .then((res) => res.json())
        .then((data) => setUser(data))
        .catch((err) => {
          console.error(err);
          router.push("/login");
        });
    }
  }, [session, status, router]);

  if (status === "loading" || !user) return <p>Loading...</p>;

  return (
    <div>
      <h1>Welcome, {user.username}!</h1>
      {/* Contenu du tableau de bord */}
    </div>
  );
}

export default Dashboard;
