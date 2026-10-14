@extends('layouts.app')
@section('title', '日報一覧')
@section('content')
<div class="page-heading">
    <div><div class="eyebrow">DAILY REPORTS</div><h1>{{ ['mine' => '自分の日報', 'drafts' => '下書き'][request('view', 'all')] ?? 'みんなの日報' }}</h1></div>
    <a href="{{ route('reports.create') }}" class="button primary"><i data-lucide="plus" aria-hidden="true"></i>日報を書く</a>
</div>
<nav class="tabs" aria-label="日報の表示範囲">
    @foreach (['all' => 'みんなの日報', 'mine' => '自分の日報', 'drafts' => '下書き'] as $key => $label)
        <a href="{{ route('reports.index', ['view' => $key]) }}" @class(['tab', 'active' => request('view', 'all') === $key]) @if(request('view', 'all') === $key) aria-current="page" @endif>{{ $label }}</a>
    @endforeach
</nav>
<form method="GET" action="{{ route('reports.index') }}" class="filters">
    <input type="hidden" name="view" value="{{ request('view', 'all') }}">
    <div class="filter-fields">
        <label class="search-field">キーワード<input type="search" name="q" value="{{ request('q') }}" maxlength="200" placeholder="作業内容・困りごと"></label>
        <label>対象日<input type="date" name="date" value="{{ request('date') }}"></label>
        <label>チーム<select name="team_id"><option value="">すべて</option>@foreach ($teams as $team)<option value="{{ $team->id }}" @selected(request('team_id') == $team->id)>{{ $team->name }}</option>@endforeach</select></label>
        <label>投稿者<select name="user_id"><option value="">すべて</option>@foreach ($users as $user)<option value="{{ $user->id }}" @selected(request('user_id') == $user->id)>{{ $user->name }}</option>@endforeach</select></label>
        <button class="button search-button" type="submit"><i data-lucide="search" aria-hidden="true"></i>検索</button>
    </div>
    <div class="filter-options"><label class="checkbox-label"><input type="checkbox" name="concerns_only" value="1" @checked(request()->boolean('concerns_only'))>困りごとの記入あり</label><a href="{{ route('reports.index', ['view' => request('view', 'all')]) }}" class="text-link">条件をクリア</a></div>
</form>
<div class="results-heading"><span><strong>{{ $reports->total() }}</strong> 件の日報</span><span>対象日の新しい順</span></div>
<section class="report-list" aria-label="日報一覧">
    @forelse ($reports as $report)
        <article class="report-row">
            <div class="report-date"><time datetime="{{ $report->report_date->format('Y-m-d') }}">{{ $report->report_date->format('m/d') }}</time><small>{{ $report->report_date->format('Y') }}</small><span class="badge {{ $report->submitted_at ? 'submitted' : 'draft' }}">{{ $report->submitted_at ? '提出済み' : '下書き' }}</span></div>
            <div class="report-author"><span class="avatar" aria-hidden="true">{{ mb_substr($report->user->name, 0, 1) }}</span><div><strong>{{ $report->user->name }}</strong><small>{{ $report->user->team?->name ?? '所属未設定' }}</small></div></div>
            <div class="report-preview"><a href="{{ route('reports.show', $report) }}" class="report-title">{{ $report->work !== '' ? Str::limit($report->work, 160) : '作業内容は未入力' }}</a>@if ($report->concerns)<div class="concern-preview"><i data-lucide="message-circle-question" aria-hidden="true"></i><span>{{ Str::limit($report->concerns, 90) }}</span></div>@endif</div>
            <div class="row-actions"><span class="comment-count" title="コメント数"><i data-lucide="message-square" aria-hidden="true"></i>{{ $report->comments_count }}<span class="sr-only">件のコメント</span></span><a class="icon-button" href="{{ route('reports.show', $report) }}" aria-label="{{ $report->user->name }}の{{ $report->report_date->format('m月d日') }}の日報を開く" title="日報を開く"><i data-lucide="arrow-up-right" aria-hidden="true"></i></a></div>
        </article>
    @empty
        <div class="empty-state"><i data-lucide="notebook" aria-hidden="true"></i><h2>日報はありません</h2><a href="{{ route('reports.create') }}" class="button"><i data-lucide="plus" aria-hidden="true"></i>日報を書く</a></div>
    @endforelse
</section>
@if ($reports->hasPages())
    <nav class="pagination" aria-label="ページ送り">
        @if ($reports->onFirstPage())<span class="button disabled">前へ</span>@else<a class="button" href="{{ $reports->previousPageUrl() }}" rel="prev">前へ</a>@endif
        <span>{{ $reports->currentPage() }} / {{ $reports->lastPage() }}</span>
        @if ($reports->hasMorePages())<a class="button" href="{{ $reports->nextPageUrl() }}" rel="next">次へ</a>@else<span class="button disabled">次へ</span>@endif
    </nav>
@endif
@endsection