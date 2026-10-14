import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { gsap } from 'gsap';
import {
    STORAGE_KEY, DEFAULT_PRIZE, SIZES, numberLimit, lineLimit, createGame,
    completedLines, reachNumbers, winnerIndexes, visibleDrawn, drawNumber,
    confirmAllPlayers, parseGame,
} from './bingo-game';
import '../css/bingo.css';

function loadSession() {
    let raw = null;
    try {
        raw = localStorage.getItem(STORAGE_KEY);
        return { game: raw === null ? null : parseGame(raw), raw, error: null, blocked: false };
    } catch (error) {
        console.error('Bingo: failed to restore game', error);
        return { game: null, raw, error: `ゲームを再開できません。${error.message}`, blocked: true };
    }
}

function Arrow() {
    return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function Setup({ onStart }) {
    const [size, setSize] = useState(5);
    const [lines, setLines] = useState(1);
    const [prizeName, setPrizeName] = useState(DEFAULT_PRIZE);
    const [players, setPlayers] = useState([{ id: 1, name: '' }]);
    const nextPlayerId = useRef(2);
    const playerCount = players.filter((player) => player.name.trim()).length;

    return <div className="setup-layout grid gap-10 lg:grid-cols-2 lg:gap-16">
        <section className="setup-intro bingo-enter">
            <p className="overline"><span className="tiny-star">✳</span> ONE SCREEN. EVERYONE IN.</p>
            <h1>いい予感は、<br />次の<span className="underlined">数字</span>に。</h1>
            <p className="intro-copy">ひとつの画面を囲んで、みんなでビンゴ。<br />準備ができたら、運だめしをはじめよう。</p>
            <div className="bingo-art" aria-hidden="true">
                <div className="art-ticket"><span>BINGO CLUB / GOOD LUCK</span><div className="art-grid">{['08', '21', '36', '42', 'FREE', '63', '11', '54', '72'].map((value) => <i key={value}>{value}</i>)}</div></div>
                <div className="art-ball art-ball-orange">07</div>
                <div className="art-ball art-ball-blue">24</div>
                <div className="art-sticker">みんなに<br />チャンス!</div>
                <span className="art-spark">✳</span>
            </div>
            <ol className="how-to grid grid-cols-3 gap-4">
                <li><span>01</span><strong>みんなを登録</strong><p>サイズとルールを決める</p></li>
                <li><span>02</span><strong>数字をひとつ</strong><p>司会者が抽選する</p></li>
                <li><span>03</span><strong>みんなでチェック</strong><p>まとめて確認して次へ進む</p></li>
            </ol>
        </section>
        <section className="setup-card panel bingo-enter" aria-labelledby="setup-title">
            <div className="flex items-start justify-between gap-4"><div><p className="overline">MAKE YOUR GAME</p><h2 id="setup-title">今日のビンゴをつくる</h2></div><span className="small-sticker">LET’S<br />PLAY!</span></div>
            <form onSubmit={(event) => {
                event.preventDefault();
                onStart(size, lines, players.map((player) => player.name.trim()), prizeName.trim());
            }}>
                <fieldset>
                    <legend><span className="field-number">01</span>盤面のサイズ</legend>
                    <div className="size-options grid grid-cols-3 gap-3">
                        {SIZES.map((value) => <label key={value} className={`size-option ${size === value ? 'selected' : ''}`}>
                            <input type="radio" name="size" value={value} checked={size === value} onChange={() => { setSize(value); setLines(Math.min(lines, lineLimit(value))); }} />
                            <span className="mini-grid" style={{ gridTemplateColumns: `repeat(${value}, 1fr)` }} aria-hidden="true">{Array.from({ length: value * value }, (_, index) => <i key={index} className={index === Math.floor(value * value / 2) ? 'center' : ''} />)}</span>
                            <strong>{value} × {value}</strong><small>数字 1〜{numberLimit(value)}</small>
                        </label>)}
                    </div>
                </fieldset>
                <div className="rule-row flex items-center justify-between gap-4">
                    <label htmlFor="required-lines"><span className="field-number">02</span>ビンゴに必要な列数<small>縦・横・斜め。中央はFREE。</small></label>
                    <select id="required-lines" value={lines} onChange={(event) => setLines(Number(event.target.value))}>
                        {Array.from({ length: lineLimit(size) }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1} 列</option>)}
                    </select>
                </div>
                <div className="names-field">
                    <div className="flex items-center justify-between gap-3"><span className="players-label"><span className="field-number">03</span>参加するメンバー</span><span className="count-tag">{playerCount} 人</span></div>
                    <div className="player-input-list">
                        {players.map((player, index) => <div className="player-input-row" key={player.id}>
                            <label className="player-input-index" htmlFor={`player-name-${player.id}`}>{String(index + 1).padStart(2, '0')}</label>
                            <input id={`player-name-${player.id}`} type="text" value={player.name} maxLength={40} required
                                placeholder={index === 0 ? 'たろう' : index === 1 ? 'はなこ' : '参加者名'}
                                aria-label={`参加者 ${index + 1} の名前`}
                                onChange={(event) => setPlayers((current) => current.map((item) => item.id === player.id ? { ...item, name: event.target.value } : item))} />
                            <button type="button" className="remove-player-button" aria-label={`${index + 1}人目を削除`}
                                disabled={players.length === 1} onClick={() => setPlayers((current) => current.filter((item) => item.id !== player.id))}>×</button>
                        </div>)}
                    </div>
                    <button type="button" className="add-player-button" onClick={() => {
                        setPlayers((current) => [...current, { id: nextPlayerId.current++, name: '' }]);
                    }}><span aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></span>参加者を追加</button>
                    <p id="names-help" className="field-help">参加者ごとに名前を入力してください。名前は40文字まで。</p>
                </div>
                <div className="prize-field">
                    <label htmlFor="prize-name"><span className="field-number">04</span>優勝した人への景品</label>
                    <input id="prize-name" type="text" value={prizeName} maxLength={40} required
                        onChange={(event) => setPrizeName(event.target.value)} />
                    <p className="field-help">同率1位の人にも景品を贈ります。</p>
                </div>
                <button type="submit" className="primary-button w-full">ゲームをはじめる <span><Arrow /></span></button>
                <p className="form-footnote">カードは自動で作成。ゲーム開始後の設定変更はできません。</p>
            </form>
        </section>
    </div>;
}

function Card({ game, playerIndex }) {
    const player = game.players[playerIndex];
    const opened = new Set(visibleDrawn(game, playerIndex));
    const latest = game.drawn.at(-1);
    return <ol className="bingo-board" style={{ '--board-size': game.size }} aria-label={`${player.name}のビンゴカード`}>
        {player.card.map((number, index) => {
            const isOpen = number === null || opened.has(number);
            const isNew = number !== null && number === latest && isOpen;
            return <li key={index} className={`bingo-cell ${isOpen ? 'is-open' : ''} ${number === null ? 'is-free' : ''} ${isNew ? 'is-new' : ''}`}
                aria-label={`${number === null ? 'FREE' : number}、${isOpen ? '開いています' : '未開封'}`}>
                {number === null ? <><span aria-hidden="true">✳</span><small>FREE</small></> : <><span>{number}</span>{isOpen && <small aria-hidden="true">✓</small>}</>}
            </li>;
        })}
    </ol>;
}

function AllCards({ game }) {
    const checking = game.phase === 'checking';
    return <section className="all-cards" aria-labelledby="all-cards-heading">
        <div className="cards-heading flex items-center justify-between gap-4">
            <div className="min-w-0"><p className="overline">EVERYONE’S CARD</p><h2 id="all-cards-heading">みんなのビンゴカード</h2></div>
            <span className="count-tag">{game.players.length} 人</span>
        </div>
        <div className="cards-grid">
        {game.players.map((player, index) => {
            const lines = completedLines(player.card, game.size, visibleDrawn(game, index));
            const achieved = lines >= game.requiredLines;
            const possibleNumbers = reachNumbers(game, index);
            const isReach = game.phase !== 'finished' && !achieved && possibleNumbers.length > 0;
            const justReached = checking && isReach
                && reachNumbers(game, index, game.drawn.slice(0, -1)).length === 0;
            const status = game.phase === 'finished' ? achieved ? '1位 · BINGO!' : 'ゲーム終了'
                : isReach ? `リーチ！あと1つ${possibleNumbers.length === 1 ? `：${possibleNumbers[0]}` : ''}`
                    : checking ? '全員で確認中' : '待機中';
            return <section key={index} className={`player-card panel ${checking ? 'current-card' : ''} ${achieved ? 'achieved-card' : ''} ${isReach ? 'reach-card' : ''} ${justReached ? 'reach-new' : ''}`}
                aria-labelledby={`card-heading-${index}`}>
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0"><p className="overline">PLAYER {String(index + 1).padStart(2, '0')}</p>
                        <h3 id={`card-heading-${index}`}>{player.name}</h3>
                    </div>
                    <span className="line-tag"><strong>{lines}</strong> / {game.requiredLines} 列</span>
                </div>
                <Card game={game} playerIndex={index} />
                <div className="card-status-row flex items-center justify-between gap-2"><span className="card-status">{status}</span>
                    {achieved ? <span className="card-bingo-mark" aria-label="ビンゴ成立">BINGO!</span>
                        : isReach && <span className="card-reach-mark" aria-label="あと1つでビンゴ">REACH ↑</span>}
                </div>
            </section>;
        })}
        </div>
    </section>;
}

function History({ game }) {
    return <details className="history">
        <summary>これまでの数字 <span>{game.drawn.length} / {numberLimit(game.size)}</span></summary>
        {game.drawn.length === 0 ? <p className="field-help">まだ数字は出ていません。最初のひとつを引いてみよう。</p>
            : <ol className="flex flex-wrap gap-2" aria-label="抽選履歴（新しい順）">{game.drawn.toReversed().map((number, index) => <li key={number} className={index === 0 ? 'latest' : ''}>{number}</li>)}</ol>}
    </details>;
}

function Game({ game, onDraw, onConfirm, isSpinning, rouletteNumber, soundEnabled, onToggleSound }) {
    const checking = game.phase === 'checking';
    const latest = game.drawn.at(-1);
    return <>
        <div className="game-heading bingo-enter flex flex-wrap items-end justify-between gap-4">
            <div><p className="overline">{checking ? 'CHECK EVERYONE’S CARD' : 'LET THE GOOD TIMES ROLL'}</p><h1>{checking ? 'みんなのカードを確認しよう。' : game.drawn.length ? '次の数字は、なんだろう。' : 'さあ、最初のひとつ。'}</h1></div>
            <span className="turn-tag">TURN <strong>{String(game.drawn.length).padStart(2, '0')}</strong></span>
        </div>
        <div className={`play-layout all-players-layout grid gap-6 lg:gap-8 ${checking ? 'is-checking' : ''}`}>
            <section className="draw-panel panel bingo-enter">
                <p className="overline">{latest === undefined ? 'READY TO PLAY?' : 'THE LUCKY NUMBER'}</p>
                <div className={`number-stage ${isSpinning ? 'is-spinning' : ''}`}>
                    <span className="number-spark spark-one" aria-hidden="true">✳</span>
                    {isSpinning && <div className="roulette-ring" aria-hidden="true"><span>✦</span></div>}
                    <div className={`draw-ball ${isSpinning ? 'is-roulette' : ''}`} key={isSpinning ? 'rolling' : latest}
                        aria-live="polite" aria-label={isSpinning ? '抽選中' : latest === undefined ? '抽選前' : `抽選数字 ${latest}`}>
                        {isSpinning ? rouletteNumber : latest ?? '?'}
                    </div>
                    <span className="number-spark spark-two" aria-hidden="true">✦</span>
                    {isSpinning && <span className="roulette-caption" role="status">DRUM ROLL...</span>}
                </div>
                <p className="draw-caption">{checking ? 'みんなでカードを確認中' : '司会者の出番です'}</p>
                <button className="primary-button w-full draw-button" onClick={checking ? onConfirm : onDraw} disabled={isSpinning}>
                    {isSpinning ? '抽選中…' : checking ? '全員の確認を完了' : 'ルーレットを回す'} <span><Arrow /></span></button>
                <button type="button" className="sound-toggle" onClick={onToggleSound} aria-pressed={soundEnabled} disabled={isSpinning}>
                    <span aria-hidden="true">{soundEnabled ? '♫' : '♪'}</span> ドラムロール {soundEnabled ? 'ON' : 'OFF'}
                </button>
                {isSpinning && <p className="sound-caption" aria-live="polite">数字を抽選中です。少しだけお待ちください。</p>}
                {checking && <p className="field-help">全員の確認が終わったら<br />次の数字へ進めます。</p>}
                <p className="field-help">{game.requiredLines}列でビンゴ。<br />同じターンで達成した人は、みんな1位！</p>
                <History game={game} />
            </section>
            <AllCards game={game} />
        </div>
    </>;
}

function Results({ game, onReset }) {
    const winners = winnerIndexes(game);
    return <><section className="result-panel panel bingo-enter">
        <div className="result-confetti" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} style={{ '--i': index }} />)}</div>
        <p className="overline">THAT’S A BINGO!</p>
        <h1><span className="result-star" aria-hidden="true">✳</span> おめでとう！</h1>
        <p className="result-description">{game.drawn.length}ターン目で決着。{winners.length > 1 ? '同じターンで達成した、みんなが同率1位！' : '今日のラッキーなプレイヤーはこちら。'}</p>
        <div className="prize-award">
            <span className="prize-icon" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="M14 7h20v11c0 8-4 13-10 15-6-2-10-7-10-15V7Z" fill="#f5bd4d" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/><path d="M14 12H7v5c0 6 4 9 10 9m17-14h7v5c0 6-4 9-10 9M24 33v7m-9 2h18m-9-30 2 4 4 .6-3 3 .7 4.2-3.7-2-3.7 2 .7-4.2-3-3 4-.6 2-4Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
            <span className="prize-label">TODAY’S PRIZE</span>
            <strong>{game.prizeName}</strong>
        </div>
        <ul className="winner-list flex flex-wrap justify-center gap-4">{winners.map((index) => <li key={index}><span>1位 / PLAYER {index + 1}</span><strong>{game.players[index].name}</strong></li>)}</ul>
        <div className="result-scores">
            <h2>みんなの結果</h2>
            <ul>{game.players.map((player, index) => <li key={index} className="flex items-center justify-between gap-4"><span>{index + 1}. {player.name}</span><strong>{completedLines(player.card, game.size, game.drawn)} / {game.requiredLines} 列 {winners.includes(index) ? '✓' : ''}</strong></li>)}</ul>
        </div>
        <button className="primary-button" onClick={onReset}>新しいゲームをつくる <span><Arrow /></span></button>
        <History game={game} />
    </section><div className="result-cards"><AllCards game={game} /></div></>;
}

function DiscardDialog({ onCancel, onConfirm }) {
    const dialog = useRef(null);
    useEffect(() => {
        dialog.current.showModal();
    }, []);
    return <dialog ref={dialog} className="discard-dialog" onCancel={onCancel} aria-labelledby="discard-title" aria-describedby="discard-description">
        <p className="overline">START OVER?</p>
        <h2 id="discard-title">ゲームを破棄しますか？</h2>
        <p id="discard-description">カードと進行状況の保存データを削除し、設定画面に戻ります。この操作は取り消せません。</p>
        <div className="flex flex-wrap justify-end gap-3"><button className="secondary-button" onClick={onCancel} autoFocus>続ける</button><button className="danger-button" onClick={onConfirm}>破棄して設定へ戻る</button></div>
    </dialog>;
}

function Celebration({ event, onDismiss }) {
    const dialog = useRef(null);
    const isBingo = event.type === 'bingo';

    useEffect(() => {
        const previousFocus = document.activeElement;
        const overlay = dialog.current;
        overlay.showModal();
        const timer = window.setTimeout(onDismiss, isBingo ? 3400 : 2600);
        return () => {
            window.clearTimeout(timer);
            if (overlay.open) overlay.close();
            if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
                previousFocus.focus({ preventScroll: true });
            }
        };
    }, [isBingo, onDismiss]);

    useLayoutEffect(() => {
        const media = gsap.matchMedia();
        media.add('(prefers-reduced-motion: no-preference)', () => {
            const select = gsap.utils.selector(dialog);
            const duration = isBingo ? 3.4 : 2.6;
            gsap.fromTo(select('.celebration-content'), { y: 80, opacity: 0 }, {
                y: 0, opacity: 1, duration: 0.55, ease: 'power3.out',
            });
            gsap.fromTo(select('.celebration-title'), { scale: 0.35, rotation: -12 }, {
                scale: 1, rotation: 0, duration: 0.8, ease: 'back.out(2.2)',
            });
            gsap.fromTo(select('.celebration-rays'), { rotation: 0, scale: 0.85 }, {
                rotation: isBingo ? 75 : 45, scale: 1.15, duration, ease: 'none',
            });
            gsap.fromTo(select('.celebration-names li'), { y: 35, opacity: 0, scale: 0.8 }, {
                y: 0, opacity: 1, scale: 1, duration: 0.45,
                stagger: { each: 0.05, amount: 0.4 }, delay: 0.3, ease: 'back.out(1.6)',
            });
            select('.celebration-particles i').forEach((particle, index) => {
                gsap.fromTo(particle, { y: -50, rotation: index * 37, opacity: 1 }, {
                    y: () => window.innerHeight + 80,
                    x: (index % 2 ? 1 : -1) * (40 + index % 6 * 20),
                    rotation: index * 37 + (index % 2 ? 540 : -540),
                    duration: 1.6 + index % 5 * 0.16,
                    delay: index % 10 * 0.05, ease: 'power1.in',
                });
            });
        }, dialog);
        return () => media.revert();
    }, [isBingo]);

    return <dialog ref={dialog} className={`celebration-dialog celebration-${event.type}`}
        aria-labelledby="celebration-title" onCancel={(cancelEvent) => {
            cancelEvent.preventDefault();
            onDismiss();
        }}>
        <div className="celebration-backdrop" aria-hidden="true" />
        <div className="celebration-rays" aria-hidden="true" />
        <div className="celebration-particles" aria-hidden="true">
            {Array.from({ length: isBingo ? 80 : 48 }, (_, index) => <i key={index}
                style={{ '--particle-color': ['#f48359', '#d7ea81', '#9bc9e5', '#f5bd4d', '#fffef9'][index % 5],
                    '--particle-left': `${(index * 37) % 100}%` }} />)}
        </div>
        <div className="celebration-content">
            <p className="celebration-eyebrow">{isBingo ? 'ALL EYES ON OUR WINNERS' : 'ONE MORE NUMBER!'}</p>
            <h2 id="celebration-title" className="celebration-title">{isBingo ? 'BINGO!' : 'REACH!'}</h2>
            <p className="celebration-subtitle">{isBingo ? 'やったね！ 今日の主役はあなた！' : 'あとひとつ！ 運命の数字はすぐそこ！'}</p>
            <ul className="celebration-names">{event.names.map((name, index) => <li key={index}>{name}<span>さん</span></li>)}</ul>
            {isBingo && <p className="celebration-prize"><span>YOU WIN</span><strong>{event.prizeName}</strong></p>}
            <button className="celebration-skip" onClick={onDismiss} autoFocus>演出をスキップ →</button>
        </div>
    </dialog>;
}

function App() {
    const [session, setSession] = useState(loadSession);
    const [discarding, setDiscarding] = useState(false);
    const [isSpinning, setIsSpinning] = useState(false);
    const [rouletteNumber, setRouletteNumber] = useState(null);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [soundNotice, setSoundNotice] = useState('');
    const [celebration, setCelebration] = useState(null);
    const dismissCelebration = useCallback(() => setCelebration(null), []);
    const root = useRef(null);
    const actionPending = useRef(false);
    const roulettePending = useRef(false);
    const rouletteTimer = useRef(null);
    const rouletteInterval = useRef(null);
    const audioContext = useRef(null);
    const game = session.game;
    const scene = game ? `${game.phase}:${game.drawn.length}:${game.currentPlayer}` : 'setup';

    useEffect(() => {
        const onStorage = (event) => {
            if (event.key !== STORAGE_KEY && event.key !== null) return;
            setSession((current) => event.newValue === current.raw ? current : {
                ...current, blocked: true, error: '別のタブで保存データが変更されました。上書きを防ぐため、再読み込みして最新のゲームを開いてください。',
            });
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    useEffect(() => () => {
        window.clearTimeout(rouletteTimer.current);
        window.clearInterval(rouletteInterval.current);
        if (audioContext.current && audioContext.current.state !== 'closed') {
            audioContext.current.close().catch((error) => console.error('Bingo: failed to close audio context', error));
        }
    }, []);

    useLayoutEffect(() => {
        actionPending.current = false;
    }, [session]);

    useLayoutEffect(() => {
        const media = gsap.matchMedia();
        media.add('(prefers-reduced-motion: no-preference)', () => {
            const animate = (selector, from, to) => {
                const targets = root.current.querySelectorAll(selector);
                if (targets.length > 0) gsap.fromTo(targets, from, to);
            };
            animate('.bingo-enter', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.07, ease: 'power2.out' });
            if (isSpinning) {
                animate('.roulette-ring', { rotation: 0, scale: 0.82 }, { rotation: 1080, scale: 1, duration: 1.35, ease: 'power3.out' });
                animate('.draw-ball.is-roulette', { scale: 0.92 }, { scale: 1.04, duration: 0.14, yoyo: true, repeat: 8, ease: 'sine.inOut' });
            } else {
                animate('.draw-ball', { scale: 0.65, rotation: -15 }, { scale: 1, rotation: 0, duration: 0.7, ease: 'back.out(1.6)' });
            }
            animate('.is-new', { scale: 0.8 }, { scale: 1, duration: 0.6, stagger: 0.04, ease: 'elastic.out(1, 0.5)' });
            animate('.reach-new', { y: 28, scale: 0.93 }, { y: 0, scale: 1, duration: 0.85, ease: 'back.out(1.8)' });
            animate('.card-reach-mark', { scale: 0.75, rotation: -8 }, { scale: 1, rotation: 0, duration: 0.6, stagger: 0.08, ease: 'back.out(2)' });
            animate('.prize-award', { scale: 0.78, y: 22, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.7)' });
            animate('.result-confetti i', { y: -70, opacity: 0, rotation: -45 }, { y: 0, opacity: 1, rotation: 15, duration: 0.9, stagger: 0.03, ease: 'power2.out' });
        }, root);
        if (game) {
            const heading = root.current.querySelector('[data-current-player]') ?? root.current.querySelector('h1');
            heading?.setAttribute('tabindex', '-1');
            heading?.focus({ preventScroll: true });
        }
        return () => media.revert();
    }, [scene, isSpinning]);

    function update(makeNext) {
        if (actionPending.current) return;
        actionPending.current = true;
        try {
            if (localStorage.getItem(STORAGE_KEY) !== session.raw) {
                throw new Error('別の画面で保存データが変更されています。再読み込みしてください。');
            }
            const next = makeNext(game);
            const raw = next === null ? null : JSON.stringify(next);
            // Persist first: a failed write must not advance the visible game.
            if (raw === null) localStorage.removeItem(STORAGE_KEY);
            else localStorage.setItem(STORAGE_KEY, raw);
            setSession({ game: next, raw, error: null, blocked: false });
            setDiscarding(false);
            if (next?.phase === 'finished' && game?.phase !== 'finished') {
                setCelebration({
                    type: 'bingo', names: winnerIndexes(next).map((index) => next.players[index].name),
                    prizeName: next.prizeName,
                });
            } else if (next?.phase === 'checking' && game?.phase === 'drawing'
                && winnerIndexes(next).length === 0) {
                const names = next.players.flatMap((player, index) =>
                    reachNumbers(next, index).length > 0 && reachNumbers(game, index).length === 0
                        ? [player.name] : []);
                if (names.length > 0) setCelebration({ type: 'reach', names });
            } else if (next === null) {
                setCelebration(null);
            }
            return true;
        } catch (error) {
            console.error('Bingo: failed to update game', error);
            setSession((current) => ({ ...current, error: `操作を完了できませんでした。${error.message} 保存できる状態にして、もう一度お試しください。` }));
            actionPending.current = false;
            setDiscarding(false);
            return false;
        }
    }

    async function playDrumRoll() {
        const AudioContextClass = window.AudioContext;
        if (!AudioContextClass) throw new Error('このブラウザは音声再生に対応していません。');
        const context = audioContext.current ?? new AudioContextClass();
        audioContext.current = context;
        if (context.state === 'suspended') await context.resume();

        const duration = 0.075;
        const noise = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
        const samples = noise.getChannelData(0);
        for (let index = 0; index < samples.length; index++) {
            samples[index] = (Math.random() * 2 - 1) * (1 - index / samples.length);
        }

        let elapsed = 0;
        for (let pulse = 0; elapsed < 1.25; pulse++) {
            const startAt = context.currentTime + elapsed;
            const source = context.createBufferSource();
            const filter = context.createBiquadFilter();
            const gain = context.createGain();
            source.buffer = noise;
            filter.type = 'bandpass';
            filter.frequency.value = 1450 + Math.min(pulse * 35, 500);
            filter.Q.value = 0.8;
            gain.gain.setValueAtTime(0.0001, startAt);
            gain.gain.exponentialRampToValueAtTime(0.055, startAt + 0.009);
            gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
            source.connect(filter).connect(gain).connect(context.destination);
            source.start(startAt);
            source.stop(startAt + duration);
            elapsed += Math.max(0.042, 0.09 - pulse * 0.0024);
        }
    }

    function startDraw(event) {
        if (event.detail > 1 || roulettePending.current || actionPending.current || !game || isSpinning) return;
        roulettePending.current = true;
        let next;
        try {
            if (localStorage.getItem(STORAGE_KEY) !== session.raw) {
                throw new Error('別の画面で保存データが変更されています。再読み込みしてください。');
            }
            next = drawNumber(game);
        } catch (error) {
            console.error('Bingo: failed to prepare draw', error);
            setSession((current) => ({ ...current, error: `抽選を開始できませんでした。${error.message}` }));
            roulettePending.current = false;
            return;
        }

        if (soundEnabled) {
            playDrumRoll().catch((error) => {
                console.error('Bingo: drum roll playback failed', error);
                setSoundNotice(error.message || 'ドラムロールを再生できませんでした。');
            });
        }

        setSoundNotice('');
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        setIsSpinning(true);
        setRouletteNumber(reduceMotion ? next.drawn.at(-1) : Math.floor(Math.random() * numberLimit(game.size)) + 1);
        if (!reduceMotion) {
            rouletteInterval.current = window.setInterval(() => {
                setRouletteNumber(Math.floor(Math.random() * numberLimit(game.size)) + 1);
            }, 65);
        }
        rouletteTimer.current = window.setTimeout(() => {
            window.clearInterval(rouletteInterval.current);
            setRouletteNumber(next.drawn.at(-1));
            setIsSpinning(false);
            roulettePending.current = false;
            update(() => next);
        }, reduceMotion ? 250 : 1400);
    }

    const oncePerClick = (action) => (event) => {
        if (event.detail > 1) return;
        update(action);
    };

    return <div className="bingo-shell" ref={root}>
        <header className="club-header flex items-center justify-between gap-4">
            <a href="/bingo" className="club-brand" aria-label="BINGO CLUB"><span className="brand-flower" aria-hidden="true">✳</span>BINGO<span className="brand-club">CLUB</span><span className="brand-period">●</span></a>
            <span className="local-badge"><i />LOCAL PLAY<span className="hidden sm:inline"> · ひとつの画面で</span></span>
        </header>
        <main>
            {session.error && <div className="error-banner" role="alert"><strong>{session.error}</strong><button className="secondary-button" onClick={() => window.location.reload()}>再読み込み</button></div>}
            {session.blocked ? <section className="panel recovery-panel"><h1>保存データを確認してください</h1><p>進行状況は自動では削除・上書きしません。再読み込みするか、保存したゲームを破棄してやり直せます。</p><button className="danger-button" onClick={() => setDiscarding(true)}>保存したゲームを破棄する</button></section>
                : !game ? <Setup onStart={(size, lines, names, prizeName) => update(() => createGame(size, lines, names, prizeName))} />
                    : <>
                        <div className="game-toolbar flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2"><span className="config-chip">{game.size} × {game.size}</span><span className="config-chip">{game.requiredLines}列でビンゴ</span><span className="config-chip">数字 1〜{numberLimit(game.size)}</span></div><span className="save-status"><i />このブラウザに保存済み</span></div>
                        {soundNotice && <p className="sound-notice" role="status">{soundNotice}</p>}
                        {game.phase === 'finished' ? <Results game={game} onReset={() => setDiscarding(true)} />
                            : <Game game={game} onDraw={startDraw} onConfirm={oncePerClick(confirmAllPlayers)}
                                isSpinning={isSpinning} rouletteNumber={rouletteNumber} soundEnabled={soundEnabled}
                                onToggleSound={() => setSoundEnabled((enabled) => !enabled)} />}
                        <div className="game-bottom flex flex-wrap items-center justify-between gap-4"><p>途中で閉じても、ここから再開できます。</p><button className="text-button" disabled={isSpinning} onClick={() => setDiscarding(true)}>ゲームを破棄して設定へ戻る ↗</button></div>
                    </>}
        </main>
        <footer className="club-footer flex flex-wrap items-center justify-between gap-3"><span>GOOD NUMBERS. GOOD COMPANY.</span><span>ログイン不要 / 進行はこのブラウザだけに保存</span></footer>
        {discarding && <DiscardDialog onCancel={() => setDiscarding(false)} onConfirm={() => update(() => null)} />}
        {celebration && !session.blocked && <Celebration event={celebration} onDismiss={dismissCelebration} />}
    </div>;
}

createRoot(document.getElementById('bingo-root')).render(<App />);
