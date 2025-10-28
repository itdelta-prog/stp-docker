<?php

use App\Http\Controllers\LLMController;
use App\Http\Controllers\MainController;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return Redirect::route('dashboard');
});

Route::get('dashboard', [MainController::class, 'index'])->name('dashboard');
Route::get('llm/send/keyword', [LLMController::class, 'sendResponse'])->name('llm.send.keyword');

require_once 'api.php';
