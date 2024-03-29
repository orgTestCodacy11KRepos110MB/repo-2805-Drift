import { FormEvent, useEffect, useState } from "react"
import styles from "./auth.module.css"
import { useRouter } from "next/router"
import Link from "../link"
import Cookies from "js-cookie"
import useSignedIn from "@lib/hooks/use-signed-in"
import Input from "@components/input"
import Button from "@components/button"
import Note from "@components/note"

const NO_EMPTY_SPACE_REGEX = /^\S*$/
const ERROR_MESSAGE =
	"Provide a non empty username and a password with at least 6 characters"

const Auth = ({ page }: { page: "signup" | "signin" }) => {
	const router = useRouter()

	const [username, setUsername] = useState("")
	const [password, setPassword] = useState("")
	const [serverPassword, setServerPassword] = useState("")
	const [errorMsg, setErrorMsg] = useState("")
	const [requiresServerPassword, setRequiresServerPassword] = useState(false)
	const signingIn = page === "signin"
	const { signin } = useSignedIn()
	useEffect(() => {
		async function fetchRequiresPass() {
			if (!signingIn) {
				const resp = await fetch("/server-api/auth/requires-passcode", {
					method: "GET"
				})
				if (resp.ok) {
					const res = await resp.json()
					setRequiresServerPassword(res.requiresPasscode)
				} else {
					setErrorMsg("Something went wrong. Is the server running?")
				}
			}
		}
		fetchRequiresPass()
	}, [page, signingIn])

	const handleJson = (json: any) => {
		signin(json.token)
		Cookies.set("drift-userid", json.userId)

		router.push("/new")
	}

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		if (
			!signingIn &&
			(!NO_EMPTY_SPACE_REGEX.test(username) || password.length < 6)
		)
			return setErrorMsg(ERROR_MESSAGE)
		if (
			!signingIn &&
			requiresServerPassword &&
			!NO_EMPTY_SPACE_REGEX.test(serverPassword)
		)
			return setErrorMsg(ERROR_MESSAGE)
		else setErrorMsg("")

		const reqOpts = {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ username, password, serverPassword })
		}

		try {
			const signUrl = signingIn
				? "/server-api/auth/signin"
				: "/server-api/auth/signup"
			const resp = await fetch(signUrl, reqOpts)
			const json = await resp.json()
			if (!resp.ok) throw new Error(json.error.message)

			handleJson(json)
		} catch (err: any) {
			setErrorMsg(err.message ?? "Something went wrong")
		}
	}

	return (
		<div className={styles.container}>
			<div className={styles.form}>
				<div className={styles.formContentSpace}>
					<h1>{signingIn ? "Sign In" : "Sign Up"}</h1>
				</div>
				<form onSubmit={handleSubmit}>
					<div className={styles.formGroup}>
						<Input
							type="text"
							id="username"
							value={username}
							onChange={(event) => setUsername(event.currentTarget.value)}
							placeholder="Username"
							required
						/>
						<Input
							type="password"
							id="password"
							value={password}
							onChange={(event) => setPassword(event.currentTarget.value)}
							placeholder="Password"
							required
						/>
						{requiresServerPassword && (
							<Input
								type="password"
								id="server-password"
								value={serverPassword}
								onChange={(event) =>
									setServerPassword(event.currentTarget.value)
								}
								placeholder="Server Password"
								required
							/>
						)}

						<Button buttonType="primary" type="submit">
							{signingIn ? "Sign In" : "Sign Up"}
						</Button>
					</div>
					<div className={styles.formContentSpace}>
						{signingIn ? (
							<p>
								Don&apos;t have an account?{" "}
								<Link colored href="/signup">
									Sign up
								</Link>
							</p>
						) : (
							<p>
								Already have an account?{" "}
								<Link colored href="/signin">
									Sign in
								</Link>
							</p>
						)}
					</div>
					{errorMsg && (
						<Note type="error">
							{errorMsg}
						</Note>
					)}
				</form>
			</div>
		</div>
	)
}

export default Auth
