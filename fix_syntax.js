import fs from 'fs';
let content = fs.readFileSync('src/store/AppContext.tsx', 'utf8');

content = content.replace(/  \};\n    await db\.[A-Za-z0-9_]+\.add\([^)]+\);\n  \};\n/g, '  };\n');

// Also handle the saveHabitLoop which has:
//        await db.habit_loops.add(entryWithId as HabitLoop);
//     }
//   };
content = content.replace(/       await db\.habit_loops\.add\(entryWithId as HabitLoop\);\n    \}\n  \};\n/g, '');

fs.writeFileSync('src/store/AppContext.tsx', content);
