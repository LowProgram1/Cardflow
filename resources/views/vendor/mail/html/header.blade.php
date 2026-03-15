@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
@if (trim($slot) === 'Cardflow')
<img src="{{ rtrim(config('app.url'), '/') }}/favicon.ico" class="logo" alt="Cardflow" width="120" height="120" style="height: 48px; width: auto; max-height: 48px;">
@elseif (trim($slot) === 'Laravel')
<img src="https://laravel.com/img/notification-logo-v2.1.png" class="logo" alt="Laravel Logo">
@else
{!! $slot !!}
@endif
</a>
</td>
</tr>
