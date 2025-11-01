import axios from "axios";
import { useState } from "react";
import Layout from "../Components/Layout";
import { ExternalLinkIcon } from "lucide-react";

export default function Dashboard() {
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState("");
  const [googleSheetError, setGoogleSheetError] = useState("");
  const [success, setSuccess] = useState("");
  const [sheetSuccess, setSheetSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendKeywordToLLM = async () => {
    setError("");
    setGoogleSheetError("");
    setSuccess("");
    setSheetSuccess("");
    setLoading(true);

    try {
      const response = await axios.get(route("llm.send.keyword"), {
        params: { keyword },
      });

      if (response.data?.message) {
        setSuccess(response.data.message);
      }
    } catch (e) {
      if (e.response?.data?.errors?.keyword) {
        setError(e.response.data.errors.keyword[0]);
      } else if (e.response?.data?.message) {
        setError(e.response.data.message);
      } else if (e.response?.data?.error) {
        setError(e.response.data.error);
      } else {
        setError("Došlo k neočekávané chybě.");
      }
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateGoogleXlsx = async () => {
    setGoogleSheetError("");
    setSheetSuccess("");
    setLoading(true);

    try {
      await axios.get(
        `http://tool.nextvision.cz:8181/trends/sheet?q=${keyword}&cat_url=${success}`
      );

      setSheetSuccess("Google Sheet byl úspěšně vytvořen!");
      setTimeout(() => setSheetSuccess(""), 3000);
    } catch (e) {
      console.error(e);
      setGoogleSheetError("Chyba při vytváření Google Sheet...");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl relative">
          {/* Загрузочная полоса */}
          {loading && (
            <div className="absolute top-0 left-0 h-1 w-full bg-blue-200 overflow-hidden rounded-t-2xl">
              <div className="h-full w-1/3 bg-blue-600 animate-[loading_1.2s_ease-in-out_infinite]" />
            </div>
          )}

          <h2 className="mb-6 text-center text-3xl font-bold text-gray-800">
            Vyhledávání podle klíčového slova
          </h2>

          <div className="flex flex-col gap-4">
            <input
              type="text"
              value={keyword}
              placeholder="Zadejte klíčové slovo..."
              className={`w-full rounded-xl border px-4 py-3 text-gray-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring focus:ring-blue-200 ${
                error ? "border-red-400" : "border-gray-300"
              }`}
              onChange={(e) => setKeyword(e.target.value)}
            />

            <button
              onClick={handleSendKeywordToLLM}
              type="button"
              disabled={loading || !keyword}
              className={`w-full rounded-xl px-5 py-3 text-white font-semibold shadow-md transition ${
                loading || !keyword
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400"
              }`}
            >
              {loading ? "Načítání..." : "Odeslat"}
            </button>
          </div>

          {error && (
            <p className="mt-4 text-center text-sm text-red-500">{error}</p>
          )}

          <div className="flex gap-2 py-4">
            <input
              type="text"
              value={success}
              placeholder="url..."
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring focus:ring-blue-200"
              onChange={(e) => setSuccess(e.target.value)}
            />
            <a
              target="_blank"
              href={success || "#"}
              rel="noopener noreferrer"
              className={`shadow-md rounded-md min-w-12 flex items-center justify-center p-2 transition ${
                success
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <ExternalLinkIcon />
            </a>
          </div>

          {sheetSuccess && (
            <p className="mt-4 text-center text-sm text-emerald-600 font-medium">
              {sheetSuccess}
            </p>
          )}

          {googleSheetError && (
            <p className="mt-4 text-center text-sm text-red-500">
              {googleSheetError}
            </p>
          )}

          <div className="mt-6 flex justify-center">
            <button
              onClick={handleGenerateGoogleXlsx}
              disabled={loading || !success}
              className={`rounded-xl px-6 py-3 text-white font-semibold shadow-md transition ${
                loading || !success
                  ? "bg-green-300 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-400"
              }`}
            >
              {loading ? "Vytváření..." : "Generate Google Sheet"}
            </button>
          </div>
        </div>
      </div>

      {/* Анимация полоски загрузки */}
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </Layout>
  );
}
