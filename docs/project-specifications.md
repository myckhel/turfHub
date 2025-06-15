### 🧠 Enhanced Project Specification Overview

#### 🎯 **Purpose**

To digitize and streamline the operations of turf-based mini football sessions by mirroring real-life flows for both players and turf managers—including payment, match management, team rotation, and player coordination.

### 👟 Real-Life Flow Breakdown (Modeled in the System)

#### **Player Flow (IRL -> Digital)**

* Arrives at turf → **Sees active/scheduled match sessions**
* Pays to join a team slot → **Joins a team slot in-app; pays online**
* Plays match → **System tracks team status based on results**
* If win → **Team continues**
* If lose → **Team waits turn**
* If draw → **Both wait; random selection next**

#### **Turf Manager Flow (IRL -> Digital)**

* Starts match session → **Creates session; system creates team slots (4–8)**
* Assigns players → **Manual or auto-assignment from payees**
* Manages match events → **Tracks scores, substitutions, cards**
* Handles session queue logic → **System auto-queues next match based on win/loss/draw**
* Ends session → **Stops the session and archives match records**

### 🧩 Core System Design

#### **Entities**

* **User** (can own turfs)
* **Turf**

  * Belongs to a User (admin)
  * May require membership (one-time or recurring)
* **Player** (user within a turf) with roles of player/admin/manager to the turf
* **MatchSession**

  * Belongs to Turf
  * Has morning/evening time slots
* **Team**

  * Belongs to a MatchSession
  * Has Players
  * Has a Captain e.g `captain_id` (first payee player or assigned by manager)
* **Team Player**
  * Belongs to a Team
  * Belongs to a player
* **GameMatch**

  * Belongs to MatchSession
  * Has 2 teams, score, outcome (W/L/D) e.g first_team, second_team
* **MatchEvent**

  * Belongs to a GameMatch
  * Type: red card, yellow card, goal, substitution
  * Refers to specific `player_id`
* **QueueLogic**

  * Maintains order of matches in session
  * Based on outcome rules

### 🔄 Match Rotation Rules (System Logic)

* **Win:** team stays, next team steps in.
* **Loss:** team moves to end of queue.
* **Draw:** both teams step out, random team re-enters first next round.

### 📱 Feature Deep Dive: MVP + Next Phases

#### MVP

* User Auth and Role Assignment (admin/player/manager)
* Turf Management: CRUD turfs, invite members
* GameMatch Session Creation: define time, # of teams
* Team Creation: 3–6 players, captain auto-set
* Player Slot Join/Payment
* GameMatch Queue Engine (basic win/lose/draw logic)
* Real-time visibility of team lineups

#### Phase 2

* In-app notifications (e.g., match ready, next team up)
* GameMatch Event Logging (cards, substitutions)
* Team Captain Invite System
* Membership Payment Setup
* Turf Leaderboard + Session Archive
