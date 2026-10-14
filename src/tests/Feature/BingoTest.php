<?php

namespace Tests\Feature;

use Tests\TestCase;

class BingoTest extends TestCase
{
    public function test_bingo_is_available_without_logging_in(): void
    {
        $this->withoutVite();

        $this->get(route('bingo'))
            ->assertOk()
            ->assertSee('BINGO CLUB')
            ->assertSee('id="bingo-root"', false)
            ->assertSee('lang="ja"', false);

        $this->assertGuest();
    }
}
