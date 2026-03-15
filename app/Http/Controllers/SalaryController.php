<?php

namespace App\Http\Controllers;

use App\Http\Requests\SalaryClass\SalaryClassStoreRequest;
use App\Http\Requests\SalaryClass\SalaryClassUpdateRequest;
use App\Http\Requests\SalaryPayment\SalaryPaymentStoreRequest;
use App\Http\Requests\SalaryPayment\SalaryPaymentUpdateRequest;
use App\Http\Requests\PartTimePayment\PartTimePaymentStoreRequest;
use App\Http\Requests\PartTimePayment\PartTimePaymentUpdateRequest;
use App\Http\Requests\SalaryRate\SalaryRateStoreRequest;
use App\Http\Requests\SalaryRate\SalaryRateUpdateRequest;
use App\Models\PartTime;
use App\Models\PartTimePayment;
use App\Models\SalaryClass;
use App\Models\SalaryPayment;
use App\Models\SalaryRate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response as InertiaResponse;
use Barryvdh\DomPDF\Facade\Pdf;

class SalaryController extends Controller
{
    private function userId(): int
    {
        return (int) auth()->id();
    }

    private function salaryRedirect(string $type, string $message): RedirectResponse
    {
        $section = request()->input('section') ?? request()->query('section');
        $url = route('salary.index');
        if ($section !== null && $section !== '') {
            $url .= (str_contains($url, '?') ? '&' : '?') . 'section=' . urlencode((string) $section);
        }
        return redirect($url)->with('flash', ['type' => $type, 'message' => $message]);
    }

    public function index(): InertiaResponse
    {
        $userId = $this->userId();
        $classes = SalaryClass::query()
            ->where('user_id', $userId)
            ->orderBy('class_name')
            ->get()
            ->map(fn (SalaryClass $c) => [
                'id' => $c->id,
                'class_name' => $c->class_name,
            ]);
        $rates = SalaryRate::query()
            ->where('user_id', $userId)
            ->orderByDesc('id')
            ->get()
            ->map(fn (SalaryRate $r) => [
                'id' => $r->id,
                'rate_date' => $r->rate_date->format('Y-m-d'),
                'hourly_rate' => (float) $r->hourly_rate,
                'urgent_rate' => (float) $r->urgent_rate,
            ]);
        $payments = SalaryPayment::query()
            ->with(['salaryClass', 'salaryRate'])
            ->whereHas('salaryClass', fn ($q) => $q->where('user_id', $userId))
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (SalaryPayment $p) => $this->mapPaymentToRow($p));

        $partTimes = PartTime::query()
            ->orderByDesc('id')
            ->get()
            ->map(function (PartTime $row) {
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
            })
            ->values()
            ->all();

        $partTimePayments = PartTimePayment::query()
            ->with('partTime')
            ->where('user_id', $userId)
            ->orderByDesc('schedule')
            ->orderByDesc('id')
            ->get()
            ->map(function (PartTimePayment $p) {
                $pt = $p->partTime;
                $scheduleFormatted = $p->schedule ? $p->schedule->format('D-d-m-Y') : '—';
                return [
                    'id' => $p->id,
                    'part_time_id' => $p->part_time_id,
                    'student_name' => $pt?->student_name ?? '—',
                    'schedule' => $scheduleFormatted,
                    'schedule_date' => $p->schedule?->format('Y-m-d'),
                    'hours' => (float) $p->hours,
                    'rate_per_hr' => $pt ? (float) $pt->rate_per_hr : 0,
                    'amount_paid' => (float) $p->amount_paid,
                    'formatted_amount' => number_format((float) $p->amount_paid, 2, '.', ','),
                ];
            })
            ->values()
            ->all();

        return $this->inertia('Salary/Index', [
            'classes' => $classes,
            'rates' => $rates,
            'payments' => $payments,
            'partTimes' => $partTimes,
            'partTimePayments' => $partTimePayments,
            'section' => request()->query('section'),
        ]);
    }

    public function storeClass(SalaryClassStoreRequest $request): RedirectResponse
    {
        SalaryClass::query()->create([
            'user_id' => $this->userId(),
            'class_name' => $request->input('class_name'),
            'duration' => 0,
        ]);
        return $this->salaryRedirect('success', 'Class created.');
    }

    public function updateClass(SalaryClassUpdateRequest $request, SalaryClass $salary_class): RedirectResponse
    {
        $this->authorizeOwnership($salary_class);
        $salary_class->update($request->only('class_name'));
        return $this->salaryRedirect('success', 'Class updated.');
    }

    public function destroyClass(SalaryClass $salary_class): RedirectResponse
    {
        $this->authorizeOwnership($salary_class);
        $salary_class->delete();
        return $this->salaryRedirect('delete', 'Class removed.');
    }

    public function storeRate(SalaryRateStoreRequest $request): RedirectResponse
    {
        SalaryRate::query()->create([
            'user_id' => $this->userId(),
            'rate_date' => $request->input('rate_date'),
            'hourly_rate' => $request->input('hourly_rate'),
            'urgent_rate' => $request->input('urgent_rate'),
        ]);
        return $this->salaryRedirect('success', 'Rate created.');
    }

    public function updateRate(SalaryRateUpdateRequest $request, SalaryRate $salary_rate): RedirectResponse
    {
        $this->authorizeOwnership($salary_rate);
        $salary_rate->update($request->only(['rate_date', 'hourly_rate', 'urgent_rate']));
        return $this->salaryRedirect('success', 'Rate updated.');
    }

    public function destroyRate(SalaryRate $salary_rate): RedirectResponse
    {
        $this->authorizeOwnership($salary_rate);
        $salary_rate->delete();
        return $this->salaryRedirect('delete', 'Rate removed.');
    }

    public function storePayment(SalaryPaymentStoreRequest $request): RedirectResponse
    {
        $class = SalaryClass::query()->where('id', $request->input('salary_class_id'))->where('user_id', $this->userId())->firstOrFail();
        $rate = SalaryRate::query()->where('id', $request->input('salary_rate_id'))->where('user_id', $this->userId())->firstOrFail();
        $useUrgent = (bool) $request->input('use_urgent_rate');
        $minutes = (int) $request->input('minutes');
        $hours = $minutes > 0 ? $minutes / 60 : 0;
        $rateAmount = $useUrgent ? (float) $rate->urgent_rate : (float) $rate->hourly_rate;
        $extraAmount = (float) ($request->input('extra_amount') ?? 0);
        $amountPaid = round($rateAmount * $hours + $extraAmount, 2);

        SalaryPayment::query()->create([
            'salary_class_id' => $class->id,
            'salary_rate_id' => $rate->id,
            'employment_type' => in_array($request->input('employment_type'), ['full_time', 'part_time'], true) ? $request->input('employment_type') : 'full_time',
            'schedule' => $request->input('schedule'),
            'time_start' => $request->input('time_start'),
            'time_end' => $request->input('time_end'),
            'minutes' => $minutes,
            'extra_amount' => $extraAmount,
            'use_urgent_rate' => $useUrgent,
            'amount_paid' => $amountPaid,
        ]);
        return $this->salaryRedirect('success', 'Payment created.');
    }

    public function updatePayment(SalaryPaymentUpdateRequest $request, SalaryPayment $salary_payment): RedirectResponse
    {
        $this->authorizePaymentOwnership($salary_payment);
        $class = SalaryClass::query()->where('id', $request->input('salary_class_id'))->where('user_id', $this->userId())->firstOrFail();
        $rate = SalaryRate::query()->where('id', $request->input('salary_rate_id'))->where('user_id', $this->userId())->firstOrFail();
        $useUrgent = (bool) $request->input('use_urgent_rate');
        $minutes = (int) $request->input('minutes');
        $hours = $minutes > 0 ? $minutes / 60 : 0;
        $rateAmount = $useUrgent ? (float) $rate->urgent_rate : (float) $rate->hourly_rate;
        $extraAmount = (float) ($request->input('extra_amount') ?? 0);
        $amountPaid = round($rateAmount * $hours + $extraAmount, 2);

        $salary_payment->update([
            'salary_class_id' => $class->id,
            'salary_rate_id' => $rate->id,
            'employment_type' => in_array($request->input('employment_type'), ['full_time', 'part_time'], true) ? $request->input('employment_type') : $salary_payment->employment_type,
            'schedule' => $request->input('schedule'),
            'time_start' => $request->input('time_start'),
            'time_end' => $request->input('time_end'),
            'minutes' => $minutes,
            'extra_amount' => $extraAmount,
            'use_urgent_rate' => $useUrgent,
            'amount_paid' => $amountPaid,
        ]);
        return $this->salaryRedirect('success', 'Payment updated.');
    }

    public function destroyPayment(SalaryPayment $salary_payment): RedirectResponse
    {
        $this->authorizePaymentOwnership($salary_payment);
        $salary_payment->delete();
        return $this->salaryRedirect('delete', 'Payment removed.');
    }

    public function storePartTimePayment(PartTimePaymentStoreRequest $request): RedirectResponse
    {
        $partTime = PartTime::query()->findOrFail($request->input('part_time_id'));
        $hours = (float) $request->input('hours');
        $amountPaid = round((float) $partTime->rate_per_hr * $hours, 2);

        PartTimePayment::query()->create([
            'user_id' => $this->userId(),
            'part_time_id' => $partTime->id,
            'schedule' => $request->input('schedule'),
            'hours' => $hours,
            'amount_paid' => $amountPaid,
        ]);
        return $this->salaryRedirect('success', 'Part-time payment created.');
    }

    public function updatePartTimePayment(PartTimePaymentUpdateRequest $request, PartTimePayment $part_time_payment): RedirectResponse
    {
        if ($part_time_payment->user_id !== $this->userId()) {
            abort(403);
        }
        $partTime = PartTime::query()->findOrFail($request->input('part_time_id'));
        $hours = (float) $request->input('hours');
        $amountPaid = round((float) $partTime->rate_per_hr * $hours, 2);

        $part_time_payment->update([
            'part_time_id' => $partTime->id,
            'schedule' => $request->input('schedule'),
            'hours' => $hours,
            'amount_paid' => $amountPaid,
        ]);
        return $this->salaryRedirect('success', 'Part-time payment updated.');
    }

    public function destroyPartTimePayment(PartTimePayment $part_time_payment): RedirectResponse
    {
        if ($part_time_payment->user_id !== $this->userId()) {
            abort(403);
        }
        $part_time_payment->delete();
        return $this->salaryRedirect('delete', 'Part-time payment removed.');
    }

    private function authorizeOwnership(SalaryClass|SalaryRate $model): void
    {
        if ($model->user_id !== $this->userId()) {
            abort(403);
        }
    }

    private function authorizePaymentOwnership(SalaryPayment $payment): void
    {
        $payment->load('salaryClass');
        if ($payment->salaryClass->user_id !== $this->userId()) {
            abort(403);
        }
    }

    public function exportPdf(Request $request)
    {
        $validated = $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
            'employment_type' => ['nullable', 'string', 'in:full_time,part_time'],
        ]);
        $from = $validated['from'];
        $to = $validated['to'];
        $employmentType = $validated['employment_type'] ?? null;

        if ($employmentType === 'part_time') {
            return $this->exportPartTimePdf($from, $to);
        }

        $query = SalaryPayment::query()
            ->with(['salaryClass', 'salaryRate'])
            ->whereHas('salaryClass', fn ($q) => $q->where('user_id', $this->userId()))
            ->whereNotNull('schedule')
            ->whereBetween('schedule', [$from, $to])
            ->where('employment_type', 'full_time');

        $payments = $query->orderBy('schedule')
            ->orderBy('time_start')
            ->get()
            ->map(fn (SalaryPayment $p) => $this->mapPaymentToRow($p));

        $totalAmount = $payments->sum('amount_paid_display');
        $filename = 'salary-payments-full-time-' . $from . '-to-' . $to . '.pdf';

        $pdf = Pdf::loadView('salary.full-time-payments-pdf', [
            'payments' => $payments,
            'from' => $from,
            'to' => $to,
            'totalAmount' => $totalAmount,
        ]);
        return $pdf->download($filename);
    }

    private function exportPartTimePdf(string $from, string $to)
    {
        $payments = PartTimePayment::query()
            ->with('partTime')
            ->where('user_id', $this->userId())
            ->whereBetween('schedule', [$from, $to])
            ->orderBy('schedule')
            ->orderBy('id')
            ->get()
            ->map(function (PartTimePayment $p) {
                $pt = $p->partTime;
                $scheduleFormatted = $p->schedule ? $p->schedule->format('D-d-m-Y') : '—';
                return [
                    'schedule' => $scheduleFormatted,
                    'student_name' => $pt?->student_name ?? '—',
                    'hours' => (float) $p->hours,
                    'rate_per_hr' => $pt ? (float) $pt->rate_per_hr : 0,
                    'amount_paid' => (float) $p->amount_paid,
                ];
            })
            ->values()
            ->all();

        $totalAmount = collect($payments)->sum('amount_paid');
        $filename = 'salary-payments-part-time-' . $from . '-to-' . $to . '.pdf';

        $pdf = Pdf::loadView('salary.part-time-payments-pdf', [
            'payments' => $payments,
            'from' => $from,
            'to' => $to,
            'totalAmount' => $totalAmount,
        ]);
        return $pdf->download($filename);
    }

    private function mapPaymentToRow(SalaryPayment $p): array
    {
        $rate = $p->salaryRate;
        $standardRate = $rate ? (float) $rate->hourly_rate : 0;
        $urgentRate = $rate ? (float) $rate->urgent_rate : 0;
        $minutes = (int) ($p->minutes ?? 0);
        $hours = $minutes > 0 ? round($minutes / 60, 4) : 0;
        $rateUsed = $p->use_urgent_rate ? $urgentRate : $standardRate;
        $amountPeriod = round($rateUsed * $hours, 2);
        $extraAmount = (float) ($p->extra_amount ?? 0);
        $amountPaid = round($amountPeriod + $extraAmount, 2);
        $timeStart = $p->time_start ? \Carbon\Carbon::parse($p->time_start)->format('H:i') : null;
        $timeEnd = $p->time_end ? \Carbon\Carbon::parse($p->time_end)->format('H:i') : null;
        $duration = ($timeStart && $timeEnd) ? "{$timeStart} - {$timeEnd}" : '—';
        $scheduleDate = $p->schedule ? $p->schedule->format('Y-m-d') : null;
        $scheduleFormatted = $scheduleDate ? \Carbon\Carbon::parse($scheduleDate)->format('D-m-d-Y') : '—';
        $amountPaidDisplay = $p->amount_paid > 0 ? (float) $p->amount_paid : $amountPaid;

        return [
            'id' => $p->id,
            'salary_class_id' => $p->salary_class_id,
            'salary_rate_id' => $p->salary_rate_id,
            'employment_type' => $p->employment_type ?? 'full_time',
            'class_name' => $p->salaryClass?->class_name,
            'duration' => $duration,
            'schedule' => $scheduleFormatted,
            'schedule_date' => $scheduleDate,
            'time_start' => $timeStart,
            'time_end' => $timeEnd,
            'minutes' => $minutes,
            'hours' => $hours,
            'standard_rate' => $standardRate,
            'urgent_rate' => $urgentRate,
            'extra_amount' => $extraAmount,
            'use_urgent_rate' => (bool) $p->use_urgent_rate,
            'amount_period' => $amountPeriod,
            'amount_paid' => (float) $p->amount_paid,
            'amount_paid_display' => $amountPaidDisplay,
        ];
    }
}
