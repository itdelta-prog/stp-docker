import axios from "axios";
import { useState } from "react";
import Layout from "../Components/Layout";

export default function Dashboard() {
    const [keyword, setKeyword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSendKeywordToLLM = async () => {
        setError("");
        setSuccess("");

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
        }
    };

    const handleGenerateGoogleXlsx = async () => {
        try {
            await axios.get(
                `http://nginx:80/trends/sheet?q=${keyword}&cat_url=${success}`
            );
        } catch (e) {
            console.error(e);
            setError("Chyba při vytváření Google Sheet...");
        }
    };

    return (
        <Layout>
            <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 p-4">
                <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
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
                            className="w-full rounded-xl bg-blue-600 px-5 py-3 text-white font-semibold shadow-md transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-400"
                        >
                            Odeslat
                        </button>
                    </div>

                    {error && (
                        <p className="mt-4 text-center text-sm text-red-500">
                            {error}
                        </p>
                    )}

                    {success && (
                        <p className="mt-4 text-center text-sm text-green-600">
                            {success}
                        </p>
                    )}

                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={handleGenerateGoogleXlsx}
                            className="rounded-xl bg-green-600 px-6 py-3 text-white font-semibold shadow-md transition hover:bg-green-700 focus:ring-2 focus:ring-green-400"
                        >
                            Generate Google Sheet
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
