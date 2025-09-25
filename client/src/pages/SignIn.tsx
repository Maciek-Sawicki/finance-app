import * as React from "react";
import { LoginForm } from "@/components/Login/login-form"; // popraw ścieżkę do komponentu ShadCN
import { useAuth } from "../contexts/AuthContext";
import { CircleDollarSign } from "lucide-react";
import background from "../assets/background.svg";

const SignIn: React.FC = () => {
  const { signIn } = useAuth();

  // Funkcja handleLogin, wywoływana po submit
  const handleLogin: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault(); // zatrzymuje domyślny submit formularza
  
    const form = e.currentTarget; // formularz
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
  
    try {
      await signIn(email, password); // wywołanie funkcji z AuthContext
      window.location.href = "/"; // redirect po zalogowaniu
    } catch (err) {
      console.error(err);
      alert("Błąd logowania");
    }
  };
  

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Lewa część formularza */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-md">
              <CircleDollarSign className="h-4 w-4" />
            </div>
            Cashora Finance
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            {/* ShadCN LoginForm z podpiętym handleLogin */}
            <LoginForm onSubmit={handleLogin} />
          </div>
        </div>
      </div>

      {/* Prawa część grafiki */}
      <div className="bg-muted relative hidden lg:block">
        <img
          src={background}
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
};

export default SignIn;
