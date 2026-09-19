/** Hinglish dictionary (part 4) — admin command center, screenreader labels, form hints. */
export const hinglish4 = {
  /* ---------- a11y (screenreader only) ---------- */
  'a11y.mainNav': 'Main navigation',
  'a11y.primaryNav': 'Primary navigation',
  'a11y.openMenu': 'Navigation menu kholo',
  'a11y.closeMenu': 'Navigation menu band karo',
  'a11y.accountMenu': 'Account menu',
  'a11y.changeLanguage': 'Language change karo',
  'a11y.dismiss': 'Notification dismiss karo',
  'a11y.openGiftBox': 'Gift box kholo',
  'a11y.pollChart': 'Poll votes bar chart',
  'a11y.prevDay': 'Pichla din',
  'a11y.nextDay': 'Aglaa din',
  'a11y.dishName': 'Dish ka naam',
  'a11y.emoji': 'Dish emoji',
  'a11y.points': 'Reward points',
  'a11y.message': 'Broadcast message',
  'a11y.seatsUsed': 'Seats use hui',
  'a11y.studentId': 'Student ID ya registered email',
  'a11y.password': 'Password',
  'a11y.otp': 'OTP (one-time password)',
  'a11y.adminKey': 'Admin Key',
  'a11y.facultyId': 'Staff ID',

  /* ---------- admin · headcount ---------- */
  'admin.slotLunch': 'Lunch slot',
  'admin.acrossSlots': 'sab slots me',
  'admin.estNoShows': 'est. no-shows',
  'admin.estThisSlot': 'is slot ke liye',
  'admin.liveOccupancy': 'Live occupancy',
  'admin.perSlot': 'Per-slot headcount',
  'admin.optInVsOut': 'Opt-in vs Opt-out (aaj)',
  'admin.currentMealSlot': 'Current meal slot',

  /* ---------- admin · menu planner ---------- */
  'admin.draft': 'Draft',
  'admin.mealScheduleSub': 'Meal schedule aur menu items',
  'admin.pollResults': 'Poll results',
  'admin.weekendVoting': 'Weekend special voting',
  'admin.analyticsLink': 'Analytics',
  'admin.dishPlaceholder': 'Dish (e.g. Paneer Tikka)',
  'admin.votesWord': 'votes',

  /* ---------- admin · reward engine ---------- */
  'admin.activeStudents': 'Active students',
  'admin.pointsGiven7d': 'Diye gaye points (7 din)',
  'admin.onlineNowCount': 'abhi online: {n}',
  'admin.vsLastWeek': '+18% vs pichla hafte',
  'admin.perksRedeemed': 'Perks redeem hui',
  'admin.weekToDate': 'week-to-date',
  'admin.broadcastReward': 'Broadcast reward',
  'admin.sendToSegment': 'Ek segment ko points bhejo',
  'admin.adminOnly': 'Admin only',
  'admin.broadcastPlaceholder': 'jaise +20 eco opt-out ke liye',
  'admin.recentBroadcasts': 'Recent broadcasts',
  'admin.approvalLog': 'Approval log',

  /* ---------- admin · budget & triage ---------- */
  'admin.wastageRisk': 'Wastage risk',
  'admin.greeting': 'Namaste — {date} · {slot} active.',
  'admin.rewardsPending': 'Rewards pending',
  'admin.approvalQueue': 'Approval queue',
  'admin.spendVsAllocation': 'Spend vs allocation',
  'admin.budgetLabel': 'budget',
  'admin.liveTriage': 'Live triage',
  'admin.urgentQueue': 'Urgent queue',

  /* ---------- auth field hints ---------- */
  'auth.studentIdPlaceholder': 'jaise STU-23045',
  'auth.adminKeyPlaceholder': 'HUB-XXXX',
  'auth.facultyPlaceholder': 'STF-1001',

    /* ---------- Wallet label ---------- */
  'wallet.creditsUsed': 'credits used',
  'wallet.ofMonthly': '{used} of {total} monthly',
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
  'dash.weeklyMenuPoll': 'Weekly Menu Poll',
  'dash.weekendVoting': 'Weekend special voting',
  'dash.pollBannerTitle': 'Weekly Menu Poll',
  'dash.pollBannerSub': 'Weekend special voting',
  'dash.pollBadge': 'Live',
  'dash.voteNow': 'Vote now',

  /* ---------- Mess · poll section ---------- */
  'mess.pollTitle': 'Weekly Special · Vote',
  'mess.pollSub': 'Weekend dish poll — closes in 2 days',
  'mess.pollBadgeOpen': 'Open',
  'mess.voted': '✓ Vote',
  'mess.votesCast': '✓ {total} votes cast · hostel management reviews results on Sunday.',
  'mess.totalVotesCast': '{total} votes cast'
} as const;
