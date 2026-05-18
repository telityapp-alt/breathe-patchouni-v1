import fs from 'fs';
let c = fs.readFileSync('src/store/AppContext.tsx', 'utf8');
const search = `    }

    if (logWithId.outcome === 'smoked' && state.profile) {
      await db.users.update(state.profile.id, { lastSmoked: logWithId.timestamp });
      }
      return null;
    } else {
      return await checkMilestones();
    }
      }
    }
  };`;
const replace = `    if (logWithId.outcome === 'smoked' && state.profile) {
      await db.users.update(state.profile.id, { lastSmoked: logWithId.timestamp });
      return null;
    } else {
      return await checkMilestones();
    }
  };`;
c = c.replace(search, replace);
fs.writeFileSync('src/store/AppContext.tsx', c);
