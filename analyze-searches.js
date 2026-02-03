const fs = require('fs');

const filePath = 'C:\\Users\\David Riccardi\\.claude\\projects\\C--Users-David-Riccardi-Documents-test-project\\6c3337a1-0d85-45f4-b97a-9ddf0c0a9da4\\tool-results\\mcp-NetSuite-td3059499-ns_listSavedSearches-1770141540108.txt';

// The file contains an array with one object: [{type: "text", text: "..."}]
const wrapper = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const data = JSON.parse(wrapper[0].text);

console.log('=== NetSuite Saved Searches Analysis ===\n');
console.log('Total Saved Searches:', data.length);
// Show first search object structure
console.log('\n=== Sample Search Structure ===');
console.log(JSON.stringify(data[0], null, 2));

console.log('\n=== Breakdown by Record Type ===');

// Group by recordtype
const byType = {};
data.forEach(search => {
  const type = search.recordtype || 'Unknown';
  byType[type] = (byType[type] || 0) + 1;
});

Object.entries(byType)
  .sort((a, b) => b[1] - a[1])
  .forEach(([type, count]) => {
    console.log(`${type}: ${count}`);
  });

console.log('\n=== All Saved Searches (ID | Title | Record Type) ===');
data.forEach(s => {
  console.log(`${s.id} | ${s.title || 'N/A'} | ${s.recordtype || 'N/A'}`);
});
