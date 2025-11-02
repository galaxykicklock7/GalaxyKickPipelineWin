# Actually Missing Features - Audit Results

After detailed code review of bestscript.js (3360 lines), here are the features still MISSING:

## ❌ **Missing Features**

### 1. **Second JOIN Handler - "Defense" Mode**
**Location:** bestscript.js lines 657-703

**What it does:**
- Uses `waiting` timing instead of `attack` timing
- Only checks gangblacklist (not regular blacklist)
- Sets status to "defense" instead of "attack"
- Different attack strategy

**Impact:** Medium - alternate attack mode not available

---

### 2. **JOIN Target Tracking** (Without Immediate Attack)
**Location:** bestscript.js lines 812-842

**What it does:**
- Adds users to targetids[] array when they JOIN
- Doesn't attack immediately
- Builds target pool for later use

**Current implementation:** We attack immediately on JOIN
**Missing:** Building target pool for smart mode

**Impact:** Low - current immediate attack works

---

### 3. **Timer Shift Feature**
**Location:** bestscript.js lines 119-162, 845-869

**Functions:**
- `incrementAttack()` - Increase attack timing
- `decrementAttack()` - Decrease attack timing  
- `incrementDefence()` - Increase waiting timing
- `decrementDefence()` - Decrease waiting timing

**Triggers:**
- On 3-second event (850 with snippets[6] === "3s") → Increment
- On PART (target leaves before 3-sec) → Decrement

**Config Options:**
- `timershift` (boolean) - Enable/disable
- `incrementvalue` - Amount to increment
- `decrementvalue` - Amount to decrement
- `minatk` - Minimum attack timing
- `maxatk` - Maximum attack timing
- `mindef` - Minimum waiting timing
- `maxdef` - Maximum waiting timing

**Impact:** HIGH - This is advanced timing optimization

---

### 4. **Missing Config Options**

| Config | Type | Purpose | Status |
|--------|------|---------|--------|
| `modena` | boolean | Modena mode | ❌ Not supported |
| `kickbybl` | boolean | Kick by blacklist | ❌ Not supported |
| `dadplus` | boolean | Dad+ mode | ❌ Not supported |
| `kickall` | boolean | Kick all mode | ❌ Not supported |
| `timershift` | boolean | Enable timer shift | ❌ Not supported |
| `kblacklist` | string | Kick blacklist (separate from attack) | ❌ Not supported |
| `kgangblacklist` | string | Kick gang blacklist | ❌ Not supported |
| `incrementvalue` | number | Timer increment amount | ❌ Not supported |
| `decrementvalue` | number | Timer decrement amount | ❌ Not supported |
| `minatk` | number | Min attack timing | ❌ Not supported |
| `maxatk` | number | Max attack timing | ❌ Not supported |
| `mindef` | number | Min waiting timing | ❌ Not supported |
| `maxdef` | number | Max waiting timing | ❌ Not supported |

---

### 5. **Kick Modes (WS5)**
**Location:** bestscript.js ws5 handlers

**What it does:**
- ws5 is dedicated to kicking, not attacking
- Uses kickrc recovery code
- Different action commands
- Separate kick blacklists

**Impact:** HIGH - Complete missing feature set

---

### 6. **PART Handler - Timer Shift Logic**
**Location:** bestscript.js lines 857-902

**Current implementation:** Just removes target and quits

**Missing:**
- Check for `threesec` flag
- Call `decrementAttack()` or `decrementDefence()` based on status
- Only if timershift is enabled

**Impact:** Medium - Timer optimization missing

---

### 7. **SLEEP Handler - Remove from Target Arrays**
**Location:** bestscript.js lines 905-926

**Current implementation:** Basic removal

**Missing:**
- Check if user is in `targetids` array (not just current target)
- Remove from both targetids and attackids arrays
- Handle multiple target removal

**Impact:** Low - Current works but not optimal

---

### 8. **Reconnect Logic**
**Location:** Throughout bestscript.js

**What it does:**
- After QUIT, auto-reconnect after delay
- Uses `reconnect` value from localStorage
- Triggers button click to restart

**Impact:** Medium - Manual restart needed currently

---

### 9. **Work Mode Flag**
**Location:** Variable `work` throughout bestscript.js

**What it does:**
- Controls auto-reconnect behavior
- Set by button toggle
- When false, doesn't reconnect

**Impact:** Low - Can be added to config

---

### 10. **Sleep Function** (OffSleep)
**Location:** bestscript.js (referenced but not shown in excerpts)

**What it does:**
- Something related to sleep.checked
- Called after QUIT in various places

**Impact:** Unknown - Need to find implementation

---

## 📊 **Summary**

### **Critical Missing (HIGH Impact):**
1. ❌ Timer Shift Feature (dynamic timing adjustment)
2. ❌ Kick Modes (ws5, kickrc, kick blacklists)
3. ❌ Defense Mode (second JOIN handler)

### **Important Missing (MEDIUM Impact):**
4. ❌ Reconnect logic
5. ❌ PART timer adjustment
6. ❌ Config options (timershift, modena, kickbybl, etc.)

### **Nice to Have (LOW Impact):**
7. ❌ JOIN target pooling (non-immediate attack)
8. ❌ SLEEP array cleanup improvements
9. ❌ Work mode flag

---

## ✅ **What We DO Have (Working):**

- ✅ All connection handlers
- ✅ Basic 353 processing (both modes)
- ✅ Basic JOIN attack (immediate)
- ✅ PART/SLEEP basic handling
- ✅ Prison escape
- ✅ Auto-release
- ✅ Normal + Low sec modes
- ✅ Blacklist/gangblacklist filtering
- ✅ Attack timing (attack1-4)
- ✅ Waiting timing (waiting1-4)
- ✅ Basic target tracking

---

## 🎯 **Recommended Next Steps**

### **Priority 1: Add Timer Shift**
This is used heavily in the desktop app for optimization.

### **Priority 2: Add Kick Mode**
Complete missing feature set for ws5.

### **Priority 3: Add Defense Mode**
Second JOIN handler with waiting timing.

### **Priority 4: Add Missing Configs**
timershift, kickbybl, modena, dadplus, kickall, etc.

---

## 📝 **Honest Assessment**

**Current Implementation:** ~60-70% of bestscript.js core logic
**Missing:** ~30-40% (mostly advanced features and optimization)

**For basic use (connect + attack blacklisted users):** ✅ SUFFICIENT
**For advanced use (timer optimization, kick modes, etc.):** ❌ INCOMPLETE
