<?php

namespace App\Http\Controllers;

use App\Models\DailyReport;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class DailyReportController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'team_id' => ['nullable', 'integer', 'exists:teams,id'],
            'q' => ['nullable', 'string', 'max:200'],
            'concerns_only' => ['nullable', 'boolean'],
            'view' => ['nullable', Rule::in(['all', 'mine', 'drafts'])],
        ]);
        $query = DailyReport::visibleTo($request->user())->with('user.team')->withCount('comments');

        if ($request->filled('date')) {
            $query->whereDate('report_date', $filters['date']);
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', $filters['user_id']);
        }
        if ($request->filled('team_id')) {
            $query->whereHas('user', fn ($users) => $users->where('team_id', $filters['team_id']));
        }
        if ($request->filled('q')) {
            $pattern = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $filters['q']).'%';
            $query->where(fn ($search) => $search
                ->whereRaw("work LIKE ? ESCAPE '!'", [$pattern])
                ->orWhereRaw("concerns LIKE ? ESCAPE '!'", [$pattern]));
        }
        if ($request->boolean('concerns_only')) {
            $query->whereNotNull('concerns')->where('concerns', '<>', '');
        }
        if ($request->input('view') === 'mine') {
            $query->where('user_id', $request->user()->id);
        }
        if ($request->input('view') === 'drafts') {
            $query->whereNull('submitted_at');
        }

        return view('reports.index', [
            'reports' => $query->orderByDesc('report_date')->orderByDesc('id')->paginate(15)->withQueryString(),
            'teams' => Team::orderBy('name')->get(),
            'users' => User::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function create()
    {
        return view('reports.form', ['report' => new DailyReport(['report_date' => today()])]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $report = new DailyReport($data);
        $report->user()->associate($request->user());
        $report->submitted_at = $request->input('action') === 'submit' ? now() : null;
        $this->save($report);

        return to_route('reports.show', $report)->with('status', $report->submitted_at ? '日報を提出しました。' : '下書きを保存しました。');
    }

    public function show(Request $request, DailyReport $report)
    {
        abort_unless($report->submitted_at || $report->user_id === $request->user()->id, 404);
        $report->load(['user.team', 'comments' => fn ($comments) => $comments->with('user')->oldest()->orderBy('id')]);

        return view('reports.show', compact('report'));
    }

    public function edit(Request $request, DailyReport $report)
    {
        abort_unless($report->user_id === $request->user()->id, 403);

        return view('reports.form', compact('report'));
    }

    public function update(Request $request, DailyReport $report)
    {
        abort_unless($report->user_id === $request->user()->id, 403);
        DB::transaction(function () use ($request, $report) {
            $locked = DailyReport::whereKey($report->id)->lockForUpdate()->firstOrFail();
            $locked->fill($this->validated($request, $locked));
            if (! $locked->submitted_at && $request->input('action') === 'submit') {
                $locked->submitted_at = now();
            }
            $this->save($locked);
        });

        return to_route('reports.show', $report)->with('status', '日報を保存しました。');
    }

    public function destroy(Request $request, DailyReport $report)
    {
        abort_unless($report->user_id === $request->user()->id, 403);
        DB::transaction(function () use ($report) {
            $locked = DailyReport::whereKey($report->id)->lockForUpdate()->firstOrFail();
            abort_if($locked->submitted_at, 403);
            $locked->delete();
        });

        return to_route('reports.index')->with('status', '下書きを削除しました。');
    }

    public function comment(Request $request, DailyReport $report)
    {
        abort_unless($report->submitted_at, 404);
        $data = $request->validate(['body' => ['required', 'string', 'max:5000']]);
        $comment = $report->comments()->make($data);
        $comment->user()->associate($request->user());
        $comment->save();

        return to_route('reports.show', $report)->with('status', 'コメントを投稿しました。');
    }

    private function validated(Request $request, ?DailyReport $report = null): array
    {
        $publishing = $report?->submitted_at || $request->input('action') === 'submit';
        $data = $request->validate([
            'action' => ['required', Rule::in(['draft', 'submit'])],
            'report_date' => ['required', 'date_format:Y-m-d', Rule::unique('daily_reports')
                ->where('user_id', $request->user()->id)->ignore($report?->id)],
            'work' => [$publishing ? 'required' : 'nullable', 'string', 'max:10000'],
            'concerns' => ['nullable', 'string', 'max:10000'],
            'next_plan' => ['nullable', 'string', 'max:10000'],
        ]);
        unset($data['action']);
        $data['work'] = $data['work'] ?? '';

        return $data;
    }

    private function save(DailyReport $report): void
    {
        try {
            $report->save();
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages(['report_date' => 'この日付の日報はすでに存在します。']);
        }
    }
}