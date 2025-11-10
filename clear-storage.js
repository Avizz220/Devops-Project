// ========================================
// Quick Fix: Paste this in Browser Console (F12)
// ========================================

console.log('🧹 Clearing all storage and resetting app...');

// Clear localStorage
localStorage.clear();
console.log('✅ localStorage cleared');

// Clear sessionStorage
sessionStorage.clear();
console.log('✅ sessionStorage cleared');

// Clear cookies for this domain
document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});
console.log('✅ Cookies cleared');

// Show what was cleared
console.log('📊 Storage status:');
console.log('  localStorage length:', localStorage.length);
console.log('  sessionStorage length:', sessionStorage.length);

// Reload to landing page
console.log('🔄 Reloading to show landing page...');
setTimeout(() => {
    window.location.href = '/';
}, 1000);
