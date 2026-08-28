import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkCredentials, login } from "../lib/demoAuth";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function LoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (checkCredentials(phone, password)) {
      login();
      navigate("/", { replace: true });
    } else {
      setError("Incorrect phone number or password.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-[10px] border border-line bg-surface p-8">
        <div className="mb-1 text-lg font-semibold text-ink">Your Business</div>
        <p className="mb-6 text-sm text-muted">Sign in to view your dashboard</p>

        <label className="mb-1 block text-sm font-medium text-ink">Phone number</label>
        <Input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08111111111"
          autoFocus
          className="mb-4"
        />

        <label className="mb-1 block text-sm font-medium text-ink">Password</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="mb-4"
        />

        {error && <p className="mb-4 text-sm text-danger">{error}</p>}

        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </form>
    </div>
  );
}
