/* Copyright 2018 The Chromium Authors. All rights reserved.
   Use of this source code is governed by a BSD-style license that can be
   found in the LICENSE file.
*/
'use strict';

import analytics from './google-analytics.js';

const PAUSED = 'paused';
const RUNNING = 'running';
const PAUSING = 'pausing';

let STATE = PAUSED;
let TIMEOUT_ID;
const QUEUE = [];

function schedule(task) {
  QUEUE.push(task);
  // TODO(benjhayden): Monitor queue latency.
}

function scheduleFlush(delayMs = 1000) {
  TIMEOUT_ID = setTimeout(flush, delayMs);
}

function cancelFlush() {
  if (TIMEOUT_ID) clearTimeout(TIMEOUT_ID);
  if (STATE === RUNNING) STATE = PAUSING;
}

async function flush() {
  // This async method could potentially take several seconds, during which
  // time the caller could schedule another task. In order to prevent
  // deadlocks, there should only be a single flush() running at once.
  if (STATE !== PAUSED) return;
  STATE = RUNNING;

  // TODO(benjhayden): Monitor flush duration.

  // eslint-disable-next-line no-unmodified-loop-condition
  while (QUEUE.length && (STATE === RUNNING)) {
    const task = QUEUE.shift();
    try {
      // TODO(benjhayden): Monitor task duration.
      await task();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(err);
      analytics.sendException(err);
    }
  }

  STATE = PAUSED;
}

export default {
  schedule,
  scheduleFlush,
  cancelFlush,
  flush,
};
