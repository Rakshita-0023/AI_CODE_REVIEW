const STORAGE_KEY = 'codesense_activity_v1';

const safeParse = (value, fallback) => {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (_) {
    return fallback;
  }
};

const formatDayKey = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getStore = () => safeParse(localStorage.getItem(STORAGE_KEY), {});

const saveStore = (store) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const ensureDayEntry = (store, dayKey) => {
  if (!store[dayKey]) {
    store[dayKey] = {
      workspaceOpened: false,
      analyses: 0,
      chats: 0,
      trackedActions: 0,
      count: 0,
      minutes: 0,
      lastUpdatedAt: null
    };
  }

  return store[dayKey];
};

export const getLocalActivityMap = () => getStore();

export const recordWorkspaceOpen = ({ projectId, at = Date.now() } = {}) => {
  const date = new Date(at);
  const dayKey = formatDayKey(date);
  const store = getStore();
  const entry = ensureDayEntry(store, dayKey);

  if (!entry.workspaceOpened) {
    entry.workspaceOpened = true;
    entry.count += 1;
  }

  entry.minutes = Math.max(entry.minutes || 0, 3);
  entry.lastUpdatedAt = date.toISOString();
  entry.lastProjectId = projectId || entry.lastProjectId || null;

  saveStore(store);

  return {
    dayKey,
    startedAt: at,
    lastInteractionAt: at,
    lastPersistedAt: at,
    projectId: projectId || null
  };
};

export const recordWorkspaceInteraction = (session, { at = Date.now(), minIntervalMs = 60000 } = {}) => {
  if (!session) return session;
  if (at - (session.lastInteractionAt || 0) < minIntervalMs) return session;

  const store = getStore();
  const dayKey = formatDayKey(new Date(at));
  const entry = ensureDayEntry(store, dayKey);
  entry.trackedActions += 1;
  entry.count += 1;
  entry.minutes = Math.max(entry.minutes || 0, 4);
  entry.lastUpdatedAt = new Date(at).toISOString();
  saveStore(store);

  return {
    ...session,
    lastInteractionAt: at
  };
};

export const flushWorkspaceSession = (session, { at = Date.now() } = {}) => {
  if (!session?.startedAt) return null;

  const startedAt = session.startedAt;
  const minutesSpent = Math.max(1, Math.ceil((at - startedAt) / 60000));
  const dayKey = formatDayKey(new Date(startedAt));
  const store = getStore();
  const entry = ensureDayEntry(store, dayKey);

  if (!entry.workspaceOpened) {
    entry.workspaceOpened = true;
    entry.count += 1;
  }

  entry.minutes = Math.max(entry.minutes || 0, minutesSpent);
  entry.lastUpdatedAt = new Date(at).toISOString();
  entry.lastProjectId = session.projectId || entry.lastProjectId || null;

  saveStore(store);
  return null;
};
