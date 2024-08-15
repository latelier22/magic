import CredentialsProvider from 'next-auth/providers/credentials';
import NextAuth from 'next-auth';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const url = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
          const res = await fetch(`${url}/api/auth/local`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              identifier: credentials.identifier,
              password: credentials.password,
            }),
          });

          const data = await res.json();

          if (res.ok && data.jwt) {
            // Requête pour récupérer les données utilisateur avec le JWT
            const userRes = await fetch(`${url}/api/users/me?populate=role`, {
              headers: {
                Authorization: `Bearer ${data.jwt}`,
              },
            });

            const user = await userRes.json();

            if (user.id) {
              console.log('User data fetched from Strapi:', user);

              // Retourne l'objet utilisateur que NextAuth stockera dans le token
              return {
                id: user.id,
                name: user.username, // Assurez-vous que ce champ est bien récupéré
                email: user.email,
                role: user.role?.type || 'authenticated',
                jwt: data.jwt,
              };
            }
          }

          // Si une erreur survient, retournez null pour refuser la connexion
          return null;
        } catch (error) {
          console.error('Error during login:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.email = user.email;
        token.name = user.name; // Ajout du nom
        token.role = user.role;
        token.jwt = user.jwt;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.uid;
        session.user.email = token.email;
        session.user.name = token.name; // Ajout du nom pour qu'il soit accessible dans le menu
        session.user.role = token.role;
        session.jwt = token.jwt;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
