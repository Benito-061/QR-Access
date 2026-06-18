<?php

namespace App\Http\Controllers;

use Illuminate\View\View;

class CeremonyManagementPageController extends Controller
{
    public function index(): View
    {
        return view('pages.gestion-ceremonies', ['activeTab' => 'gestionceremonies']);
    }
}
