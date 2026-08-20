import { PatternForm } from "@/components/PatternForm";

export default function NewPatternPage() {
  return (
    <div>
      <h1 className="font-display text-4xl">Neue Anleitung</h1>
      <p className="mt-2 max-w-2xl text-[#7a6e62]">
        Name festlegen, Text hineinkopieren oder eine PDF hochladen. Danach unter
        Korrigieren anpassen, falls der Parser etwas falsch gelesen hat.
      </p>
      <div className="mt-8">
        <PatternForm />
      </div>
    </div>
  );
}
