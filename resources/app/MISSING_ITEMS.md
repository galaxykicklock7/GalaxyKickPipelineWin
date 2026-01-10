# Missing Items from src/ (Excluding AI Mode)

## 1. ❌ handleJoinLowSec - MISSING from src/game/gameLogic.js

**Location in original**: game-logic-final.js lines 2600-2679
**Purpose**: Handles JOIN messages in low sec mode (attacks non-whitelisted users)
**Status**: **MISSING** - Need to add

## 2. ❌ Message Routing in socketManager.js - INCOMPLETE

**Current state**: Only handles PING, 353, and 900
**Missing handlers**:
- JOIN messages → gameLogic.handleJoinMessage
- PART messages → gameLogic.handlePartMessage
- SLEEP messages → gameLogic.handleSleepMessage
- 850 messages → gameLogic.handle850Message
- 452 messages → gameLogic.handle452Message
- 860 messages → gameLogic.handle860Message
- 471 messages → gameLogic.handle471Message (optional)

**Status**: **INCOMPLETE** - Need to add message routing

## 3. ⚠️ handle471Message - OPTIONAL

**Location in original**: game-logic-final.js lines 2715-2718
**Purpose**: Logs channel error
**Code**:
```javascript
handle471Message(ws, snippets, text) {
  this.addLog(this.wsNumber, `⚠️ Error 471: Channel issue`);
}
```
**Status**: **OPTIONAL** - Can add if needed

## 4. ⚠️ handle900Message routing - INCORRECT

**Current**: socketManager calls `gameLogic.handle353Message` for 900 messages
**Should**: Call `gameLogic.handle900Message`
**Status**: **INCORRECT** - Need to fix

## Summary

### Critical Missing Items:
1. ❌ **handleJoinLowSec** method in gameLogic.js
2. ❌ **Message routing** in socketManager.js (JOIN, PART, SLEEP, 850, 452, 860)
3. ❌ **Correct 900 routing** in socketManager.js

### Optional Missing Items:
1. ⚠️ **handle471Message** in gameLogic.js (just logs error)

## Action Required

Add these missing pieces to make the code complete!
