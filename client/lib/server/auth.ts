import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { NextAuthOptions } from "next-auth"
import GitHubProvider from "next-auth/providers/github"
import { prisma } from "@lib/server/prisma"
import config from "@lib/config"

const providers: NextAuthOptions["providers"] = [
	GitHubProvider({
		clientId: config.github_client_id,
		clientSecret: config.github_client_secret,
	})
]

export const authOptions: NextAuthOptions = {
	// see https://github.com/prisma/prisma/issues/16117 / https://github.com/shadcn/taxonomy
	adapter: PrismaAdapter(prisma as any),
	session: {
		strategy: "jwt"
	},
	pages: {
		signIn: "/signin"
	},
	providers,
	callbacks: {
		async session({ token, session }) {
			if (token) {
				session.user.id = token.id
				session.user.name = token.name
				session.user.email = token.email
				session.user.image = token.picture
				session.user.role = token.role
			}

			return session
		},
		async jwt({ token, user }) {
			const dbUser = await prisma.user.findFirst({
				where: {
					email: token.email
				}
			})

			if (!dbUser) {
				// TODO: user should be defined? should we invalidate/signout?
				if (user) {
					token.id = user.id
					token.role = "user"
				}
				return token
			}

			return {
				id: dbUser.id,
				name: dbUser.displayName,
				email: dbUser.email,
				picture: dbUser.image,
				role: dbUser.role || "user"
			}
		}
	}
} as const