default:
    @vx just --list

install:
    vx node scripts/npm.mjs ci

refresh:
    vx node scripts/npm.mjs install

build:
    vx node scripts/build.mjs

check: build
    vx node scripts/check.mjs
    vx node --test tests/content.test.mjs

serve: build
    vx node scripts/serve.mjs

audit: check
    vx node scripts/audit.mjs

browser:
    vx node scripts/npm.mjs exec -- playwright install --with-deps chromium

readback:
    vx node scripts/readback.mjs
