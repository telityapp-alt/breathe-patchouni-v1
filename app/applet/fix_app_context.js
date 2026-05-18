import fs from 'fs';
let content = fs.readFileSync('src/store/AppContext.tsx', 'utf8');

// remove lines containing supabase
content = content.split('\n').filter(line => !line.includes('pushToSupabase') && !line.includes('deleteFromSupabase') && !line.includes('pullFromSupabase') && !line.includes('processSyncQueue')).join('\n');

// fix the malformed addChatMessage that currently looks like:
//  const addChatMessage = async (msg: Omit<AiConversation, 'id'>) => {
//    await db.ai_conversations.add(msg as AiConversation);
//  };
//    await db.ai_conversations.add(msgWithId);
//  };
// We need to clean up around addChatMessage
content = content.replace(/const addChatMessage = async \(msg: Omit<AiConversation, 'id'>\) => \{[\s\S]*?(?=const setDailyInsight =)/, 
`const addChatMessage = async (msg: Omit<AiConversation, 'id'>) => {
    const msgWithId: AiConversation = { ...msg, id: uuidv4() };
    await db.ai_conversations.add(msgWithId);
  };

  `);

// Remove unused useAuth
content = content.replace(/import \{ useAuth \} from '\.\.\/contexts\/AuthContext';\n/, '');
content = content.replace(/  const \{ session, user \} = useAuth\(\);\n/, '');

// Remove bad useEffect artifacts
content = content.replace(/  useEffect\(\(\) => \{\n    if \(user\?\.id && !initRef\.current\) \{\n      initRef\.current = true;\n\n    \}\n  \}, \[user\]\);\n\n  useEffect\(\(\) => \{\n    const handleOnline = \(\) => \{\n      console\.log\('App is online\. Processing sync queue\.\.\.'\);\n\n    \};\n\n    window\.addEventListener\('online', handleOnline\);\n    return \(\) => window\.removeEventListener\('online', handleOnline\);\n  \}, \[user\?\.id\]\);\n/, '');

fs.writeFileSync('src/store/AppContext.tsx', content);
