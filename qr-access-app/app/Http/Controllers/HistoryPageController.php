<?php

namespace App\Http\Controllers;

use Illuminate\View\View;

class HistoryPageController extends Controller
{
    public function index(): View
    {
        return view('pages.history', ['activeTab' => 'history']);
    }
}
