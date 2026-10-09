import test from 'node:test';
import assert from 'node:assert/strict';
import { content, snippets } from '../src/content.mjs';
import { allHosts, ecosystem, focusHosts, hostRecord } from '../src/ecosystem.mjs';
import { principles } from '../src/principles.mjs';

test('both locales expose the same projects, evidence gates, and runnable tutorial destinations', () => {
  assert.deepEqual(content.en.projects.map((p) => p[3]), content.zh.projects.map((p) => p[3]));
  assert.deepEqual(content.en.tutorials.map((p) => p[3]), content.zh.tutorials.map((p) => p[3]));
  assert.equal(content.en.layers.length, content.zh.layers.length);
  assert.equal(content.en.runtimeLayers.length, content.zh.runtimeLayers.length);
  assert.equal(content.en.mediaItems.length, content.zh.mediaItems.length);
  assert.equal(content.en.mediaLabels.length, content.zh.mediaLabels.length);
  assert(content.en.runtimeIntro.includes('not yet been delivered'));
  assert(content.zh.runtimeIntro.includes('尚未交付'));
  assert.equal(content.en.problems.length, 4);
  assert.equal(content.zh.problems.length, 4);
});

test('every catalog host has seven localized gates without assuming AuroraView acceptance', () => {
  assert.equal(ecosystem.catalog.products.length, 35);
  assert.equal(ecosystem.catalog.applicationRoutes.length, 3);
  assert.equal(new Set(allHosts.map((host) => host.id)).size, allHosts.length);
  for (const host of allHosts) {
    const record = hostRecord(host.id);
    assert.equal(Object.keys(record.gates).length, 7);
    assert.equal(record.gates.dccMcp.status, 'catalog');
    for (const gate of Object.values(record.gates)) {
      assert(ecosystem.statusLabels[gate.status]);
      assert(gate.en && gate.zh);
      if (gate.url) assert(gate.url.startsWith('https://') || gate.url.startsWith('/evidence/'));
    }
    if (!ecosystem.integrations[host.id]) {
      assert.equal(record.gates.native.status, 'target');
      assert.equal(record.gates.verification.status, 'target');
    }
  }
  assert.throws(() => hostRecord('missing-host'), /Unknown ecosystem host/);
  assert(focusHosts.some((host) => host.id === 'unity'));
  assert.equal(hostRecord('unreal').gates.native.status, 'pending');
});

test('principles preserve communication directions, source links, and localized flow', () => {
  assert.equal(principles.en.flow.length, 6);
  assert.equal(principles.en.flow.length, principles.zh.flow.length);
  assert.equal(principles.en.communication.length, 3);
  assert.equal(principles.en.stack.length, principles.zh.stack.length);
  for (const lang of ['en', 'zh']) {
    assert(principles[lang].communicationNote.includes('__auroraview_call_result'));
    assert(principles[lang].communicationNote.includes('trigger()'));
    for (const row of [...principles[lang].flow, ...principles[lang].stack, ...principles[lang].modules]) {
      assert(row[3].startsWith('https://') || row[3].startsWith('/'));
    }
    assert(!JSON.stringify(principles[lang]).includes('material.apply'));
  }
});

test('standalone quick start uses the documented desktop entry point', () => {
  assert(snippets.python.startsWith('from auroraview import run_desktop'));
  assert(snippets.python.includes('url="http://localhost:3000"'));
  assert(!snippets.python.includes('parent='));
});
