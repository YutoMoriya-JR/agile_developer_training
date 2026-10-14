@extends('layouts.app')
@section('title', 'ログイン')
@section('content')
<section class="auth-content">
    <div class="section-mark"><i data-lucide="notebook-pen" aria-hidden="true"></i></div>
    <h1>ログイン</h1>
    <form method="POST" action="{{ route('login') }}" class="stack">
        @csrf
        <label>メールアドレス<input type="email" name="email" value="{{ old('email') }}" required autocomplete="username" autofocus></label>
        <label>パスワード<input type="password" name="password" required autocomplete="current-password"></label>
        <button class="button primary wide" type="submit">ログイン<i data-lucide="arrow-right" aria-hidden="true"></i></button>
    </form>
    <a class="auth-link" href="{{ route('register') }}">利用者登録</a>
</section>
@endsection