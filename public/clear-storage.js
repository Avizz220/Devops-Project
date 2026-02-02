

(function() {
  console.log('Storage cleanup script loaded');

  const isDockerDeployment = window.location.hostname === 'localhost' || 
                              window.location.hostname === '127.0.0.1';

  if (isDockerDeployment) {
    console.log('Docker deployment detected');
    console.log('Current localStorage:', localStorage.getItem('community_events_user'));
  }

  window.clearAppStorage = function() {
    localStorage.removeItem('community_events_user');
    console.log('Application storage cleared');
    window.location.reload();
  };
  
  console.log('To clear storage manually, run: clearAppStorage()');
})();
