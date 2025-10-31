# Phase 3 - Game Logic Testing Guide

## 🎮 What's New in Phase 3

You can now:
- ✅ Create games with different stake levels ($5, $10, $15)
- ✅ Matchmaking (join waiting games automatically)
- ✅ Play domino tiles on the board
- ✅ Draw tiles from boneyard
- ✅ Pass turns when cannot play
- ✅ Automatic game end detection (domino or blocked game)
- ✅ Automatic wallet updates (winner paid, loser charged)
- ✅ Complete game history
- ✅ Anti-cheat validation (server-side only)

---

## 🧪 Testing Scenario

We'll simulate a complete 2-player game using 2 different user accounts.

### Preparation

1. Register 2 users (or use existing ones):
   - Player 1: `alice@example.com`
   - Player 2: `bob@example.com`

2. Add funds to both wallets:
   ```
   POST /api/wallet/transaction
   { "amount": 100 }
   ```

3. Get tokens for both users (save them)

---

## Test 1: Create a Game (Player 1)

**Request:**
```
POST http://localhost:5000/api/games/create
Authorization: Bearer <ALICE_TOKEN>
Content-Type: application/json

{
  "stakeLevel": 10
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Game created. Waiting for an opponent.",
  "data": {
    "_id": "671234...",
    "gameMode": "draw",
    "stakeLevel": 10,
    "entryFee": 10,
    "status": "waiting",
    "players": [
      {
        "userId": "...",
        "username": "alice",
        "avatar": "default_avatar.png",
        "hand": [],
        "isConnected": true
      }
    ]
  }
}
```

**What Happens:**
- $10 locked from Alice's wallet
- Game created in "waiting" status
- Alice is waiting for opponent

**Copy the `_id` - you'll need it!**

---

## Test 2: Join the Game (Player 2)

**Request:**
```
POST http://localhost:5000/api/games/create
Authorization: Bearer <BOB_TOKEN>
Content-Type: application/json

{
  "stakeLevel": 10
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Joined game. Game starting!",
  "data": {
    "_id": "671234...",
    "gameMode": "draw",
    "stakeLevel": 10,
    "totalPot": 20,
    "status": "active",
    "players": [
      {
        "userId": "...",
        "username": "alice",
        "hand": [
          { "left": 6, "right": 4 },
          { "left": 5, "right": 2 },
          // ... 7 tiles total
        ]
      },
      {
        "userId": "...",
        "username": "bob",
        "hand": "[7 tiles]",  // Hidden from Alice
        "handCount": 7
      }
    ],
    "board": [],
    "boneyardCount": 14,
    "currentTurn": "...",  // Alice's user ID (Player 1 starts)
    "turnNumber": 1,
    "startedAt": "2025-10-27T..."
  }
}
```

**What Happens:**
- $10 locked from Bob's wallet
- Game starts with status "active"
- 28 tiles shuffled: 7 to Alice, 7 to Bob, 14 in boneyard
- Alice's turn (Player 1 always starts)
- Each player can only see their own hand

---

## Test 3: Get Game State

**Request (as Alice):**
```
GET http://localhost:5000/api/games/<GAME_ID>
Authorization: Bearer <ALICE_TOKEN>
```

**Response:**
Shows Alice her own hand, hides Bob's hand, shows board and whose turn it is.

---

## Test 4: Alice Makes First Move

**Request:**
```
POST http://localhost:5000/api/games/<GAME_ID>/move
Authorization: Bearer <ALICE_TOKEN>
Content-Type: application/json

{
  "tile": { "left": 6, "right": 4 },
  "position": "start"
}
```

**Validation:**
- ✅ Is it Alice's turn? (YES)
- ✅ Does Alice have this tile? (SERVER CHECKS - ANTI-CHEAT)
- ✅ Can this tile be played? (YES - first tile)

**Expected Response:**
```json
{
  "success": true,
  "message": "Move successful.",
  "data": {
    "board": [
      { "left": 6, "right": 4 }
    ],
    "currentTurn": "...",  // Now Bob's turn
    "turnNumber": 2,
    "players": [
      {
        "username": "alice",
        "hand": [
          { "left": 5, "right": 2 },
          // ... 6 tiles remaining
        ],
        "movesCount": 1
      },
      {
        "username": "bob",
        "hand": "[7 tiles]"
      }
    ],
    "moves": [
      {
        "moveNumber": 1,
        "userId": "...",
        "action": "place",
        "tile": { "left": 6, "right": 4 },
        "position": "start",
        "timestamp": "..."
      }
    ]
  }
}
```

**Board Endpoints:** `[6]` on left, `[4]` on right

---

## Test 5: Bob's Turn - Invalid Move (Anti-Cheat Test)

**Request:**
```
POST http://localhost:5000/api/games/<GAME_ID>/move
Authorization: Bearer <BOB_TOKEN>
Content-Type: application/json

{
  "tile": { "left": 3, "right": 2 },
  "position": "end"
}
```

**Scenario:** Bob tries to play a tile that doesn't match the endpoints (6 or 4).

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid move. This tile doesn't match the board endpoints."
}
```

**Server logs:** `🚨 INVALID MOVE: User <BOB_ID> tried invalid move`

---

## Test 6: Bob's Turn - Valid Move

**Request:**
```
POST http://localhost:5000/api/games/<GAME_ID>/move
Authorization: Bearer <BOB_TOKEN>
Content-Type: application/json

{
  "tile": { "left": 4, "right": 2 },
  "position": "end"
}
```

**Validation:**
- ✅ Is it Bob's turn? (YES)
- ✅ Does Bob have [4|2]? (SERVER CHECKS)
- ✅ Can it be played? (YES - matches right endpoint 4)

**Board After:** `[6|4] -> [4|2]`  
**Endpoints:** `[6]` on left, `[2]` on right

---

## Test 7: Cannot Play - Draw from Boneyard

**Scenario:** Alice has no tiles matching 6 or 2.

**Request:**
```
POST http://localhost:5000/api/games/<GAME_ID>/draw
Authorization: Bearer <ALICE_TOKEN>
```

**Expected Response (if drawn tile can be played):**
```json
{
  "success": true,
  "message": "Tile drawn. You can play it!",
  "data": {
    "players": [
      {
        "username": "alice",
        "hand": [
          // ... now 7 tiles
        ],
        "drawsCount": 1
      }
    ],
    "boneyardCount": 13
  },
  "canPlay": true
}
```

**If drawn tile cannot be played:**
- Turn switches to Bob automatically
- Alice now has 7 tiles (was 6)

---

## Test 8: Pass Turn (Boneyard Empty)

**Scenario:** Boneyard is empty and player cannot play.

**Request:**
```
POST http://localhost:5000/api/games/<GAME_ID>/pass
Authorization: Bearer <ALICE_TOKEN>
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Turn passed.",
  "data": {
    "players": [
      {
        "username": "alice",
        "passCount": 1
      }
    ],
    "lastMoveWasPass": true,
    "consecutivePasses": 1
  }
}
```

---

## Test 9: Game End - Player Runs Out of Tiles

**Scenario:** Alice plays her last tile.

**Expected Response:**
```json
{
  "success": true,
  "message": "Game over! alice wins!",
  "data": {
    "status": "completed",
    "winner": "<ALICE_USER_ID>",
    "winnerPayout": 18,  // $20 pot - 10% fee = $18
    "loserLoss": 10,
    "platformFee": 2,
    "completedAt": "2025-10-27T...",
    "duration": 180,  // seconds
    "players": [
      {
        "username": "alice",
        "isWinner": true,
        "payout": 18,
        "hand": [],
        "score": 0
      },
      {
        "username": "bob",
        "isWinner": false,
        "payout": 0,
        "hand": [
          { "left": 5, "right": 3 },
          // remaining tiles
        ],
        "score": 8  // sum of remaining tile pips
      }
    ]
  }
}
```

**What Happens Automatically:**
1. ✅ Alice's wallet: +$18, unlock $10 (net +$8)
2. ✅ Bob's wallet: unlock $10 (net -$10)
3. ✅ Alice's stats: totalGames+1, wins+1, currentStreak+1
4. ✅ Bob's stats: totalGames+1, losses+1, currentStreak=0
5. ✅ Transaction logged in both wallets

---

## Test 10: Game End - Blocked Game (Both Pass)

**Scenario:** Both players pass consecutively.

**Expected:** Server calculates score (sum of remaining pips). Lower score wins.

```json
{
  "success": true,
  "message": "Game over! bob wins!",
  "data": {
    "status": "completed",
    "winner": "<BOB_USER_ID>",
    "players": [
      {
        "username": "alice",
        "score": 15,  // sum of her remaining tiles
        "isWinner": false
      },
      {
        "username": "bob",
        "score": 8,   // lower score = winner
        "isWinner": true,
        "payout": 18
      }
    ]
  }
}
```

---

## Test 11: Get Game History

**Request:**
```
GET http://localhost:5000/api/games/history?page=1&limit=10
Authorization: Bearer <ALICE_TOKEN>
```

**Expected Response:**
```json
{
  "success": true,
  "count": 1,
  "total": 1,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "...",
      "gameMode": "draw",
      "stakeLevel": 10,
      "status": "completed",
      "winner": {
        "username": "alice",
        "avatar": "..."
      },
      "players": [...],
      "duration": 180,
      "createdAt": "...",
      "completedAt": "..."
    }
  ]
}
```

---

## Test 12: Cancel Waiting Game

**Scenario:** Alice creates a game but changes her mind before opponent joins.

**Request:**
```
DELETE http://localhost:5000/api/games/<GAME_ID>
Authorization: Bearer <ALICE_TOKEN>
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Game cancelled successfully."
}
```

**What Happens:**
- Game status → "cancelled"
- $10 unlocked from Alice's wallet

---

## Test 13: Check Wallet After Game

**Request:**
```
GET http://localhost:5000/api/wallet/balance
Authorization: Bearer <ALICE_TOKEN>
```

**Expected (Alice won):**
```json
{
  "success": true,
  "data": {
    "balance": 108,  // Started with 100, won 18, lost 10 stake = +8
    "lockedBalance": 0,
    "availableBalance": 108
  }
}
```

**Check transactions:**
```
GET http://localhost:5000/api/wallet/transactions?page=1&limit=10
Authorization: Bearer <ALICE_TOKEN>
```

**Expected:**
```json
{
  "success": true,
  "data": [
    {
      "type": "win",
      "amount": 18,
      "balanceBefore": 90,
      "balanceAfter": 108,
      "description": "Won game against opponent",
      "gameId": "...",
      "status": "completed"
    }
  ]
}
```

---

## 🛡️ Security Tests

### Test 14: Try to Play Opponent's Tile (Anti-Cheat)

**Request:**
```
POST http://localhost:5000/api/games/<GAME_ID>/move
Authorization: Bearer <ALICE_TOKEN>
Content-Type: application/json

{
  "tile": { "left": 3, "right": 3 },  // Tile Alice doesn't have
  "position": "end"
}
```

**Expected:**
```json
{
  "success": false,
  "message": "You don't have this tile."
}
```

**Server logs:** `🚨 CHEAT ATTEMPT: User <ALICE_ID> tried to play tile they don't have`

---

### Test 15: Try to Move on Opponent's Turn

**Request (Alice tries to move on Bob's turn):**
```
POST http://localhost:5000/api/games/<GAME_ID>/move
Authorization: Bearer <ALICE_TOKEN>
```

**Expected:**
```json
{
  "success": false,
  "message": "It's not your turn."
}
```

---

### Test 16: Try to View Opponent's Hand

**Response:** Opponent's hand is ALWAYS hidden in API responses.

Alice sees:
```json
{
  "username": "bob",
  "hand": "[7 tiles]",
  "handCount": 7
}
```

Bob NEVER receives Alice's actual tiles in the response.

---

## ✅ Success Checklist

After running all tests, verify:

- [ ] Games created with different stake levels
- [ ] Automatic matchmaking works
- [ ] Funds locked when game starts
- [ ] Tiles properly shuffled and distributed (7 each, 14 boneyard)
- [ ] Only valid moves accepted (anti-cheat working)
- [ ] Cannot play opponent's tiles
- [ ] Cannot move on opponent's turn
- [ ] Draw from boneyard works
- [ ] Pass turn works
- [ ] Game ends when player runs out of tiles
- [ ] Game ends when both players pass (blocked game)
- [ ] Winner calculated correctly (domino or lowest score)
- [ ] Wallets updated automatically (winner +payout, loser -stake)
- [ ] User statistics updated (wins, losses, streaks)
- [ ] Transaction history logged
- [ ] Game history accessible
- [ ] Opponent's hand always hidden

---

## 🎯 What's Next?

✅ Phase 1: Authentication - COMPLETE  
✅ Phase 2: Wallet System - COMPLETE  
✅ Phase 3: Game Logic - COMPLETE  
🔜 Phase 4: Socket.io (Real-time gameplay)  
🔜 Phase 5: Leaderboard System  

---

## 🐛 Common Issues

### "Insufficient funds"
→ Add money to wallet first: POST /api/wallet/transaction

### "You are already in an active game"
→ Finish or cancel current game first

### "Invalid move"
→ Check board endpoints, tile must match one endpoint

### "It's not your turn"
→ Wait for opponent to play

### "Boneyard is not empty. You must draw."
→ Cannot pass if boneyard has tiles

### "You have a playable tile. Cannot draw/pass."
→ Must play if you have a valid tile

---

**Happy Testing! 🎮**
