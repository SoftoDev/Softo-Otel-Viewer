export const IPC = {
  TRACES_GET_SUMMARIES: 'traces:getSummaries',
  TRACES_GET_SPANS: 'traces:getSpans',
  TRACES_GET_SPAN: 'traces:getSpan',
  TRACES_CLEAR: 'traces:clear',
  APP_GET_STATS: 'app:getStats',
  TRACES_DATA_UPDATED: 'traces:dataUpdated',
  FILE_WATCHER_SELECT_DIR: 'fileWatcher:selectDir',
  FILE_WATCHER_SET_DIR: 'fileWatcher:setDir',
  FILE_WATCHER_STOP: 'fileWatcher:stop',
  FILE_WATCHER_GET_STATUS: 'fileWatcher:getStatus'
} as const
