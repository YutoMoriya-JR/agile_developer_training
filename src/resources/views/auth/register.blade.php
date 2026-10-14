@extends('layouts.app')
@section('title', '利用者登録')
@section('content')
<section class="auth-content">
    <div class="section-mark"><i data-lucide="user-round-plus" aria-hidden="true"></i></div>
    <h1>利用者登録</h1>
    <form method="POST" action="{{ route('register') }}" class="stack">
        @csrf
        <label>氏名<input name="name" value="{{ old('name') }}" maxlength="100" required autocomplete="name" autofocus></label>
        <label>所属チーム<input name="team" value="{{ old('team') }}" maxlength="100" required autocomplete="organization"></label>
        <label>メールアドレス<input type="email" name="email" value="{{ old('email') }}" maxlength="255" required autocomplete="username"></label>
        <label>パスワード（12文字以上）<input type="password" name="password" minlength="12" required autocomplete="new-password"></label>
        <label>パスワード確認<input type="password" name="password_confirmation" minlength="12" required autocomplete="new-password"></label>
        <button class="button primary wide" type="submit">登録する<i data-lucide="arrow-right" aria-hidden="true"></i></button>
    </form>
    <a class="auth-link" href="{{ route('login') }}">ログインへ戻る</a>
</section>
@endsection