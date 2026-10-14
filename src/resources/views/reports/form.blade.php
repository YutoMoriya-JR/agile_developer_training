@extends('layouts.app')
@section('title', $report->exists ? '日報の編集' : '日報の作成')
@section('content')
<a class="back-link" href="{{ $report->exists ? route('reports.show', $report) : route('reports.index') }}"><i data-lucide="arrow-left" aria-hidden="true"></i>{{ $report->exists ? '日報に戻る' : '一覧に戻る' }}</a>
<div class="page-heading"><div><div class="eyebrow">{{ $report->exists ? 'EDIT REPORT' : 'NEW REPORT' }}</div><h1>{{ $report->exists ? '日報の編集' : '日報の作成' }}</h1></div><span class="badge {{ $report->submitted_at ? 'submitted' : 'draft' }}">{{ $report->submitted_at ? '提出済み' : '下書き' }}</span></div>
<form method="POST" action="{{ $report->exists ? route('reports.update', $report) : route('reports.store') }}" class="editor stack" data-dirty-check>
    @csrf
    @if ($report->exists) @method('PUT') @endif
    <label class="date-input">対象日 <span class="required">必須</span><input type="date" name="report_date" value="{{ old('report_date', $report->report_date?->format('Y-m-d')) }}" required></label>
    <label>作業内容・進捗 <span class="required">提出時必須</span><textarea name="work" rows="7" maxlength="10000" @if($report->submitted_at) required @endif>{{ old('work', $report->work) }}</textarea></label>
    <label>困りごと・相談事項 <span class="optional">任意</span><textarea name="concerns" rows="4" maxlength="10000">{{ old('concerns', $report->concerns) }}</textarea></label>
    <label>次の予定 <span class="optional">任意</span><textarea name="next_plan" rows="4" maxlength="10000">{{ old('next_plan', $report->next_plan) }}</textarea></label>
    <div class="form-actions">
        <a class="button" href="{{ $report->exists ? route('reports.show', $report) : route('reports.index') }}">キャンセル</a>
        <div class="action-group">
            @unless ($report->submitted_at)<button class="button" type="submit" name="action" value="draft"><i data-lucide="save" aria-hidden="true"></i>下書き保存</button>@endunless
            <button class="button primary" type="submit" name="action" value="submit"><i data-lucide="{{ $report->submitted_at ? 'check' : 'send' }}" aria-hidden="true"></i>{{ $report->submitted_at ? '変更を保存' : '提出する' }}</button>
        </div>
    </div>
</form>
@endsection