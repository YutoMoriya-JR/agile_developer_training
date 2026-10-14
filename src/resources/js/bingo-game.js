export const STORAGE_KEY = 'bingo-club.game.v1';
export const SIZES = [3, 5, 7];
export const DEFAULT_PRIZE = 'ビンゴチャンピオン賞';

export const numberLimit = (size) => 3 * size * size;
export const lineLimit = (size) => 2 * size + 2;

function requireValid(condition, message) {
    if (!condition) throw new Error(message);
}

function shuffledNumbers(limit) {
    const numbers = Array.from({ length: limit }, (_, index) => index + 1);
    for (let index = numbers.length - 1; index > 0; index--) {
        const other = Math.floor(Math.random() * (index + 1));
        [numbers[index], numbers[other]] = [numbers[other], numbers[index]];
    }
    return numbers;
}

export function createGame(size, requiredLines, names, prizeName = DEFAULT_PRIZE) {
    requireValid(SIZES.includes(size), '盤面サイズを選択してください。');
    requireValid(Number.isInteger(requiredLines) && requiredLines >= 1 && requiredLines <= lineLimit(size),
        'ビンゴに必要な列数を設定範囲内で指定してください。');
    requireValid(Array.isArray(names) && names.length > 0, '参加者を1人以上登録してください。');
    requireValid(names.every((name) => typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 40),
        '参加者名は1〜40文字で入力してください。');
    requireValid(typeof prizeName === 'string' && prizeName.trim().length > 0 && prizeName.trim().length <= 40,
        '景品名は1〜40文字で入力してください。');

    return {
        version: 1,
        size,
        requiredLines,
        prizeName: prizeName.trim(),
        players: names.map((name) => {
            const card = shuffledNumbers(numberLimit(size)).slice(0, size * size);
            card[Math.floor(card.length / 2)] = null;
            return { name: name.trim(), card };
        }),
        drawn: [],
        phase: 'drawing',
        currentPlayer: null,
    };
}

export function completedLines(card, size, drawn) {
    const opened = new Set(drawn);
    const isOpen = (index) => card[index] === null || opened.has(card[index]);
    let count = 0;
    for (let row = 0; row < size; row++) {
        if (Array.from({ length: size }, (_, col) => row * size + col).every(isOpen)) count++;
    }
    for (let col = 0; col < size; col++) {
        if (Array.from({ length: size }, (_, row) => row * size + col).every(isOpen)) count++;
    }
    if (Array.from({ length: size }, (_, index) => index * size + index).every(isOpen)) count++;
    if (Array.from({ length: size }, (_, index) => index * size + size - 1 - index).every(isOpen)) count++;
    return count;
}

export function winnerIndexes(game, drawn = game.drawn) {
    return game.players.flatMap((player, index) =>
        completedLines(player.card, game.size, drawn) >= game.requiredLines ? [index] : []);
}

export function reachNumbers(game, playerIndex, drawn = game.drawn) {
    const player = game.players[playerIndex];
    const called = new Set(drawn);
    return player.card.filter((number) => number !== null && !called.has(number)
        && completedLines(player.card, game.size, [...drawn, number]) >= game.requiredLines);
}

// The latest number is visible on every card before the host confirms the round.
export function visibleDrawn(game) {
    return game.drawn;
}

export function drawNumber(game) {
    requireValid(game.phase === 'drawing', '全員の確認が終わるまで次の数字は抽選できません。');
    const used = new Set(game.drawn);
    const remaining = Array.from({ length: numberLimit(game.size) }, (_, index) => index + 1)
        .filter((number) => !used.has(number));
    requireValid(remaining.length > 0, '抽選できる数字がありません。');
    const next = remaining[Math.floor(Math.random() * remaining.length)];
    return { ...game, drawn: [...game.drawn, next], phase: 'checking', currentPlayer: 0 };
}

export function confirmPlayer(game, playerIndex) {
    requireValid(game.phase === 'checking' && game.currentPlayer === playerIndex,
        '現在表示されている参加者の確認を完了してください。');
    if (playerIndex < game.players.length - 1) {
        return { ...game, currentPlayer: playerIndex + 1 };
    }
    return { ...game, currentPlayer: null, phase: winnerIndexes(game).length > 0 ? 'finished' : 'drawing' };
}

export function confirmAllPlayers(game) {
    requireValid(game.phase === 'checking', '抽選後の確認中にのみ、全員の確認を完了できます。');
    let next = game;
    while (next.phase === 'checking') {
        next = confirmPlayer(next, next.currentPlayer);
    }
    return next;
}

export function parseGame(raw) {
    let game;
    try {
        game = JSON.parse(raw);
    } catch {
        throw new Error('保存データを読み取れません。ゲームを破棄するか、ブラウザの保存データを確認してください。');
    }
    const invalid = '保存データが不正、または未対応の形式です。自動では上書きしません。';
    requireValid(game !== null && typeof game === 'object' && game.version === 1, invalid);
    requireValid(SIZES.includes(game.size), invalid);
    requireValid(Number.isInteger(game.requiredLines) && game.requiredLines >= 1
        && game.requiredLines <= lineLimit(game.size), invalid);
    if (game.prizeName === undefined) game.prizeName = DEFAULT_PRIZE;
    requireValid(typeof game.prizeName === 'string' && game.prizeName.trim().length > 0
        && game.prizeName.trim().length <= 40, invalid);
    requireValid(Array.isArray(game.players) && game.players.length > 0, invalid);
    const validNumber = (number) => Number.isInteger(number) && number >= 1 && number <= numberLimit(game.size);
    for (const player of game.players) {
        requireValid(player !== null && typeof player === 'object', invalid);
        requireValid(typeof player.name === 'string' && player.name.trim().length > 0 && player.name.length <= 40, invalid);
        requireValid(Array.isArray(player.card) && player.card.length === game.size * game.size, invalid);
        requireValid(player.card.every((number, index) =>
            index === Math.floor(player.card.length / 2) ? number === null : validNumber(number)), invalid);
        requireValid(new Set(player.card).size === player.card.length, invalid);
    }
    requireValid(Array.isArray(game.drawn) && game.drawn.every(validNumber)
        && new Set(game.drawn).size === game.drawn.length, invalid);
    requireValid(['drawing', 'checking', 'finished'].includes(game.phase), invalid);
    if (game.phase === 'checking') {
        requireValid(game.drawn.length > 0 && Number.isInteger(game.currentPlayer)
            && game.currentPlayer >= 0 && game.currentPlayer < game.players.length, invalid);
    } else {
        requireValid(game.currentPlayer === null, invalid);
    }
    const previousWinners = winnerIndexes(game, game.drawn.slice(0, -1));
    requireValid(previousWinners.length === 0, invalid);
    if (game.phase === 'drawing') requireValid(winnerIndexes(game).length === 0, invalid);
    if (game.phase === 'finished') requireValid(game.drawn.length > 0 && winnerIndexes(game).length > 0, invalid);
    return game;
}
