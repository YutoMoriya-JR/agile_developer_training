@extends('layouts.app')
@section('title', $report->report_date->format('Y/m/d').'の日報')
@section('content')
<a class="back-link" href="{{ route('reports.index') }}"><i data-lucide="arrow-left" aria-hidden="true"></i>一覧に戻る</a>
<div class="page-heading">
    <div><div class="eyebrow">DAILY REPORT</div><h1>{{ $report->report_date->format('Y/m/d') }}の日報</h1></div>
    @if ($report->user_id === auth()->id())
        <div class="action-group">
            @unless ($report->submitted_at)<form method="POST" action="{{ route('reports.destroy', $report) }}" data-confirm="この下書きを削除しますか？">@csrf @method('DELETE')<button class="icon-button danger" title="下書きを削除" aria-label="下書きを削除"><i data-lucide="trash-2" aria-hidden="true"></i></button></form>@endunless
            <a class="button" href="{{ route('reports.edit', $report) }}"><i data-lucide="pencil" aria-hidden="true"></i>編集する</a>
        </div>
    @endif
</div>
<div class="report-meta"><span class="avatar" aria-hidden="true">{{ mb_substr($report->user->name, 0, 1) }}</span><div><strong>{{ $report->user->name }}</strong><small>{{ $report->user->team?->name ?? '所属未設定' }}</small></div><span class="badge {{ $report->submitted_at ? 'submitted' : 'draft' }}">{{ $report->submitted_at ? '提出済み' : '下書き・本人のみ' }}</span><span class="updated-at">更新 {{ $report->updated_at->format('Y/m/d H:i') }}</span></div>
<div class="detail-grid">
    <article class="report-content">
        <section class="content-section"><h2><i data-lucide="clipboard-check" aria-hidden="true"></i>作業内容・進捗</h2><div class="prose">{{ $report->work !== '' ? $report->work : '未入力' }}</div></section>
        <section class="content-section concerns-section"><h2><i data-lucide="message-circle-question" aria-hidden="true"></i>困りごと・相談事項</h2><div class="prose">{{ $report->concerns ?? '記入なし' }}</div></section>
        <section class="content-section"><h2><i data-lucide="calendar-arrow-up" aria-hidden="true"></i>次の予定</h2><div class="prose">{{ $report->next_plan ?? '記入なし' }}</div></section>
    </article>
    @if ($report->submitted_at)
        <aside class="comments-section"><h2><i data-lucide="messages-square" aria-hidden="true"></i>コメント <span class="count">{{ $report->comments->count() }}</span></h2>
            <div class="comments">
                @forelse ($report->comments as $comment)
                    <article class="comment"><div class="comment-heading"><strong>{{ $comment->user->name }}</strong><time datetime="{{ $comment->created_at->toIso8601String() }}">{{ $comment->created_at->format('m/d H:i') }}</time></div><div class="prose">{{ $comment->body }}</div></article>
                @empty
                    <div class="empty-comments">コメントはまだありません</div>
                @endforelse
            </div>
            <form method="POST" action="{{ route('reports.comments.store', $report) }}" class="stack comment-form">
                @csrf
                <label>コメントを追加<textarea name="body" rows="4" maxlength="5000" required>{{ old('body') }}</textarea></label>
                <button class="button primary" type="submit"><i data-lucide="send" aria-hidden="true"></i>投稿する</button>
            </form>
        </aside>
    @endif
</div>
@endsection