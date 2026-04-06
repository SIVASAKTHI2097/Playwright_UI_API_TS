import { test as base, mergeTests, request } from '@playwright/test';
import { test as apiRequestFixture } from '@fixtures/api/api.fixture';
import { test as runtimeDataFixture } from '@fixtures/data/runtime-data.fixture';

const test = mergeTests(apiRequestFixture, runtimeDataFixture);
const expect = base.expect;

export { test, expect, request };
