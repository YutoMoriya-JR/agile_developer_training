<?php

namespace Tests\Feature;

use App\Models\DailyReport;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DailyReportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    private function report(User $user, bool $submitted = false, string $date = '2026-10-12'): DailyReport
    {
        $report = new DailyReport(['report_date' => $date, 'work' => 'Implementation']);
        $report->user()->associate($user);
        $report->submitted_at = $submitted ? now() : null;
        $report->save();

        return $report;
    }

    public function test_only_own_drafts_and_submitted_reports_are_visible(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $draft = $this->report($owner);
        $published = $this->report($owner, true, '2026-10-11');
        $otherDraft = $this->report($other);

        $this->assertEqualsCanonicalizing(
            [$published->id, $otherDraft->id],
            DailyReport::visibleTo($other)->pluck('id')->all(),
        );
        $this->assertTrue(DailyReport::visibleTo($owner)->whereKey($draft->id)->exists());
    }

    public function test_database_rejects_duplicate_daily_reports(): void
    {
        $owner = User::factory()->create();
        $this->report($owner);

        $this->expectException(QueryException::class);
        $this->report($owner);
    }

    public function test_guest_cannot_access_reports(): void
    {
        $this->get('/reports')->assertRedirect('/login');
    }

    public function test_owner_can_save_blank_draft_then_submit_and_edit(): void
    {
        $owner = User::factory()->create();
        $this->actingAs($owner)->post('/reports', [
            'report_date' => '2026-10-10', 'action' => 'draft',
        ])->assertSessionHasNoErrors()->assertRedirect();
        $report = DailyReport::sole();
        $this->assertNull($report->submitted_at);

        $this->put('/reports/'.$report->id, [
            'report_date' => '2026-10-10', 'work' => 'Done', 'action' => 'submit',
        ])->assertSessionHasNoErrors()->assertRedirect();
        $submittedAt = $report->fresh()->submitted_at;
        $this->assertNotNull($submittedAt);

        $this->put('/reports/'.$report->id, [
            'report_date' => '2026-10-10', 'work' => 'Updated', 'action' => 'draft',
        ])->assertSessionHasNoErrors()->assertRedirect();
        $this->assertTrue($submittedAt->equalTo($report->fresh()->submitted_at));
        $this->assertSame('Updated', $report->fresh()->work);
        $this->delete('/reports/'.$report->id)->assertForbidden();
    }

    public function test_other_users_cannot_view_drafts_edit_or_delete_reports(): void
    {
        $owner = User::factory()->create();
        $draft = $this->report($owner);
        $published = $this->report($owner, true, '2026-10-11');
        $this->actingAs(User::factory()->create());
        $this->get('/reports/'.$draft->id)->assertNotFound();
        foreach ([$draft, $published] as $report) {
            $this->get('/reports/'.$report->id.'/edit')->assertForbidden();
            $this->put('/reports/'.$report->id, [])->assertForbidden();
            $this->delete('/reports/'.$report->id)->assertForbidden();
        }
    }

    public function test_only_submitted_reports_accept_comments(): void
    {
        $owner = User::factory()->create();
        $draft = $this->report($owner);
        $published = $this->report($owner, true, '2026-10-11');
        $other = User::factory()->create();
        $this->actingAs($other)->post('/reports/'.$draft->id.'/comments', ['body' => 'Help'])->assertNotFound();
        $this->post('/reports/'.$published->id.'/comments', ['body' => 'Help', 'user_id' => $owner->id])
            ->assertSessionHasNoErrors()->assertRedirect();
        $this->assertDatabaseHas('comments', ['user_id' => $other->id, 'body' => 'Help']);
        $this->post('/reports/'.$published->id.'/comments', ['body' => '   '])->assertSessionHasErrors('body');
    }

    public function test_validation_rejects_duplicate_dates_and_empty_submissions(): void
    {
        $owner = User::factory()->create();
        $report = $this->report($owner);
        $this->actingAs($owner)->post('/reports', [
            'report_date' => '2026-10-12', 'work' => 'Duplicate', 'action' => 'submit',
        ])->assertSessionHasErrors('report_date');
        $this->post('/reports', [
            'report_date' => '2026-10-11', 'action' => 'submit',
        ])->assertSessionHasErrors('work');
        $this->delete('/reports/'.$report->id)->assertRedirect('/reports');
        $this->assertDatabaseMissing('daily_reports', ['id' => $report->id]);
    }

    public function test_pages_render_and_filters_preserve_draft_privacy(): void
    {
        $team = Team::create(['name' => 'Development']);
        $owner = User::factory()->create(['team_id' => $team->id]);
        $viewer = User::factory()->create();
        $published = $this->report($owner, true);
        $published->update(['work' => '100% complete', 'concerns' => 'Review required']);
        $this->report($owner, false, '2026-10-11')->update(['work' => 'Private draft']);
        $ownDraft = $this->report($viewer, false, '2026-10-10');
        $otherReport = $this->report($viewer, true, '2026-10-09');

        $this->actingAs($viewer)->get('/reports/create')->assertOk()->assertSee('日報の作成');
        $this->get('/reports/'.$ownDraft->id.'/edit')->assertOk()->assertSee('日報の編集');
        $this->get('/reports/'.$published->id)->assertOk()->assertSee('100% complete');
        $this->get('/reports')->assertOk()->assertDontSee('Private draft')->assertViewHas('reports',
            fn ($reports) => $reports->pluck('id')->all() === [$published->id, $ownDraft->id, $otherReport->id]);

        foreach ([
            ['date' => '2026-10-12'],
            ['team_id' => $team->id],
            ['user_id' => $owner->id],
            ['q' => 'Review'],
            ['q' => '%'],
            ['concerns_only' => 1],
            ['team_id' => $team->id, 'user_id' => $owner->id, 'date' => '2026-10-12', 'q' => 'complete', 'concerns_only' => 1],
        ] as $filters) {
            $this->get('/reports?'.http_build_query($filters))->assertOk()
                ->assertViewHas('reports', fn ($reports) => $reports->pluck('id')->all() === [$published->id]);
        }

        $this->get('/reports?view=drafts')->assertOk()->assertViewHas('reports',
            fn ($reports) => $reports->pluck('id')->all() === [$ownDraft->id]);
        $this->get('/reports?view=mine')->assertOk()->assertViewHas('reports',
            fn ($reports) => $reports->pluck('id')->all() === [$ownDraft->id, $otherReport->id]);
        $this->get('/reports?q=not-found')->assertOk()->assertSee('日報はありません');
    }

    public function test_reports_and_comments_are_escaped(): void
    {
        $owner = User::factory()->create();
        $report = $this->report($owner, true);
        $script = '<script>alert("xss")</script>';
        $report->update(['work' => $script, 'concerns' => $script]);
        $this->actingAs($owner)->post('/reports/'.$report->id.'/comments', ['body' => $script])->assertRedirect();
        $this->get('/reports/'.$report->id)->assertOk()->assertSee($script)->assertDontSee($script, false);
        $this->get('/reports')->assertOk()->assertDontSee($script, false);
    }

    public function test_pagination_keeps_search_conditions(): void
    {
        $owner = User::factory()->create();
        foreach (range(1, 16) as $day) {
            $this->report($owner, true, sprintf('2026-09-%02d', $day));
        }

        $this->actingAs($owner)->get('/reports?q=Implementation')->assertOk()
            ->assertViewHas('reports', fn ($reports) => $reports->count() === 15
                && str_contains($reports->nextPageUrl(), 'q=Implementation'));
        $this->get('/reports?q=Implementation&page=2')->assertOk()
            ->assertViewHas('reports', fn ($reports) => $reports->count() === 1);
    }

    public function test_owner_cannot_clear_work_after_submission_or_spoof_author(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $this->actingAs($owner)->post('/reports', [
            'report_date' => '2026-10-12', 'work' => 'Work', 'action' => 'submit', 'user_id' => $other->id,
        ])->assertSessionHasNoErrors()->assertRedirect();
        $report = DailyReport::sole();
        $this->assertSame($owner->id, $report->user_id);
        $this->put('/reports/'.$report->id, [
            'report_date' => '2026-10-12', 'action' => 'draft', 'work' => '',
        ])->assertSessionHasErrors('work');
        $this->assertSame('Work', $report->fresh()->work);
    }
}