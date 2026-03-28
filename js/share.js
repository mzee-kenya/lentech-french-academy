// Share helpers for certificate sharing and social buttons
(function(){
    function buildShareUrl(user, level) {
        const base = window.location.origin + window.location.pathname;
        const u = new URL(base);
        if (user) u.searchParams.set('user', user);
        if (level) u.searchParams.set('level', level);
        return u.toString();
    }

    function openPopup(url) {
        const w = 650, h = 450;
        const left = (screen.width / 2) - (w / 2);
        const top = (screen.height / 2) - (h / 2);
        window.open(url, '_blank', `toolbar=0,status=0,width=${w},height=${h},top=${top},left=${left}`);
    }

    function shareToProvider(provider, url, text) {
        if (!provider || !url) return;
        const encodedUrl = encodeURIComponent(url);
        const encodedText = encodeURIComponent(text || '');
        switch(provider) {
            case 'twitter':
                openPopup(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`);
                break;
            case 'facebook':
                openPopup(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`);
                break;
            case 'linkedin':
                openPopup(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`);
                break;
            case 'whatsapp':
                // Use web API; WhatsApp will handle on mobile
                window.open(`https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`, '_blank');
                break;
            default:
                openPopup(url);
        }
    }

    async function copyToClipboard(text) {
        if (!text) return false;
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            return true;
        } catch (e) {
            console.warn('Copy failed', e);
            return false;
        }
    }

    function updateMetaTags({title, description, url, image}){
        if (title) {
            let t = document.querySelector('meta[property="og:title"]');
            if (!t) { t = document.createElement('meta'); t.setAttribute('property','og:title'); document.head.appendChild(t); }
            t.setAttribute('content', title);
        }
        if (description) {
            let d = document.querySelector('meta[property="og:description"]');
            if (!d) { d = document.createElement('meta'); d.setAttribute('property','og:description'); document.head.appendChild(d); }
            d.setAttribute('content', description);
        }
        if (url) {
            const el = document.getElementById('og-url') || document.querySelector('meta[property="og:url"]');
            if (el) el.setAttribute('content', url);
            else {
                const m = document.createElement('meta'); m.setAttribute('property','og:url'); m.setAttribute('content', url); document.head.appendChild(m);
            }
        }
        if (image) {
            const el = document.getElementById('og-image') || document.querySelector('meta[property="og:image"]');
            if (el) el.setAttribute('content', image);
            else { const m = document.createElement('meta'); m.setAttribute('property','og:image'); m.setAttribute('content', image); document.head.appendChild(m); }
        }
    }

    // Expose to global scope for page scripts
    window.buildShareUrl = buildShareUrl;
    window.shareToProvider = shareToProvider;
    window.copyToClipboard = copyToClipboard;
    window.updateMetaTags = updateMetaTags;
})();
