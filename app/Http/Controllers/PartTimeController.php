<?php

namespace App\Http\Controllers;

use App\Http\Requests\PartTime\PartTimeStoreRequest;
use App\Http\Requests\PartTime\PartTimeUpdateRequest;
use App\Models\PartTime;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class PartTimeController extends Controller
{
    public function index(): InertiaResponse
    {
        $items = PartTime::query()
            ->orderByDesc('id')
            ->get()
            ->map(fn (PartTime $row) => $this->mapPartTimeRow($row));

        return Inertia::render('PartTime/Index', [
            'partTimes' => $items->values()->all(),
        ]);
    }

    private function mapPartTimeRow(PartTime $row): array
    {
        $scheduleFormatted = $row->schedule_days
            ? PartTime::formatScheduleDays($row->schedule_days)
            : ($row->schedule ? $row->schedule->format('D-m-d-Y') : '—');

        return [
            'id' => $row->id,
            'student_name' => $row->student_name,
            'schedule' => $row->schedule?->format('Y-m-d'),
            'schedule_days' => $row->schedule_days ?? [],
            'schedule_formatted' => $scheduleFormatted,
            'rate_per_hr' => (float) $row->rate_per_hr,
            'duration_hr' => (float) $row->duration_hr,
            'amount_to_be_paid' => (float) $row->amount_to_be_paid,
            'formatted_amount' => number_format((float) $row->amount_to_be_paid, 2, '.', ','),
        ];
    }

    public function store(PartTimeStoreRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['amount_to_be_paid'] = PartTime::computeAmount(
            (float) $data['rate_per_hr'],
            (float) $data['duration_hr']
        );
        $data['schedule_days'] = array_values(array_unique($data['schedule_days']));
        PartTime::query()->create($data);

        return redirect()->route('salary.index', ['section' => 'classes-rates'])->with('flash', [
            'type' => 'success',
            'message' => 'Part-time entry created.',
        ]);
    }

    public function update(PartTimeUpdateRequest $request, PartTime $partTime): RedirectResponse
    {
        $data = $request->validated();
        $data['amount_to_be_paid'] = PartTime::computeAmount(
            (float) $data['rate_per_hr'],
            (float) $data['duration_hr']
        );
        $data['schedule_days'] = array_values(array_unique($data['schedule_days']));
        $partTime->update($data);

        return redirect()->route('salary.index', ['section' => 'classes-rates'])->with('flash', [
            'type' => 'success',
            'message' => 'Part-time entry updated.',
        ]);
    }

    public function destroy(PartTime $partTime): RedirectResponse
    {
        $partTime->delete();

        return redirect()->route('salary.index', ['section' => 'classes-rates'])->with('flash', [
            'type' => 'delete',
            'message' => 'Part-time entry removed.',
        ]);
    }
}
