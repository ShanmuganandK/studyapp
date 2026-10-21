# TESTER-PROTOCOL.md — the closed test (TRACKER L9), step by step

> **Draft, 2026-10-20.** Written by a coding agent for the founder to review and own. The **app side** (what the
> app records and shows) is checked against the code. The **Play Console side** (how testers are added and
> opt in) is the founder's to confirm in the console; it is marked **[confirm in Play Console]** below, because
> that process is outside the repo and changes. Nothing here has been tried with real testers yet.

**What this test is for.** One question: *do children come back?* The bar (DECISIONS 2026-10-20, TRACKER L8):

> At least **7 of 12** children practise on **3 or more different days in week 1**, and on **2 or more different
> days in week 2.**

It is also the Play requirement for a personal developer account: 12 testers opted in for 14 continuous days
(DECISIONS 2026-09-23).

---

## Part A — for the founder

### A1. What the app measures (verified in the code)

- A **practice day** is a calendar day (the phone's own local date) on which the child **finished a session**,
  meaning they reached the "Great job!" summary screen. A round left half-way does not count.
- The app keeps only the **dates** on the phone (`tinku:v1:practiceDays`): no name, no skill, no time of day.
  Nothing is sent anywhere.
- **Week 1 / week 2 run from the child's first practice day**, not the install day or the calendar week.
  Week 1 = that day and the next 6; week 2 = the 7 days after. The parent screen shows **"Days practised: N"**
  and **"First week: a of 7 days"**, and **"Second week: b of 7 days"** once 7 days have passed since the first
  practice day.
- The progress export file also carries the exact list of dates (`practiceDays`). It is the precise record.

### A2. Before you start

1. **A build testers can install.** The signed release AAB has **never been built** and Play account
   verification (L2) is pending, so the Play route is not open yet (ANDROID-RELEASE-RUNBOOK.md). Until then you can
   dry-run this protocol with 2–3 people on the website (`https://tinku.stringus.com`, "Add to Home screen"), but a
   website install does **not** count towards Play's 12 testers.
2. **Recruit more than 12.** The bar needs 7 of 12 and Play needs 12 opted in for 14 *continuous* days, so a few
   dropouts hurt. A reasonable buffer is 16–20 sign-ups (a suggestion, not a rule). **[confirm in Play Console]**
   how testers are added (tester list or Google Group) and what link they use to opt in.
3. **One child, one phone.** The app has one progress store per device. If two siblings share a phone their days
   mix and the count is meaningless. Tell parents: one child per phone for this test.
4. **Give each tester a code** (T01, T02, …). Keep the list of who is which code in a file **outside this
   repo**. Ask for a child's name or photo **never**; the parent's WhatsApp number is how they reach you, and you
   already hold it.
5. Start every tester on the **same day** if you can, so day 7 and day 14 fall together and chasing is one
   message, not twelve.

### A3. Timeline

| When | What happens |
|---|---|
| Day 0 | Send message 1 (below). The child plays once that day if possible. |
| Day 3 | Optional nudge to anyone who has not opened it: message 2. Do **not** nudge about playing more often; that would bias the result. |
| Day 7 | Send message 3. Collect the screenshot or file. |
| Day 14 | Send message 4. Collect the file (preferred) or screenshot. Optional message 5 (three questions). |
| Day 15+ | Score it (A4) and record the result in DECISIONS.md. |

### A4. Scoring

For each tester, from the **export file** (`practiceDays`, a list of dates) or the **day-14 screenshot**:

- **Week 1 days** = number of dates within 7 days starting from the first date.
- **Week 2 days** = number of dates in the next 7 days.
- A child **passes** with week 1 ≥ 3 **and** week 2 ≥ 2.

The test **meets the bar** if **7 or more of 12** pass. With more than 12 testers, score the 12 you would have had
if you decide the cohort up front (say, the first 12 who started); do not pick the best 12 afterwards. Write
the decision rule down before day 0.

Treat these as **not scorable, not failures**, and say how many there were: a shared phone, an uninstall or
"clear data" mid-test (that wipes the dates), no reply by day 15.

### A5. If the bar is missed

That is a result, not a bug. Do not change the bar afterwards. Read the optional answers in message 5 and the
parent-screen detail before deciding what to build. The average-learner decision (DECISIONS 2026-08-25) says take
the gentler branch: a miss more likely means "too hard, too soon" or "nothing to come back for" than "needs a
streak counter".

---

## Part B — messages to send (WhatsApp-ready, plain language)

**Message 1 — Day 0 (welcome and install).**
> Hi! Thank you for helping test Tinku Math, a maths app for Class 1 and 2. For the next 2 weeks please let your
> child use it on **one phone only**, the way you normally would. There is nothing to do every day and no right
> amount of playing. Please **do not uninstall it or clear its data**, or the test cannot count. Install it here:
> *[opt-in link from Play Console]*. When it asks which class your child is in, pick their class. The app keeps
> everything on your phone. It never asks for your child's name. Your tester code is **T__**.

**Message 2 — Day 3 (only if they have not opened it).**
> Hi! Just checking the install worked, since I can't see anything from my side. If anything didn't work, tell me
> what you saw and which phone it is.

**Message 3 — Day 7 (screenshot).**
> One week in. Please open the app, tap **Parent** (bottom of the Home screen), and send me a **screenshot** of
> that screen. The part I need is "Days practised" and "First week". If a passcode is set, enter it. Please
> don't send any photo of your child. Thank you! Code: T__.

**Message 4 — Day 14 (the file).**
> Last step. Please open the app, tap **Parent**, then **Export progress**, and send me the file it makes (it is
> named like `tinku-math-progress-2026-11-03.json`). On Android a share menu appears; choose WhatsApp and send it to
> me. The file has only your child's practice dates and skill levels, no name. If you can't do that, a
> **screenshot** of the Parent screen is fine. Thank you very much! Code: T__.

**Message 5 — Day 14, optional (three questions, any answer is useful).**
> 1. Did your child ever ask to play without being told? 2. Was it too easy, too hard, or about right? 3. Did
> anything confuse you or your child? A short reply is plenty.

---

## Part C — things to know

- **What a tester's phone shows** (verified in the code): the Parent screen has the practice-day figures under the
  skills list, an **Export progress** button, a **Class** section, and a **Colours** section. The warm-up
  experiment is **not** shown in a Play or website build; it appears only in the CI debug APK
  (`VITE_TESTER_TOOLS`, DECISIONS 2026-10-20).
- **Reading a screenshot** is easy but less exact than the file: "First week: a of 7 days" is counted from the
  child's first practice day. The "Second week" figure appears only after 7 days have passed since then.
- **Not verified yet:** none of this has been run on a real phone with a real parent. The first thing to learn from
  the dry run is whether the **Export progress** share sheet works on a typical tester's phone; if not, fall back to
  screenshots and note it.
- **Privacy.** The export file and screenshots contain no child identifier. The parent is voluntarily messaging you
  on WhatsApp. Do not store the files with a child's name; keep them under the tester code. This test does not
  change what the privacy policy says, because the app still sends nothing.
