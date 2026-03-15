<?php
/**
 * Use this as public_html/index.php when document root is locked to public_html
 * and the Laravel app lives in public_html/cardflow.
 * Copy to public_html/index.php and ensure public_html/.htaccess is from Laravel's public/.htaccess
 */

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

$laravelRoot = __DIR__ . '/cardflow';

if (file_exists($maintenance = $laravelRoot . '/storage/framework/maintenance.php')) {
    require $maintenance;
}

require $laravelRoot . '/vendor/autoload.php';

/** @var Application $app */
$app = require_once $laravelRoot . '/bootstrap/app.php';

$app->handleRequest(Request::capture());
