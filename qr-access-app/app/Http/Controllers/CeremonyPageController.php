<?php

namespace App\Http\Controllers;

use Illuminate\View\View;

class CeremonyPageController extends Controller
{
    public function index(): View
    {
        return view('pages.ceremonie', ['activeTab' => 'ceremonie']);
    }
}
