import type { InputHTMLAttributes } from "react";

export const pseudoError = "Pseudo invalide : 3 à 20 caractères, lettres, chiffres, _ ou -.";

export function Field({
  label,
  id,
  ...input
}: { label: string; id: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} name={id} required {...input} />
    </div>
  );
}

export function ErrorMessage({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="error">
      {message}
    </p>
  );
}
