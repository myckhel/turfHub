# TurfHub Betting System - Implementation Plan

## 🎯 Overview
This document outlines the implementation plan for TurfHub's game match betting feature. The system will allow players to bet on match outcomes with minimal complexity, following the existing architecture patterns.

## 🎨 UI/UX Design Principles (Based on Inspiration)
- **Card-based Layout**: Display betting markets in clean, organized cards
- **Intuitive Navigation**: Clear betting flow from market selection to bet placement
- **Mobile-First**: Responsive design optimized for mobile betting
- **Visual Hierarchy**: Clear odds display, bet amounts, and payout calculations
- **Quick Actions**: Fast bet placement with minimal clicks
- **Real-time Updates**: Live odds updates and bet status changes

## 🏗️ System Architecture

### Backend Structure
```
app/
├── Models/
│   ├── BettingMarket.php      # Available betting markets
│   ├── Bet.php                # Individual bets placed
│   ├── BetOutcome.php         # Possible outcomes for markets
│   └── MarketOption.php       # Specific options within markets
├── Services/
│   ├── BettingService.php     # Core betting logic
│   └── OddsCalculationService.php # Dynamic odds calculation
├── Http/Controllers/
│   ├── Api/BettingController.php
│   └── Web/BettingController.php
└── Http/Resources/
    ├── BettingMarketResource.php
    └── BetResource.php
```

### Frontend Structure
```
resources/js/
├── pages/App/Betting/
│   ├── Index.tsx              # Main betting page
│   ├── Show.tsx               # Individual match betting
│   └── History.tsx            # Betting history
├── components/features/betting/
│   ├── BettingMarketCard.tsx  # Market display component
│   ├── BetSlip.tsx           # Bet placement form
│   ├── OddsDisplay.tsx       # Odds visualization
│   └── BettingHistory.tsx    # History component
├── stores/bettingStore.ts     # Betting state management
├── apis/betting.ts            # Betting API calls
└── types/betting.types.ts     # TypeScript definitions
```

## 🗃️ Database Schema

### Core Tables

#### `betting_markets`
```sql
id, game_match_id, market_type, name, description, 
is_active, opens_at, closes_at, settled_at, status,
created_at, updated_at
```

#### `market_options`
```sql
id, betting_market_id, key, name, 
odds, total_stake, is_active, 
created_at, updated_at
```

#### `bets`
```sql
id, user_id, betting_market_id, market_option_id,
stake_amount, potential_payout, actual_payout,
status, placed_at, settled_at, payment_reference,
payment_method, created_at, updated_at
```

#### `bet_outcomes`
```sql
id, betting_market_id, winning_option_id, 
actual_result, settled_by, settled_at,
created_at, updated_at
```

### Market Types
- **1X2**: Home Win (1), Draw (X), Away Win (2)
- **PLAYER_SCORING**: Individual player scoring markets
- **CORRECT_SCORE**: Exact match score prediction
- **TOTAL_GOALS**: Over/Under goals in match

## 🎲 Betting Flow

### Data Structure Clarification
**IMPORTANT CORRECTION**: Betting markets are tied to individual `game_matches` (specific matches between two teams) rather than `match_sessions` (entire session events). This allows for:
- Specific team-vs-team betting
- More granular market control
- Better odds calculation per individual match
- Clearer settlement based on actual match results

### Flow Overview
1. **Match Session** contains multiple **Game Matches**
2. Each **Game Match** can have **Betting Markets** enabled
3. **Market Options** define the specific bets (Team A win, Draw, Team B win)
4. **Bets** are placed on specific **Market Options** for individual **Game Matches**

### 1. Market Discovery
- List upcoming game matches with betting enabled
- Group by match session for better organization
- Filter by date, turf, time
- Display available markets per game match

### 2. Bet Placement
- Select specific game match
- Choose market and option (Team A, Draw, Team B)
- Enter stake amount
- View potential payout
- Confirm payment method
- Submit bet

### 3. Bet Management
- View active bets organized by game matches
- Track bet status per individual match
- Access betting history with match details
- Claim winnings based on match results

## 💰 Payment Integration

### Online Payments
- Integrate with existing PaymentService
- Add `Payment::TYPE_BET` payment type
- Use Paystack for instant payments

### Offline Payments
- Receipt upload functionality
- Manual verification by turf managers
- Pending bet status until confirmed

## 🎯 User Roles & Permissions

### Players
- View available markets
- Place bets within limits
- Access betting history
- Claim winnings

### Turf Managers
- Enable/disable betting for individual game matches
- Set market options and limits per match
- Verify offline payments
- Settle disputed match outcomes

### Super Admins
- System-wide betting controls
- Audit trail access
- Manual intervention capabilities

## 🚀 Implementation Phases

### Phase 1: Core Infrastructure (Tasks 1-5)
- Database schema and models
- Basic API endpoints
- Core service layer

### Phase 2: Frontend Foundation (Tasks 6-12)
- TypeScript types and API module
- Store implementation
- Basic UI components and pages

### Phase 3: Payment & Settlement (Tasks 13-17)
- Payment integration
- Odds calculation system
- Settlement workflow

### Phase 4: Polish & Testing (Tasks 18-20)
- Dashboard integration
- Comprehensive testing
- Documentation updates

## 🎨 UI Components Design

### BettingMarketCard
```tsx
interface BettingMarketCardProps {
  market: BettingMarket;
  onBetPlace: (option: MarketOption, stake: number) => void;
}
```
- Display market name and description
- Show all available options with odds
- Quick bet placement interface
- Visual indicators for popular bets

### BetSlip
```tsx
interface BetSlipProps {
  selectedOptions: SelectedBet[];
  onStakeChange: (betId: string, stake: number) => void;
  onPlaceBets: () => void;
}
```
- Multiple bet management
- Stake calculator with payout preview
- Payment method selection
- Bet confirmation interface

### OddsDisplay
```tsx
interface OddsDisplayProps {
  odds: number;
  trend?: 'up' | 'down' | 'stable';
  format?: 'decimal' | 'fractional';
}
```
- Real-time odds updates
- Visual trend indicators
- Multiple odds formats support

## 🔒 Security Considerations

### Bet Integrity
- Bet locking before match start
- Stake limits per user/market
- Fraud detection algorithms
- Audit trails for all actions

### Payment Security
- Secure payment processing
- Receipt verification workflow
- Anti-money laundering checks
- Transaction monitoring

## 📱 Mobile Optimization

### Touch-Friendly Interface
- Large tap targets for odds selection
- Swipe gestures for market navigation
- Quick bet shortcuts
- Simplified stake input

### Performance
- Lazy loading for large market lists
- Efficient odds update mechanisms
- Offline betting history caching
- Progressive Web App features

## 🎯 Success Metrics

### User Engagement
- Betting participation rate
- Average bets per user per session
- Return betting frequency
- Market popularity analytics

### Business Metrics
- Total betting volume
- Revenue from betting commissions
- Payment method distribution
- Settlement accuracy rate

This plan provides a comprehensive roadmap for implementing the betting system while maintaining TurfHub's design principles and architecture patterns. The phased approach ensures manageable development cycles with early value delivery.
