// Enhanced Progress Tracking System
class ProgressTracker {
    constructor(authManager) {
        this.auth = authManager;
        this.streakKey = 'learning_streak';
        this.lastLoginKey = 'last_login_date';
    }

    updateStreak() {
        const today = new Date().toDateString();
        const lastLogin = localStorage.getItem(this.lastLoginKey);
        let streak = parseInt(localStorage.getItem(this.streakKey)) || 0;
        
        if (lastLogin !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastLogin === yesterday.toDateString()) {
                streak++;
            } else {
                streak = 1;
            }
            
            localStorage.setItem(this.streakKey, streak);
            localStorage.setItem(this.lastLoginKey, today);
        }
        
        return streak;
    }

    getDailyGoal() {
        const today = new Date().toDateString();
        const dailyGoalKey = `daily_goal_${today}`;
        let progress = parseInt(localStorage.getItem(dailyGoalKey)) || 0;
        const goal = 50; // 50 XP per day
        
        return {
            current: progress,
            goal: goal,
            percentage: (progress / goal) * 100
        };
    }

    addXP(amount, source) {
        const user = this.auth.currentUser;
        if (!user) return;
        
        let totalXP = parseInt(localStorage.getItem(`xp_${user.id}`)) || 0;
        totalXP += amount;
        localStorage.setItem(`xp_${user.id}`, totalXP);
        
        // Update daily goal
        const today = new Date().toDateString();
        const dailyGoalKey = `daily_goal_${today}`;
        let dailyProgress = parseInt(localStorage.getItem(dailyGoalKey)) || 0;
        dailyProgress += amount;
        localStorage.setItem(dailyGoalKey, dailyProgress);
        
        this.auth.showToast(`+${amount} XP from ${source}!`, 'success');
        
        // Check for level up
        this.checkLevelUp(totalXP);
        
        return totalXP;
    }

    checkLevelUp(xp) {
        const levels = [
            { name: 'French Enthusiast', xp: 500 },
            { name: 'French Learner', xp: 1000 },
            { name: 'French Speaker', xp: 2500 },
            { name: 'French Expert', xp: 5000 },
            { name: 'French Master', xp: 10000 }
        ];
        
        const currentLevel = localStorage.getItem('user_level') || 0;
        for (let i = currentLevel; i < levels.length; i++) {
            if (xp >= levels[i].xp) {
                localStorage.setItem('user_level', i + 1);
                localStorage.setItem('user_title', levels[i].name);
                this.auth.showToast(`🏆 Level Up! You are now a ${levels[i].name}!`, 'success');
            }
        }
    }

    getAchievements() {
        const achievements = [
            { id: 'first_lesson', name: 'First Steps', description: 'Complete your first lesson', icon: '🎯' },
            { id: 'streak_7', name: 'Week Warrior', description: '7 day learning streak', icon: '🔥' },
            { id: 'streak_30', name: 'Monthly Master', description: '30 day learning streak', icon: '🏆' },
            { id: 'a1_complete', name: 'A1 Graduate', description: 'Complete A1 level', icon: '🎓' },
            { id: 'a2_complete', name: 'A2 Graduate', description: 'Complete A2 level', icon: '🎓' },
            { id: 'b1_complete', name: 'B1 Graduate', description: 'Complete B1 level', icon: '🎓' },
            { id: 'b2_complete', name: 'B2 Graduate', description: 'Complete B2 level', icon: '🎓' },
            { id: 'perfect_score', name: 'Perfect Score', description: 'Get 100% on a quiz', icon: '⭐' },
            { id: 'puzzle_master', name: 'Puzzle Master', description: 'Solve 10 puzzles', icon: '🧩' }
        ];
        
        const earned = JSON.parse(localStorage.getItem('achievements')) || [];
        return achievements.map(ach => ({
            ...ach,
            earned: earned.includes(ach.id)
        }));
    }

    unlockAchievement(achievementId) {
        const earned = JSON.parse(localStorage.getItem('achievements')) || [];
        if (!earned.includes(achievementId)) {
            earned.push(achievementId);
            localStorage.setItem('achievements', JSON.stringify(earned));
            this.auth.showToast(`🏅 Achievement Unlocked!`, 'success');
            return true;
        }
        return false;
    }

    getLeaderboard() {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const leaderboard = users.map(user => ({
            username: user.username,
            xp: parseInt(localStorage.getItem(`xp_${user.id}`)) || 0,
            level: user.progress
        })).sort((a, b) => b.xp - a.xp);
        
        return leaderboard;
    }
}

const tracker = new ProgressTracker(auth);