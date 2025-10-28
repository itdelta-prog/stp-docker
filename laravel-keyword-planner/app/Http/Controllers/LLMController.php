<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenAI;
use OpenAI\Client;

class LLMController extends Controller
{
    protected Client $client;

    public function __construct() {
        $apiKey = config('services.openai.api_key');
        $this->client = OpenAI::client(config('services.openai.api_key'));
    }

    public function sendResponse(Request $request): JsonResponse {
        $validated = $request->validate([
            'keyword' => 'required|string|max:255',
        ]);
        try {
             $keyword = $validated['keyword'];
             $defaultPrompt = "Find category on Heureka.cz with product type $keyword and return ONLY link to it. You should provide link as text. Only link. Nothing more.";
             $response = $this->client->responses()->create([
                 'model' => 'gpt-4o',
                 'input' => $defaultPrompt,
            ]);

            $link =  $response->outputText;
            //$link = "https://mobilni-telefony.heureka.cz/?utm_source=chatgpt.com";
            
            return response()->json([
                'message' => $link,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error'=> $e->getMessage(),
            ], 500);
        }
    }
}
