import fs from 'fs';
import path from 'path';

function fixFile(file: string, replacer: (content: string) => string) {
    const fullPath = path.resolve(file);
    let content = fs.readFileSync(fullPath, 'utf8');
    content = replacer(content);
    fs.writeFileSync(fullPath, content);
}

// 1. CBTMethod
fixFile('src/components/methods/CBTMethod.tsx', (c) => {
    return c.replace(/b\[1\] \- a\[1\]/g, '(b[1] as number) - (a[1] as number)');
});

// 2. HabitMethod
fixFile('src/components/methods/HabitMethod.tsx', (c) => {
    return c.replace(/new Date\((l|m)\.timestamp\)/g, 'new Date(($1 as any).timestamp)');
});

// 3. MindfulnessMethod
fixFile('src/components/methods/MindfulnessMethod.tsx', (c) => {
    return c.replace(/new Date\((l|m)\.timestamp\)/g, 'new Date(($1 as any).timestamp)');
});

console.log("Lint fixes applied");
