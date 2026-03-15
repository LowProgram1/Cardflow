<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Allowed Hosts
    |--------------------------------------------------------------------------
    |
    | Set to a list of allowed host names (e.g. ['cardflow.example.com', 'www.cardflow.example.com'])
    | to reject requests with any other Host header. Prevents host header injection.
    | Leave empty or null to allow any host (e.g. for local development).
    |
    */
    'allowed_hosts' => array_filter(explode(',', (string) env('ALLOWED_HOSTS', ''))),

];
