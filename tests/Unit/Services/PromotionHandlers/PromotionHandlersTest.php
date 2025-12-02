<?php

namespace Tests\Unit\Services\PromotionHandlers;

use App\Enums\PromotionRuleType;
use App\Models\Stage;
use App\Models\StagePromotion;
use App\Services\PromotionHandlers\TopNHandler;
use App\Services\PromotionHandlers\TopPerGroupHandler;
use App\Services\PromotionHandlers\PointsThresholdHandler;
use Illuminate\Support\Collection;
use Tests\TestCase;

class PromotionHandlersTest extends TestCase
{
    // ==================== TopNHandler Tests ====================

    public function test_top_n_handler_selects_top_n_teams(): void
    {
        $handler = new TopNHandler();

        $stage = new Stage();
        $promotion = new StagePromotion([
            'rule_type' => PromotionRuleType::TOP_N,
            'rule_config' => ['n' => 2],
        ]);
        $stage->setRelation('promotion', $promotion);

        $rankings = collect([
            ['team_id' => 1, 'rank' => 1, 'points' => 9],
            ['team_id' => 2, 'rank' => 2, 'points' => 6],
            ['team_id' => 3, 'rank' => 3, 'points' => 3],
            ['team_id' => 4, 'rank' => 4, 'points' => 0],
        ]);

        $winners = $handler->selectWinners($stage, $rankings);

        $this->assertCount(2, $winners);
        $this->assertTrue($winners->contains(1));
        $this->assertTrue($winners->contains(2));
        $this->assertFalse($winners->contains(3));
    }

    public function test_top_n_handler_selects_single_winner(): void
    {
        $handler = new TopNHandler();

        $stage = new Stage();
        $promotion = new StagePromotion([
            'rule_config' => ['n' => 1],
        ]);
        $stage->setRelation('promotion', $promotion);

        $rankings = collect([
            ['team_id' => 5, 'rank' => 1, 'points' => 12],
            ['team_id' => 6, 'rank' => 2, 'points' => 9],
        ]);

        $winners = $handler->selectWinners($stage, $rankings);

        $this->assertCount(1, $winners);
        $this->assertEquals(5, $winners->first());
    }

    public function test_top_n_handler_validates_config(): void
    {
        $handler = new TopNHandler();

        $this->assertTrue($handler->validateConfig(['n' => 2]));
        $this->assertTrue($handler->validateConfig(['n' => 1]));
        $this->assertFalse($handler->validateConfig(['n' => 0]));
        $this->assertFalse($handler->validateConfig(['n' => -1]));
        $this->assertFalse($handler->validateConfig(['n' => 'invalid']));
        $this->assertFalse($handler->validateConfig([]));
    }

    public function test_top_n_handler_throws_without_promotion(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $handler = new TopNHandler();
        $stage = new Stage();
        $rankings = collect([]);

        $handler->selectWinners($stage, $rankings);
    }

    // ==================== TopPerGroupHandler Tests ====================

    public function test_top_per_group_selects_from_each_group(): void
    {
        $handler = new TopPerGroupHandler();

        $stage = new Stage();
        $promotion = new StagePromotion([
            'rule_type' => PromotionRuleType::TOP_PER_GROUP,
            'rule_config' => ['n' => 2],
        ]);
        $stage->setRelation('promotion', $promotion);

        $rankings = collect([
            // Group A
            ['team_id' => 1, 'group_id' => 1, 'rank' => 1, 'points' => 9],
            ['team_id' => 2, 'group_id' => 1, 'rank' => 2, 'points' => 6],
            ['team_id' => 3, 'group_id' => 1, 'rank' => 3, 'points' => 3],
            // Group B
            ['team_id' => 4, 'group_id' => 2, 'rank' => 1, 'points' => 7],
            ['team_id' => 5, 'group_id' => 2, 'rank' => 2, 'points' => 5],
            ['team_id' => 6, 'group_id' => 2, 'rank' => 3, 'points' => 2],
        ]);

        $winners = $handler->selectWinners($stage, $rankings);

        // Should get top 2 from each group = 4 teams total
        $this->assertCount(4, $winners);

        // Group A top 2
        $this->assertTrue($winners->contains(1));
        $this->assertTrue($winners->contains(2));

        // Group B top 2
        $this->assertTrue($winners->contains(4));
        $this->assertTrue($winners->contains(5));

        // Not promoted
        $this->assertFalse($winners->contains(3));
        $this->assertFalse($winners->contains(6));
    }

    public function test_top_per_group_handles_uneven_groups(): void
    {
        $handler = new TopPerGroupHandler();

        $stage = new Stage();
        $promotion = new StagePromotion([
            'rule_config' => ['n' => 1],
        ]);
        $stage->setRelation('promotion', $promotion);

        $rankings = collect([
            ['team_id' => 1, 'group_id' => 1, 'rank' => 1],
            ['team_id' => 2, 'group_id' => 1, 'rank' => 2],
            ['team_id' => 3, 'group_id' => 2, 'rank' => 1],
            ['team_id' => 4, 'group_id' => 3, 'rank' => 1],
            ['team_id' => 5, 'group_id' => 3, 'rank' => 2],
            ['team_id' => 6, 'group_id' => 3, 'rank' => 3],
        ]);

        $winners = $handler->selectWinners($stage, $rankings);

        $this->assertCount(3, $winners);
        $this->assertTrue($winners->contains(1)); // Group 1 winner
        $this->assertTrue($winners->contains(3)); // Group 2 winner
        $this->assertTrue($winners->contains(4)); // Group 3 winner
    }

    public function test_top_per_group_validates_config(): void
    {
        $handler = new TopPerGroupHandler();

        $this->assertTrue($handler->validateConfig(['n' => 2]));
        $this->assertFalse($handler->validateConfig(['n' => 0]));
        $this->assertFalse($handler->validateConfig([]));
    }

    // ==================== PointsThresholdHandler Tests ====================

    public function test_points_threshold_selects_teams_meeting_threshold(): void
    {
        $handler = new PointsThresholdHandler();

        $stage = new Stage();
        $promotion = new StagePromotion([
            'rule_type' => PromotionRuleType::POINTS_THRESHOLD,
            'rule_config' => ['threshold' => 6],
        ]);
        $stage->setRelation('promotion', $promotion);

        $rankings = collect([
            ['team_id' => 1, 'rank' => 1, 'points' => 9],
            ['team_id' => 2, 'rank' => 2, 'points' => 6],
            ['team_id' => 3, 'rank' => 3, 'points' => 5],
            ['team_id' => 4, 'rank' => 4, 'points' => 3],
        ]);

        $winners = $handler->selectWinners($stage, $rankings);

        $this->assertCount(2, $winners);
        $this->assertTrue($winners->contains(1)); // 9 points
        $this->assertTrue($winners->contains(2)); // 6 points (exactly threshold)
        $this->assertFalse($winners->contains(3)); // 5 points (below)
    }

    public function test_points_threshold_returns_empty_if_none_qualify(): void
    {
        $handler = new PointsThresholdHandler();

        $stage = new Stage();
        $promotion = new StagePromotion([
            'rule_config' => ['threshold' => 10],
        ]);
        $stage->setRelation('promotion', $promotion);

        $rankings = collect([
            ['team_id' => 1, 'rank' => 1, 'points' => 9],
            ['team_id' => 2, 'rank' => 2, 'points' => 6],
        ]);

        $winners = $handler->selectWinners($stage, $rankings);

        $this->assertCount(0, $winners);
    }

    public function test_points_threshold_selects_all_if_all_qualify(): void
    {
        $handler = new PointsThresholdHandler();

        $stage = new Stage();
        $promotion = new StagePromotion([
            'rule_config' => ['threshold' => 0],
        ]);
        $stage->setRelation('promotion', $promotion);

        $rankings = collect([
            ['team_id' => 1, 'rank' => 1, 'points' => 9],
            ['team_id' => 2, 'rank' => 2, 'points' => 6],
            ['team_id' => 3, 'rank' => 3, 'points' => 3],
        ]);

        $winners = $handler->selectWinners($stage, $rankings);

        $this->assertCount(3, $winners);
    }

    public function test_points_threshold_validates_config(): void
    {
        $handler = new PointsThresholdHandler();

        $this->assertTrue($handler->validateConfig(['threshold' => 6]));
        $this->assertTrue($handler->validateConfig(['threshold' => 0]));
        $this->assertTrue($handler->validateConfig(['threshold' => 10.5]));
        $this->assertFalse($handler->validateConfig(['threshold' => 'invalid']));
        $this->assertFalse($handler->validateConfig([]));
    }

    public function test_points_threshold_maintains_rank_order(): void
    {
        $handler = new PointsThresholdHandler();

        $stage = new Stage();
        $promotion = new StagePromotion([
            'rule_config' => ['threshold' => 5],
        ]);
        $stage->setRelation('promotion', $promotion);

        $rankings = collect([
            ['team_id' => 3, 'rank' => 3, 'points' => 7],
            ['team_id' => 1, 'rank' => 1, 'points' => 10],
            ['team_id' => 2, 'rank' => 2, 'points' => 8],
            ['team_id' => 4, 'rank' => 4, 'points' => 4],
        ]);

        $winners = $handler->selectWinners($stage, $rankings);

        // Should return in rank order
        $this->assertEquals([1, 2, 3], $winners->values()->toArray());
    }
}
