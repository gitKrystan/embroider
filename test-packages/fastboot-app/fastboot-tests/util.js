/* eslint-env node */

const FastBoot = require('fastboot');
const { execFileSync } = require('child_process');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

module.exports = function setup(hooks, buildArgs = []) {
  let fastboot;

  async function visit(assert, url, { expectStatus } = {}) {
    if (expectStatus == null) {
      expectStatus = 200;
    }
    let visitOpts = {
      request: { headers: { host: 'localhost:4200' } },
    };
    let page = await fastboot.visit(url, visitOpts);
    assert.equal(page.statusCode, expectStatus, `status code for ${url}`);
    let html = await page.html();
    let dom = new JSDOM(html);
    return dom.window.document;
  }

  hooks.before(async function (assert) {
    if (!process.env.REUSE_FASTBOOT_BUILD) {
      execFileSync('node', ['../../node_modules/ember-cli/bin/ember', 'build', ...buildArgs]);
      process.env.REUSE_FASTBOOT_BUILD = 'true';
    }
    fastboot = new FastBoot({
      distPath: 'dist',
      resilient: false,
    });
    this.visit = visit.bind(this, assert);
  });
  hooks.beforeEach(function (assert) {
    this.visit = visit.bind(this, assert);
  });
};
