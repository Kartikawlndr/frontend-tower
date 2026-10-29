import assert from "node:assert/strict";
import test from "node:test";
import {
  csvForTowers,
  getPortalRole,
  isApplicant,
  sanitizeDraftData,
  validateBulkDeleteIds,
} from "./index.js";
import {
  createRegisteredTowers,
  createRejectedAttempt,
  setRecordCreator,
} from "../../../shared/normalized-registration.js";

test("role checks accept only authenticated Applicant accounts", () => {
  assert.equal(isApplicant({ user: "user-1", role: "applicant" }, "applicant"), true);
  assert.equal(isApplicant({ user: "user-1", role: "manager" }, "applicant"), false);
  assert.equal(isApplicant({ user: null, role: "applicant" }, "applicant"), false);
  assert.equal(isApplicant(null, "applicant"), false);
});

test("portal role resolution recognizes only the three configured portal roles", async () => {
  const assignedRoles = new Map([
    ["applicant-1", "applicant-id"],
    ["manager-1", "manager-id"],
    ["admin-1", "admin-id"],
    ["unknown-1", "other-id"],
    ["suspended-1", "applicant-id"],
  ]);
  const roleNames = new Map([
    ["applicant-id", "Applicant"],
    ["manager-id", "Web Manager"],
    ["admin-id", "Administrator"],
    ["other-id", "Other role"],
  ]);
  const database = (table) => ({
    select() {
      return this;
    },
    where(query) {
      this.id = query.id;
      return this;
    },
    async first() {
      if (table === "directus_users") {
        const role = assignedRoles.get(this.id);
        const status = this.id === "suspended-1" ? "suspended" : "active";
        return role ? { role, status } : undefined;
      }
      const name = roleNames.get(this.id);
      return name ? { name } : undefined;
    },
  });

  assert.equal(
    await getPortalRole(database, { user: "applicant-1" }, "applicant-id"),
    "Applicant",
  );
  assert.equal(
    await getPortalRole(database, { user: "manager-1" }, "applicant-id"),
    "Web Manager",
  );
  assert.equal(
    await getPortalRole(database, { user: "admin-1" }, "applicant-id"),
    "Administrator",
  );
  assert.equal(
    await getPortalRole(database, { user: "unknown-1" }, "applicant-id"),
    null,
  );
  assert.equal(
    await getPortalRole(database, { user: "suspended-1" }, "applicant-id"),
    null,
  );
  assert.equal(
    await getPortalRole(database, { user: "missing-role" }, "applicant-id"),
    null,
  );
  assert.equal(
    await getPortalRole(database, { user: null }, "applicant-id"),
    null,
  );
});

test("CSV export escapes formulas and quotes", () => {
  const csv = csvForTowers([
    {
      id_menara: '=HYPERLINK("https://example.invalid")',
      nama_pemilik: 'Pemilik "A"',
      longitude: 106.8,
      latitude: -6.2,
      tenants: [
        { penyelenggara: "Tenant A" },
        { penyelenggara: "Tenant B" },
      ],
    },
  ]);
  assert.match(csv, /"'=HYPERLINK\(""https:\/\/example\.invalid""\)"/);
  assert.match(csv, /"Pemilik ""A"""/);
  assert.match(csv, /"106\.8","-6\.2"/);
  assert.match(csv.split("\r\n")[0], /"Kecamatan","Kelurahan\/Desa"/);
  assert.match(csv.split("\r\n")[0], /"Tanggal pendaftaran"/);
  assert.match(csv.split("\r\n")[1], /"Tenant A, Tenant B"/);
});

test("bulk deletion accepts a bounded unique list only", () => {
  assert.equal(validateBulkDeleteIds(["tower-1", "tower-2"]), true);
  assert.equal(validateBulkDeleteIds([]), false);
  assert.equal(validateBulkDeleteIds(["tower-1", "tower-1"]), false);
  assert.equal(validateBulkDeleteIds(["x".repeat(65)]), false);
  assert.equal(validateBulkDeleteIds(Array.from({ length: 201 }, (_, i) => String(i))), false);
});

test("draft snapshots keep tenant names without duplicated tenant capacity", () => {
  assert.deepEqual(
    sanitizeDraftData({
      id_menara: "T-01",
      longitude: "",
      provinsi: "Sumatera Barat",
      kab_kota: "Kota Padang",
      tenants: [{ penyelenggara: "Tenant A", kapasitas_disewakan: "legacy value" }],
    }),
    {
      id_menara: "T-01",
      longitude: "",
      provinsi: "Sumatera Barat",
      kab_kota: "Kota Padang",
      tenants: [{ penyelenggara: "Tenant A" }],
    },
  );
  assert.throws(() => sanitizeDraftData({ verification_status: "Registered" }));
  assert.throws(() => sanitizeDraftData({ id_menara: "x".repeat(201) }));
});

test("registered submission transaction writes tower, tenants, attempt, and activity", async () => {
  const records = [];
  const activities = [];
  const owners = [];
  let lastRegistrationNumber = 0;
  let nextId = 1;
  const database = {
    async transaction(callback) {
      const transaction = (table) => ({
        async insert(rows) {
          activities.push({ table, rows });
        },
        where(query) {
          this.query = query;
          return this;
        },
        async update(data) {
          owners.push({ table, query: this.query, data });
          return 1;
        },
      });
      transaction.raw = async () => ({
        rows: [{ last_value: ++lastRegistrationNumber }],
      });
      transaction.records = records;
      return callback(transaction);
    },
  };
  class ItemsServiceMock {
    constructor(collection, options) {
      this.collection = collection;
      this.transaction = options.knex;
    }

    async createOne(data) {
      const id = nextId++;
      records.push({ collection: this.collection, data, id });
      return id;
    }
  }

  const created = await createRegisteredTowers({
    database,
    ItemsService: ItemsServiceMock,
    schema: {},
    userId: "applicant-1",
    method: "Input Manual",
    registrations: [{
      tower: {
        id_menara: "T-01",
        longitude: 106.8,
        latitude: -6.2,
        kapasitas_disewakan: "2",
      },
      tenants: [
        { penyelenggara: "Tenant A" },
        { penyelenggara: "Tenant B" },
      ],
    }],
  });

  assert.equal(created.length, 1);
  assert.equal(records.filter(({ collection }) => collection === "tower_infrastruktur").length, 1);
  assert.equal(records.filter(({ collection }) => collection === "tower_tenant").length, 2);
  const tower = records.find(({ collection }) => collection === "tower_infrastruktur");
  assert.equal(tower.data.kapasitas_disewakan, "2");
  assert.equal("penyelenggara" in tower.data, false);
  const tenantRecords = records.filter(({ collection }) => collection === "tower_tenant");
  assert.deepEqual(
    tenantRecords.map(({ data }) => data.penyelenggara),
    ["Tenant A", "Tenant B"],
  );
  assert.ok(tenantRecords.every(({ data }) => !("kapasitas_disewakan" in data)));
  const attempt = records.find(({ collection }) => collection === "tower_registration_attempts");
  assert.equal(attempt.data.status, "Registered");
  assert.equal(attempt.data.registration_code, "REG-000001");
  assert.equal(attempt.data.tower_id, created[0].id);
  assert.equal(attempt.data.submission_data.tenants.length, 2);
  assert.ok(Number.isFinite(Date.parse(attempt.data.date_created)));
  assert.equal(
    attempt.data.date_created,
    attempt.data.submission_data.date_created,
  );
  assert.equal(
    records.find(({ collection }) => collection === "tower_infrastruktur").data.date_created,
    attempt.data.date_created,
  );
  assert.equal(activities.length, 3);
  assert.deepEqual(
    owners.map(({ table }) => table),
    [
      "tower_infrastruktur",
      "tower_tenant",
      "tower_tenant",
      "tower_registration_attempts",
    ],
  );
  assert.ok(owners.every(({ query, data }) =>
    query.id !== undefined && data.user_created === "applicant-1"));
});

test("registered submission does not persist legacy capacity values on tenant rows", async () => {
  const records = [];
  let nextId = 1;
  const database = {
    async transaction(callback) {
      const transaction = (table) => ({
        async insert() {},
        where(query) {
          this.query = query;
          return this;
        },
        async update() {
          return 1;
        },
      });
      transaction.raw = async () => ({ rows: [{ last_value: 1 }] });
      return callback(transaction);
    },
  };
  class ItemsServiceMock {
    constructor(collection) {
      this.collection = collection;
    }

    async createOne(data) {
      records.push({ collection: this.collection, data, id: nextId++ });
      return nextId - 1;
    }
  }

  await createRegisteredTowers({
    database,
    ItemsService: ItemsServiceMock,
    schema: {},
    userId: "applicant-1",
    method: "Input Manual",
    registrations: [{
      tower: { id_menara: "T-01", kapasitas_disewakan: "2" },
      tenants: [
        { penyelenggara: "TENANT A", kapasitas_disewakan: "9" },
        { penyelenggara: "TENANT B", kapasitas_disewakan: "8" },
      ],
    }],
  });
  const tenantRecords = records.filter(({ collection }) => collection === "tower_tenant");
  assert.equal(tenantRecords.length, 2);
  assert.ok(tenantRecords.every(({ data }) => !("kapasitas_disewakan" in data)));
});

test("rejected attempts persist status, error details, and activity atomically", async () => {
  const records = [];
  const activities = [];
  const owners = [];
  let registrationCodeAllocated = false;
  const database = {
    async transaction(callback) {
      const transaction = (table) => ({
        async insert(rows) {
          activities.push(rows);
        },
        where(query) {
          this.query = query;
          return this;
        },
        async update(data) {
          owners.push({ table, query: this.query, data });
          return 1;
        },
      });
      transaction.raw = async () => {
        registrationCodeAllocated = true;
        return { rows: [{ last_value: 1 }] };
      };
      return callback(transaction);
    },
  };
  class ItemsServiceMock {
    constructor(collection) {
      this.collection = collection;
    }

    async createOne(data) {
      records.push({ collection: this.collection, data });
      return 23;
    }
  }

  const id = await createRejectedAttempt({
    database,
    ItemsService: ItemsServiceMock,
    schema: {},
    userId: "applicant-1",
    method: "Input Manual",
    submissionData: { id_menara: "T-01" },
    validationErrors: [{ field: "longitude", message: "Invalid coordinate" }],
    attemptType: "Update",
    towerId: "tower-1",
  });

  assert.equal(id, 23);
  assert.equal(records[0].data.status, "Rejected");
  assert.equal("registration_code" in records[0].data, false);
  assert.equal(registrationCodeAllocated, false);
  assert.equal(records[0].data.attempt_type, "Update");
  assert.equal(records[0].data.tower_id, "tower-1");
  assert.equal(activities.length, 1);
  assert.deepEqual(owners, [{
    table: "tower_registration_attempts",
    query: { id: 23 },
    data: { user_created: "applicant-1" },
  }]);
});

test("owner assignment fails when the target record was not updated", async () => {
  const transaction = () => ({
    where() {
      return this;
    },
    async update() {
      return 0;
    },
  });

  await assert.rejects(
    setRecordCreator(
      transaction,
      "tower_infrastruktur",
      "tower-1",
      "applicant-1",
    ),
    /Could not assign the owner/,
  );
});

test("a rejected submission converts its existing Applicant draft", async () => {
  let update;
  let activity;
  const database = {
    async transaction(callback) {
      const transaction = (table) => {
        if (table === "directus_activity") {
          return {
            async insert(row) {
              activity = row;
            },
          };
        }
        return {
          select() {
            return this;
          },
          where() {
            return this;
          },
          forUpdate() {
            return this;
          },
          async first() {
            return { id: 23 };
          },
        };
      };
      return callback(transaction);
    },
  };
  class ItemsServiceMock {
    async updateOne(id, data) {
      update = { id, data };
    }
  }

  const id = await createRejectedAttempt({
    database,
    ItemsService: ItemsServiceMock,
    schema: {},
    userId: "applicant-1",
    method: "Input Manual",
    submissionData: { id_menara: "T-01" },
    validationErrors: [{ field: "longitude", message: "Invalid coordinate" }],
    draftId: 23,
  });

  assert.equal(id, 23);
  assert.equal(update.data.status, "Rejected");
  assert.equal(update.data.attempt_type, "New Registration");
  assert.equal(update.data.user_created, "applicant-1");
  assert.equal(activity.action, "update");
});

test("a successful submission converts its Applicant draft to Registered", async () => {
  const updates = [];
  const activity = [];
  const owners = [];
  let lastRegistrationNumber = 0;
  let nextId = 1;
  const database = {
    async transaction(callback) {
      const transaction = (table) => {
        if (table === "directus_activity") {
          return {
            async insert(rows) {
              activity.push(rows);
            },
          };
        }
        return {
          select() {
            return this;
          },
          where(query) {
            this.query = query;
            return this;
          },
          forUpdate() {
            return this;
          },
          async first() {
            return { id: 23 };
          },
          async update(data) {
            owners.push({ table, query: this.query, data });
            return 1;
          },
        };
      };
      transaction.raw = async () => ({
        rows: [{ last_value: ++lastRegistrationNumber }],
      });
      return callback(transaction);
    },
  };
  class ItemsServiceMock {
    constructor(collection) {
      this.collection = collection;
    }

    async createOne(data) {
      return `${this.collection}-${nextId++}`;
    }

    async updateOne(id, data) {
      updates.push({ collection: this.collection, id, data });
    }
  }

  const result = await createRegisteredTowers({
    database,
    ItemsService: ItemsServiceMock,
    schema: {},
    userId: "applicant-1",
    method: "Input Manual",
    registrations: [{
      tower: { id_menara: "T-01", longitude: 106.8, latitude: -6.2 },
      tenants: [{ penyelenggara: "Tenant A", kapasitas_disewakan: "2" }],
    }],
    draftId: 23,
  });

  assert.equal(result.length, 1);
  assert.equal(updates.length, 1);
  assert.equal(updates[0].id, 23);
  assert.equal(updates[0].data.status, "Registered");
  assert.equal(updates[0].data.registration_code, "REG-000001");
  assert.equal(updates[0].data.tower_id, result[0].id);
  assert.equal(updates[0].data.user_created, "applicant-1");
  assert.equal(activity.length, 2);
  assert.deepEqual(owners.map(({ table }) => table), [
    "tower_infrastruktur",
    "tower_tenant",
  ]);
  assert.ok(owners.every(({ data }) => data.user_created === "applicant-1"));
});
