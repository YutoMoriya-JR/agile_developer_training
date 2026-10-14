<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', '日報一覧') | 日報管理</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>
    <header class="site-header">
        <a class="brand" href="{{ url('/') }}"><span class="brand-icon"><i data-lucide="notebook-pen" aria-hidden="true"></i></span>日報管理</a>
        @auth
            <div class="account">
                <span class="account-name">{{ auth()->user()->name }}<small>{{ auth()->user()->team?->name ?? '所属未設定' }}</small></span>
                <form method="POST" action="{{ route('logout') }}">@csrf<button class="icon-button" title="ログアウト" aria-label="ログアウト"><i data-lucide="log-out" aria-hidden="true"></i></button></form>
            </div>
        @else
            <span class="header-label">DAILY REPORT</span>
        @endauth
    </header>
    <main class="page @guest auth-page @endguest">
        @if (session('status'))
            <div class="notice" role="status"><i data-lucide="circle-check" aria-hidden="true"></i>{{ session('status') }}</div>
        @endif
        @if ($errors->any())
            <div class="errors" role="alert"><strong>入力内容を確認してください。</strong><ul>@foreach ($errors->all() as $error)<li>{{ $error }}</li>@endforeach</ul></div>
        @endif
        @yield('content')
    </main>
    <footer class="site-footer"><span>日報管理</span><span>{{ now()->format('Y') }}</span></footer>
</body>
</html>