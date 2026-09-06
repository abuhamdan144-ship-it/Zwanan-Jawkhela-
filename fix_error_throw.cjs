const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "console.error('Firestore Error: ', JSON.stringify(errInfo));\n  throw new Error(JSON.stringify(errInfo));",
  "console.error('Firestore Error: ', JSON.stringify(errInfo));\n  if (errInfo.error.includes('Missing or insufficient permissions')) {\n    toast('Firebase permission denied. Check your Firestore rules.', 'err');\n  } else {\n    toast('Firestore Error: ' + errInfo.error, 'err');\n  }"
);

fs.writeFileSync('src/App.tsx', content);
