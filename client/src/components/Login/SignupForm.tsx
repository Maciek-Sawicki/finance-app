import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState, useEffect } from "react";

export function SignupForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const [form, setForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    country: "PL",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<any>({});
  const [touched, setTouched] = useState({
    username: false,
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const [isValid, setIsValid] = useState(false);

  const validate = () => {
    const newErrors: any = {};

    if (form.username.length < 3)
      newErrors.username = "Username must be at least 3 characters.";

    if (form.firstName.length < 2)
      newErrors.firstName = "First name must be at least 2 characters.";

    if (form.lastName.length < 2)
      newErrors.lastName = "Last name must be at least 2 characters.";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Invalid email address.";

    if (form.password.length < 8)
      newErrors.password = "Password must be at least 8 characters.";

    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";

    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
  };

  useEffect(() => {
    const anyTouched = Object.values(touched).some((v) => v);
    if (anyTouched) validate();
  }, [form, touched]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched((prev) => ({ ...prev, [e.target.id]: true }));
  };

  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Fill in the form below to create your account
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-1">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            placeholder="janek999"
            value={form.username}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {touched.username && errors.username && (
            <p className="text-red-500 text-xs">{errors.username}</p>
          )}
        </div>

        <div className="grid gap-1">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            placeholder="Jan"
            value={form.firstName}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {touched.firstName && errors.firstName && (
            <p className="text-red-500 text-xs">{errors.firstName}</p>
          )}
        </div>

        <div className="grid gap-1">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            placeholder="Kowalski"
            value={form.lastName}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {touched.lastName && errors.lastName && (
            <p className="text-red-500 text-xs">{errors.lastName}</p>
          )}
        </div>

        <div className="grid gap-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="jan@example.com"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {touched.email && errors.email && (
            <p className="text-red-500 text-xs">{errors.email}</p>
          )}
        </div>

        <div className="grid gap-1">
          <Label htmlFor="country">Country</Label>
          <Input id="country" value={form.country} onChange={handleChange} />
        </div>

        <div className="grid gap-1">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {touched.password && errors.password && (
            <p className="text-red-500 text-xs">{errors.password}</p>
          )}
        </div>

        <div className="grid gap-1">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {touched.confirmPassword && errors.confirmPassword && (
            <p className="text-red-500 text-xs">{errors.confirmPassword}</p>
          )}
        </div>

        <Button
          disabled={!isValid && Object.values(touched).some((v) => v)}
          type="submit"
          className="w-full"
        >
          Create Account
        </Button>
      </div>

      <div className="text-center text-sm">
        Already have an account?{" "}
        <a href="/signin" className="underline underline-offset-4">
          Sign in
        </a>
      </div>
    </form>
  );
}
