<?php

use App\Http\Controllers\GoogleAdsController;
use Illuminate\Support\Facades\Route;

Route::prefix('planner')->group(function(){
    Route::get('/historical-metrics/{customer_id}', [GoogleAdsController::class, 'getHistoricalMetrics']);
    Route::get('/customers/list', [GoogleAdsController::class, 'getListOfCustomers']);
    Route::get('/create/customer', [GoogleAdsController::class, 'createCustomer']);
});