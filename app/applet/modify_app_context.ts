import fs from 'fs';

let content = fs.readFileSync('src/store/AppContext.tsx', 'utf8');

// Remove import
content = content.replace(/import \{ pushToSupabase, pullFromSupabase, processSyncQueue, deleteFromSupabase \} from '\.\.\/lib\/sync';\n/g, '');

// Remove useEffects related to pulling/pushing sync
content = content.replace(/  useEffect\(\(\) => \{\n    if \(user\?\.id && !initRef\.current\) \{\n      initRef\.current = true;\n      pullFromSupabase\(user\.id\);\n    \}\n  \}, \[user\]\);\n\n  useEffect\(\(\) => \{\n    const handleOnline = \(\) => \{\n      console\.log\('App is online\. Processing sync queue\.\.\.'\);\n      processSyncQueue\(\)\.then\(\(\) => \{\n        if \(user\?\.id\) \{\n          \/\/ Re-pull to fetch any changes made on other devices\n          pullFromSupabase\(user\.id\);\n        \}\n      \}\);\n    \};\n\n    window\.addEventListener\('online', handleOnline\);\n    return \(\) => window\.removeEventListener\('online', handleOnline\);\n  \}, \[user\?\.id\]\);\n/g, '');

content = content.replace(/    if \(user\?\.id\) \{\n       await pushToSupabase\([^;]+\);\n    \}\n/g, '');
content = content.replace(/    if \(user\?\.id\) await pushToSupabase\([^;]+\);\n/g, '');
content = content.replace(/    if \(user\?\.id\) \{\n        await pushToSupabase\([^;]+\);\n    \}\n/g, '');
content = content.replace(/               if \(user\?\.id\) await pushToSupabase\([^;]+\);\n/g, '');
content = content.replace(/    if \(user\?\.id\) await deleteFromSupabase\([^;]+\);\n/g, '');
content = content.replace(/      if \(user\?\.id\) \{\n         await pushToSupabase\('profiles', \{ id: state\.profile\.id \|\| user\.id, lastSmoked: logWithId\.timestamp \}, user\.id\);\n      \}\n/g, '');

fs.writeFileSync('src/store/AppContext.tsx', content);
