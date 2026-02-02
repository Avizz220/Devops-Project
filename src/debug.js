console.log('=== DEBUG INFO ===');
console.log('process.env:', process.env);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

const testImageUrls = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=100&q=80',
  'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=100&q=80'
];

console.log('=== TESTING IMAGE LOADING ===');
testImageUrls.forEach((url, index) => {
  const img = new Image();
  img.onload = () => console.log(`✅ Test image ${index + 1} loaded successfully`);
  img.onerror = () => console.error(`❌ Test image ${index + 1} failed to load: ${url}`);
  img.src = url;
});

console.log('=================');