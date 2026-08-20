import { GLOSSARY } from "@/lib/parser";

export default function GlossaryPage() {
  return (
    <div>
      <h1 className="font-display text-4xl">Glossar</h1>
      <p className="mt-2 max-w-2xl text-[#7a6e62]">
        Übliche deutsche und englische (US, mit UK-Hinweisen) Häkelabkürzungen, die
        der Parser erkennt.
      </p>
      <div className="mt-8 overflow-hidden rounded-2xl border border-[#eadfce] bg-[#fffbf5]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#f3e6d4] text-[#2c241c]">
            <tr>
              <th className="px-4 py-3">Abkürzung</th>
              <th className="px-4 py-3">Deutsch</th>
              <th className="px-4 py-3">Englisch</th>
            </tr>
          </thead>
          <tbody>
            {GLOSSARY.map((row, index) => (
              <tr key={`${row.abbr}-${index}`} className="border-t border-[#eadfce]">
                <td className="px-4 py-2 font-medium">{row.abbr}</td>
                <td className="px-4 py-2">{row.de}</td>
                <td className="px-4 py-2">{row.en}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
