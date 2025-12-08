import * as React from "react"
import { SignupForm } from "@/components/Login/SignupForm"
import { useAuth } from "@/contexts/AuthContext"
import background from "../assets/background.svg"
import { CircleDollarSign } from "lucide-react"

const SignupPage: React.FC = () => {
  const { signUp } = useAuth()

  const handleSignup: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()

    const form = e.currentTarget
    const username = form.username.value
    const firstName = form.firstName.value
    const lastName = form.lastName.value
    const email = form.email.value
    const country = form.country.value
    const password = form.password.value
    const confirmPassword = form.confirmPassword.value

    if (password !== confirmPassword) {
      alert("Hasła nie są takie same!")
      return
    }

    try {
      await signUp({ username, firstName, lastName, email, country, password })
      alert("Konto utworzone! Możesz się zalogować.")
      window.location.href = "/signin"
    } catch (err) {
      console.error(err)
      alert("Błąd rejestracji")
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-md">
              <CircleDollarSign className="h-4 w-4" />
            </div>
            Cashora Finance
          </a>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignupForm onSubmit={handleSignup} />
          </div>
        </div>
      </div>

      <div className="bg-muted relative hidden lg:block">
        <img
          src={background}
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}

export default SignupPage
