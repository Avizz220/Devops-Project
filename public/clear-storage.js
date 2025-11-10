// Clear localStorage on initial load if needed
// This ensures a clean state for Docker deployments
(function() {
  console.log('Storage cleanup script loaded');
  
  // Check if this is a fresh Docker deployment
  const isDockerDeployment = window.location.hostname === 'localhost' || 
                              window.location.hostname === '127.0.0.1';
  
  // Only log, don't automatically clear to preserve user sessions
  if (isDockerDeployment) {
    console.log('Docker deployment detected');
    console.log('Current localStorage:', localStorage.getItem('community_events_user'));
  }
  
  // Add a global function to manually clear if needed
  window.clearAppStorage = function() {
    localStorage.removeItem('community_events_user');
    console.log('Application storage cleared');
    window.location.reload();
  };
  
  console.log('To clear storage manually, run: clearAppStorage()');
})();
