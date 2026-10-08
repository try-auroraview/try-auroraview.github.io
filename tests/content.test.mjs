import test from 'node:test';
import assert from 'node:assert/strict';
import { content, snippets } from '../src/content.mjs';

test('both locales expose the same projects, evidence gates, and runnable tutorial destinations', () => {
  assert.deepEqual(content.en.projects.map((p) => p[3]), content.zh.projects.map((p) => p[3]));
  assert.deepEqual(content.en.tutorials.map((p) => p[3]), content.zh.tutorials.map((p) => p[3]));
  assert.equal(content.en.layers.length, content.zh.layers.length);
  assert.equal(content.en.runtimeLayers.length, content.zh.runtimeLayers.length);
  assert.equal(content.en.mediaItems.length, content.zh.mediaItems.length);
  assert.equal(content.en.mediaLabels.length, content.zh.mediaLabels.length);
  assert(content.en.runtimeIntro.includes('not yet been delivered'));
  assert(content.zh.runtimeIntro.includes('尚未交付'));
  assert(content.en.projects.find((p) => p[0] === 'auroraview-blender')[2].includes('Experimental'));
  assert(content.zh.projects.find((p) => p[0] === 'auroraview-blender')[2].includes('实验性'));
});

test('standalone quick start uses the documented desktop entry point', () => {
  assert(snippets.python.startsWith('from auroraview import run_desktop'));
  assert(snippets.python.includes('url="http://localhost:3000"'));
  assert(!snippets.python.includes('parent='));
});
