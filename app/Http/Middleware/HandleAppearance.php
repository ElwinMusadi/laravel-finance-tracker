<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\Response;

class HandleAppearance
{
    /** @var array<int, string> */
    private const FONT_FAMILIES = ['ibm-plex', 'inter', 'manrope'];

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        View::share('appearance', $request->cookie('appearance') ?? 'system');
        View::share('fontFamily', $this->fontFamily($request));

        return $next($request);
    }

    private function fontFamily(Request $request): string
    {
        $fontFamily = $request->cookie('font_family');

        return in_array($fontFamily, self::FONT_FAMILIES, true)
            ? $fontFamily
            : 'ibm-plex';
    }
}
