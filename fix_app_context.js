import fs from 'fs';
let content = fs.readFileSync('src/store/AppContext.tsx', 'utf8');

// remove lines containing supabase
content = content.split('\n').filter(line => !line.includes('pushToSupabase') && !line.includes('deleteFromSupabase') && !line.includes('pullFromSupabase') && !line.includes('processSyncQueue') && !line.includes('import { supabase } from')).join('\n');

content = content.replace(/const addChatMessage = async \(msg: Omit<AiConversation, 'id'>\) => \{[\s\S]*?(?=const setDailyInsight =)/, 
`const addChatMessage = async (msg: Omit<AiConversation, 'id'>) => {
    const msgWithId: AiConversation = { ...msg, id: uuidv4() };
    await db.ai_conversations.add(msgWithId);
  };

  `);

// Remove unused useAuth
content = content.replace(/import \{ useAuth \} from '\.\.\/contexts\/AuthContext';\n/, '');
content = content.replace(/  const \{ session, user \} = useAuth\(\);\n/, '');

// Remove bad useEffect artifacts if present
content = content.replace(/  useEffect\(\(\) => \{[\s\S]*?\}, \[user\]\);\n\n  useEffect\(\(\) => \{[\s\S]*?\}, \[user\?\.id\]\);\n/, '');

fs.writeFileSync('src/store/AppContext.tsx', content);
