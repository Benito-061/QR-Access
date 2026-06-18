<?php

namespace App\Http\Controllers;

use Illuminate\View\View;

class VerifyPageController extends Controller
{
    public function index(): View
    {
        return view('pages.verify', ['activeTab' => 'verify']);
    }
}
