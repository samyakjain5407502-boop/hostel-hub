/**
 * English dictionary (part 4) — admin command centre, auth field hints and
 * accessibility labels. Kept separate so the admin vocabulary is reviewable
  * on its own: these strings are read once at the admin's desk, not by students.
 */
export const en4 = {
  /* ---------- Accessibility (screen-reader only) ---------- */
  'a11y.mainNav': 'Main navigation',
  'a11y.primaryNav': 'Primary navigation',
  'a11y.openMenu': 'Open navigation menu',
  'a11y.closeMenu': 'Close navigation menu',
  'a11y.accountMenu': 'Account menu',
  'a11y.changeLanguage': 'Change language',
  'a11y.dismiss': 'Dismiss notification',
  'a11y.openGiftBox': 'Open gift box',
  'a11y.pollChart': 'Poll votes bar chart',
  'a11y.prevDay': 'Previous day',
  'a11y.nextDay': 'Next day',
  'a11y.dishName': 'Dish name',
  'a11y.emoji': 'Dish emoji',
  'a11y.points': 'Reward points',
  'a11y.message': 'Broadcast message',
  'a11y.seatsUsed': 'Seats used',
  'a11y.studentId': 'Student ID or registered email',
  'a11y.password': 'Password',
  'a11y.otp': 'One-time password',
  'a11y.adminKey': 'Admin key',
  'a11y.facultyId': 'Staff ID',

  /* ---------- Admin · headcount ---------- */
  'admin.slotLunch': 'Lunch slot',
  'admin.acrossSlots': 'across all slots',
  'admin.estNoShows': 'est. no-shows',
  'admin.estThisSlot': 'est. for this slot',
  'admin.liveOccupancy': 'Live occupancy',
  'admin.perSlot': 'Per-slot headcount',
  'admin.optInVsOut': 'Opt-in vs opt-out (today)',
  'admin.currentMealSlot': 'Current meal slot',

  /* ---------- Admin · menu planner ---------- */
  'admin.draft': 'Draft',
  'admin.mealScheduleSub': 'Meal schedule & menu items',
  'admin.pollResults': 'Poll results',
  'admin.weekendVoting': 'Weekend special voting',
  'admin.analyticsLink': 'Analytics',
  'admin.dishPlaceholder': 'Dish (e.g. Paneer Tikka)',
  'admin.votesWord': 'votes',

  /* ---------- Admin · reward engine ---------- */
  'admin.activeStudents': 'Active students',
  'admin.pointsGiven7d': 'Points given (7d)',
  'admin.onlineNowCount': 'online now: {n}',
  'admin.vsLastWeek': '+18% vs last week',
  'admin.perksRedeemed': 'Perks redeemed',
  'admin.weekToDate': 'week-to-date',
  'admin.broadcastReward': 'Broadcast reward',
  'admin.sendToSegment': 'Send points to a segment',
  'admin.adminOnly': 'Admin only',
  'admin.broadcastPlaceholder': 'e.g. +20 eco for opting out',
  'admin.recentBroadcasts': 'Recent broadcasts',
  'admin.approvalLog': 'Approval log',

  /* ---------- Admin · budget & triage ---------- */
  'admin.wastageRisk': 'Wastage risk',
  'admin.greeting': 'Good afternoon — {date} · {slot} active.',
  'admin.rewardsPending': 'Rewards pending',
  'admin.approvalQueue': 'approval queue',
  'admin.spendVsAllocation': 'Spend vs allocation',
  'admin.budgetLabel': 'budget',
  'admin.liveTriage': 'Live triage',
  'admin.urgentQueue': 'Urgent queue',

  /* ---------- Auth field hints ---------- */
  'auth.studentIdPlaceholder': 'e.g. STU-23045',
  'auth.adminKeyPlaceholder': 'HUB-XXXX',
  'auth.facultyPlaceholder': 'STF-1001',

  /* ---------- Wallet label ---------- */
  'wallet.creditsUsed': 'credits used',
  'wallet.ofMonthly': '{used} of {total} monthly',

  /* ---------- Wallet page ---------- */
  'wallet.transactions': "Today's transactions",
  'wallet.transactionsSub': 'Credit spend per meal',
  

  'wallet.rechargeSub': 'Mess card kiosk · Lobby Desk',
  'wallet.rechargeHint': 'Recharge +120 credits from the hostel office or pay online via UPI.',
  

  'wallet.breakfast': 'Breakfast',
  'wallet.lunch': 'Lunch',
  'wallet.lunchToday': 'Lunch (Today)',
  'wallet.dinner': 'Dinner',
  'wallet.dinnerYesterday': 'Dinner (Yesterday)',
  'wallet.snacks': 'Snacks',

  /* ---------- Dashboard home ---------- */
  'dash.welcome': 'Namaste, {name} 👋',
  'dash.planLine': '{today} — {meal}.',
  'dash.planLinePlaceholder': 'no active meal slot',
  'dash.pollBannerTitle': 'Weekly Menu Poll',
  'dash.pollBannerSub': 'Weekend special voting',
  'dash.pollBadge': 'Live',
  'dash.voteNow': 'Vote now',
  'dash.weeklyMenuPoll': 'Weekly Menu Poll',
  'dash.weekendVoting': 'Weekend special voting',

  /* ---------- Mess · poll section ---------- */
  'mess.pollTitle': 'Weekly Special · Vote',
  'mess.pollSub': 'Weekend dish poll — closes in 2 days',
  'mess.pollBadgeOpen': 'Open',
  'mess.voted': '✓ Vote',
  'mess.votesCast': '✓ {total} votes cast · Hostel management reviews results on Sunday.',
  'mess.totalVotesCast': '{total} votes cast'

  // __NEXT_BLOCK__
} as const;
