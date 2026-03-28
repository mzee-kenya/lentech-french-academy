// User Management System
class AuthManager {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    }

    signup(username, email, password) {
        // Check if user exists
        if (this.users.find(u => u.email === email)) {
            return { success: false, message: 'Email already registered!' };
        }
        
        if (this.users.find(u => u.username === username)) {
            return { success: false, message: 'Username already taken!' };
        }
        
        // Create new user
        const newUser = {
            id: Date.now(),
            username,
            email,
            password: this.hashPassword(password),
            createdAt: new Date().toISOString(),
            progress: {
                A1: { completed: false, lessons: {}, score: 0 },
                A2: { completed: false, lessons: {}, score: 0 },
                B1: { completed: false, lessons: {}, score: 0 },
                B2: { completed: false, lessons: {}, score: 0 }
            },
            certificates: [],
            preferences: {
                theme: 'light',
                notifications: true
            }
        };
        
        this.users.push(newUser);
        localStorage.setItem('users', JSON.stringify(this.users));
        
        return { success: true, message: 'Account created successfully!' };
    }

    login(email, password) {
        const user = this.users.find(u => u.email === email);
        
        if (!user) {
            return { success: false, message: 'User not found!' };
        }
        
        if (this.hashPassword(password) !== user.password) {
            return { success: false, message: 'Incorrect password!' };
        }
        
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        return { success: true, message: 'Login successful!', user };
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        return { success: true, message: 'Logged out successfully!' };
    }

    hashPassword(password) {
        // Simple hash for demo - in production use bcrypt or similar
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            hash = ((hash << 5) - hash) + password.charCodeAt(i);
            hash |= 0;
        }
        return hash.toString();
    }

    updateProgress(level, lessonId, score) {
        if (!this.currentUser) return false;
        
        const user = this.users.find(u => u.id === this.currentUser.id);
        if (!user) return false;
        
        // Update lesson progress
        user.progress[level].lessons[lessonId] = {
            completed: true,
            score: score,
            completedAt: new Date().toISOString()
        };
        
        // Calculate level completion
        const totalLessons = this.getTotalLessons(level);
        const completedLessons = Object.keys(user.progress[level].lessons).length;
        const completionPercentage = (completedLessons / totalLessons) * 100;
        
        user.progress[level].score = completionPercentage;
        
        if (completionPercentage === 100) {
            user.progress[level].completed = true;
            this.generateCertificate(level);
            this.showToast(`🎉 Congratulations! You completed ${level} level!`, 'success');
        }
        
        localStorage.setItem('users', JSON.stringify(this.users));
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        return true;
    }

    getTotalLessons(level) {
        const lessons = {
            'A1': 5,
            'A2': 3,
            'B1': 2,
            'B2': 2
        };
        return lessons[level] || 0;
    }

    generateCertificate(level) {
        const certificate = {
            id: Date.now(),
            level: level,
            earnedAt: new Date().toISOString(),
            studentName: this.currentUser.username,
            levelName: this.getLevelName(level)
        };
        
        this.currentUser.certificates.push(certificate);
        const user = this.users.find(u => u.id === this.currentUser.id);
        user.certificates = this.currentUser.certificates;
        localStorage.setItem('users', JSON.stringify(this.users));
        
        return certificate;
    }

    getLevelName(level) {
        const names = {
            'A1': 'Beginner Level',
            'A2': 'Elementary Level',
            'B1': 'Intermediate Level',
            'B2': 'Upper Intermediate Level'
        };
        return names[level];
    }

    getProgress() {
        if (!this.currentUser) return null;
        return this.currentUser.progress;
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

const auth = new AuthManager();