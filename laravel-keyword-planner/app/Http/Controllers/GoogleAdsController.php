<?php

namespace App\Http\Controllers;

use App\Services\GoogleKeywordPlannerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class GoogleAdsController extends Controller
{

    public function __construct(protected GoogleKeywordPlannerService $googleKeywordPlannerService) {}

    public function getHistoricalMetrics(Request $request, string $customer_id)
    {
        try {
            $validated = $request->validate([
                'keywords' => 'required|string',
            ]);
            $keywords = array_map(fn($e) => trim($e), explode(',', $validated['keywords']));
            $result = $this->googleKeywordPlannerService->generateKeywordHistoricalMetrics($customer_id, $keywords);
            return response()->json($result);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            throw $e;
            return response()->json([
                'error_message' => $e->getMessage(),
            ], 500);
        }
    }

    public function getListOfCustomers(): JsonResponse 
    {
        return response()->json(
            $this->googleKeywordPlannerService->listCustomers(),
        );
    }

    public function createCustomer(Request $request) 
    {
        try {
            $validated = $request->validate([
                'descriptive_name' => 'required|string|max:255',
            ]);
    
            $res = $this->googleKeywordPlannerService->createCustomer($validated);
            return response()->json([
                'message' => $res,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error_message' => $e->getMessage(),
            ]);
        }
    }
}
