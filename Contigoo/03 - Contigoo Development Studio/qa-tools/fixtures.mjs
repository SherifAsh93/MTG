import { initialState, saveClientProfile, createProject, toggleApp } from '../prototype/model.mjs';
import { enhanceState, createCustomApp, catalog, definitionFor } from '../prototype/builder-model.mjs';

// Synthetic QA records only. Every scenario gets its own state/browser context.
export function fixture({ custom = true, apps = [] } = {}) {
  const state = enhanceState(initialState());
  const ownerA = saveClientProfile(state, { name: 'QA Client Alpha', email: 'alpha@example.test', phone: '000-ALPHA', industry: 'QA', contact: 'Alpha contact' });
  const ownerB = saveClientProfile(state, { name: 'QA Client Beta', email: 'beta@example.test', industry: 'QA', contact: 'Beta contact' });
  const a = createProject(state, { clientId: ownerA.id, name: 'QA Project Alpha' });
  const b = createProject(state, { clientId: ownerB.id, name: 'QA Project Beta' });
  for (const project of [a, b]) for (const id of apps) toggleApp(project, id, catalog(state));
  enhanceState(state);
  let app;
  if (custom) {
    app = createCustomApp(state, a, { name: 'QA Custom App', entityName: 'Entry', monthly: '25', setup: '10' });
    toggleApp(b, app.id, catalog(state)); enhanceState(state);
    definitionFor(state, b, app.id);
  }
  return { state, a, b, ownerA, ownerB, app };
}
