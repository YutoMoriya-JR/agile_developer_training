import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    SIZES, numberLimit, lineLimit, createGame, completedLines, winnerIndexes,
    visibleDrawn, drawNumber, confirmPlayer, parseGame,
} from '../../resources/js/bingo-game.js';

const card = [1, 2, 3, 4, null, 5, 6, 7, 8];

function fixture(requiredLines = 1) {
    const game = createGame(3, requiredLines, ['たろう', 'はなこ']);
    game.players.forEach((player) => { player.card = [...card]; });
    return game;
}

function checking(drawn, requiredLines = 1) {
    return { ...fixture(requiredLines), drawn, phase: 'checking', currentPlayer: 0 };
}

for (const [size, limit, maxLines] of [[3, 27, 8], [5, 75, 12], [7, 147, 16]]) {
    test(`${size}x${size}: exact range, unique cards and a single central FREE`, () => {
        assert.equal(numberLimit(size), limit);
        assert.equal(lineLimit(size), maxLines);
        const game = createGame(size, maxLines, ['  A  ', 'B']);
        assert.equal(game.players[0].name, 'A');
        assert.equal(game.requiredLines, maxLines);
        assert.equal(game.phase, 'drawing');
        assert.equal(game.currentPlayer, null);
        assert.deepEqual(game.drawn, []);
        for (const player of game.players) {
            assert.equal(player.card.length, size * size);
            assert.equal(player.card[Math.floor(size * size / 2)], null);
            assert.equal(player.card.filter((number) => number === null).length, 1);
            assert.equal(new Set(player.card).size, size * size);
            assert.ok(player.card.filter((number) => number !== null)
                .every((number) => Number.isInteger(number) && number >= 1 && number <= limit));
            assert.equal(completedLines(player.card, size, []), 0);
            assert.equal(completedLines(player.card, size, player.card.filter((number) => number !== null)), maxLines);
        }
        assert.deepEqual(parseGame(JSON.stringify(game)), game);
    });

    test(`${size}x${size}: every allowed target terminates without repeating a draw`, () => {
        for (let target = 1; target <= maxLines; target++) {
            let game = createGame(size, target, ['A', 'B', 'C']);
            while (game.phase !== 'finished') {
                assert.equal(game.phase, 'drawing');
                assert.ok(game.drawn.length < limit);
                const previous = JSON.stringify(game);
                const next = drawNumber(game);
                assert.equal(JSON.stringify(game), previous, 'drawing must not mutate the previous save');
                game = parseGame(JSON.stringify(next));
                assert.equal(new Set(game.drawn).size, game.drawn.length);
                for (let player = 0; player < game.players.length; player++) {
                    assert.equal(game.phase, 'checking');
                    assert.equal(game.currentPlayer, player);
                    game = parseGame(JSON.stringify(confirmPlayer(game, player)));
                }
            }
            assert.ok(winnerIndexes(game).length > 0);
            assert.equal(winnerIndexes(game, game.drawn.slice(0, -1)).length, 0);
            assert.ok(game.drawn.length <= limit);
            assert.throws(() => drawNumber(game));
            assert.throws(() => confirmPlayer(game, 0));
        }
    });
}

test('counts horizontal, vertical and the two full diagonals, including FREE', () => {
    for (const [numbers, expected] of [
        [[], 0], [[1, 2], 0], [[1, 2, 3], 1], [[4, 5], 1], [[6, 7, 8], 1],
        [[1, 4, 6], 1], [[2, 7], 1], [[3, 5, 8], 1], [[1, 8], 1], [[3, 6], 1],
        [[1, 3, 6, 8], 2], [[2, 4, 5, 7], 2], [[1, 2, 3, 4, 5, 6, 7, 8], 8],
    ]) {
        assert.equal(completedLines(card, 3, numbers), expected, JSON.stringify(numbers));
    }
});

test('draw locks the host; confirmation follows registration order', () => {
    const game = drawNumber(fixture());
    assert.equal(game.phase, 'checking');
    assert.equal(game.currentPlayer, 0);
    assert.equal(game.drawn.length, 1);
    assert.throws(() => drawNumber(game));
    assert.throws(() => confirmPlayer(game, 1));
    assert.throws(() => confirmPlayer(game, null));
    const next = confirmPlayer(game, 0);
    assert.equal(next.currentPlayer, 1);
    assert.throws(() => confirmPlayer(next, 0), 'stale confirmation must not skip another player');
    const host = confirmPlayer(next, 1);
    assert.equal(host.phase, 'drawing');
    assert.equal(host.currentPlayer, null);
    assert.throws(() => confirmPlayer(host, 0));
});

test('later players only open this turn when their own screen is reached', () => {
    const game = checking([1, 2]);
    assert.deepEqual(visibleDrawn(game, 0), [1, 2]);
    assert.deepEqual(visibleDrawn(game, 1), [1]);
    const next = confirmPlayer(game, 0);
    assert.deepEqual(visibleDrawn(next, 1), [1, 2]);
    assert.deepEqual(visibleDrawn(confirmPlayer(next, 1), 0), [1, 2]);
});

test('waits for every confirmation and gives all same-turn winners first place', () => {
    const game = checking([1, 2, 3]);
    const next = confirmPlayer(game, 0);
    assert.equal(next.phase, 'checking', 'must not finish on the first winner');
    const finished = confirmPlayer(next, 1);
    assert.equal(finished.phase, 'finished');
    assert.deepEqual(winnerIndexes(finished), [0, 1]);
});

test('a later participant can be the sole winner', () => {
    const game = checking([1, 2, 3]);
    game.players[0].card = [10, 11, 12, 13, null, 14, 15, 16, 17];
    const next = confirmPlayer(game, 0);
    assert.equal(next.phase, 'checking');
    const finished = confirmPlayer(next, 1);
    assert.equal(finished.phase, 'finished');
    assert.deepEqual(winnerIndexes(finished), [1]);
});

test('uses the configured threshold, including when a draw completes multiple lines', () => {
    let game = checking([1, 2, 3], 2);
    game = confirmPlayer(confirmPlayer(game, 0), 1);
    assert.equal(game.phase, 'drawing', 'one line is not sufficient');
    game = checking([1, 3, 6, 8], 2);
    assert.equal(confirmPlayer(confirmPlayer(game, 0), 1).phase, 'finished');
    game = checking([2, 3, 8, 1], 2);
    assert.equal(completedLines(card, 3, game.drawn.slice(0, -1)), 0);
    assert.equal(completedLines(card, 3, game.drawn), 2);
    assert.equal(confirmPlayer(confirmPlayer(game, 0), 1).phase, 'finished');
});

test('supports a single participant', () => {
    let game = createGame(3, 1, ['ひとり']);
    game.players[0].card = [...card];
    game = { ...game, drawn: [4, 5], phase: 'checking', currentPlayer: 0 };
    assert.equal(confirmPlayer(game, 0).phase, 'finished');
});

test('restores every turn boundary, preserving the next participant and all cards', () => {
    const start = fixture();
    const first = checking([1, 2]);
    const second = confirmPlayer(first, 0);
    const host = confirmPlayer(second, 1);
    const winning = checking([1, 2, 3]);
    const finished = confirmPlayer(confirmPlayer(winning, 0), 1);
    for (const game of [start, first, second, host, winning, finished]) {
        const loaded = parseGame(JSON.stringify(game));
        assert.deepEqual(loaded, game);
        if (game.phase === 'checking') {
            assert.deepEqual(confirmPlayer(loaded, loaded.currentPlayer), confirmPlayer(game, game.currentPlayer));
        }
    }
});

test('rejects invalid settings and blank or oversized names', () => {
    for (const size of [0, 4, 9, '5', NaN]) assert.throws(() => createGame(size, 1, ['A']));
    for (const size of SIZES) {
        for (const lines of [0, -1, 1.5, '1', lineLimit(size) + 1]) assert.throws(() => createGame(size, lines, ['A']));
    }
    for (const names of [null, [], [''], ['  '], [3], ['a'.repeat(41)]]) assert.throws(() => createGame(3, 1, names));
    assert.equal(createGame(3, 1, ['a'.repeat(40)]).players[0].name.length, 40);
});

test('does not silently accept corrupt or unsupported saved games', () => {
    for (const raw of ['', '{', 'null', '[]', '{}', 'false', '1']) assert.throws(() => parseGame(raw));
    const mutations = [
        (g) => { g.version = 2; },
        (g) => { g.size = 4; },
        (g) => { g.requiredLines = 9; },
        (g) => { g.players = []; },
        (g) => { g.players[0] = null; },
        (g) => { g.players[0].name = ''; },
        (g) => { g.players[0].card.pop(); },
        (g) => { g.players[0].card[0] = 28; },
        (g) => { g.players[0].card[0] = null; },
        (g) => { g.players[0].card[4] = 20; },
        (g) => { g.players[0].card[0] = g.players[0].card[1]; },
        (g) => { g.drawn = [1, 1]; },
        (g) => { g.drawn = [0]; },
        (g) => { g.drawn = [28]; },
        (g) => { g.phase = 'unknown'; },
        (g) => { g.currentPlayer = 0; },
        (g) => { g.phase = 'checking'; g.currentPlayer = 0; },
        (g) => { g.phase = 'checking'; g.currentPlayer = 2; g.drawn = [1]; },
        (g) => { g.phase = 'finished'; },
        (g) => { g.drawn = [1, 2, 3]; },
        (g) => { g.phase = 'checking'; g.drawn = [1, 2, 3, 9]; g.currentPlayer = 0; },
    ];
    for (const mutate of mutations) {
        const game = fixture();
        mutate(game);
        assert.throws(() => parseGame(JSON.stringify(game)), mutate.toString());
    }
});
