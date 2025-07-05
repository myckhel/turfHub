<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class WalletController extends Controller
{
  /**
   * Display the wallet dashboard page.
   */
  public function index(): Response
  {
    return Inertia::render('App/Wallet/Index');
  }
}
