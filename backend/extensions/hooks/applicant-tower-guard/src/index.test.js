import assert from "node:assert/strict";
import test from "node:test";
import {
  default as registerHook,
  sanitizeApplicantTower,
  sanitizeTowerUpdate,
  guardTowerArchiveOnlyUpdate,
  guardTowerDelete,
  synchronizeTowerArchiveFields,
  validateApplicantFile,
  uppercaseTowerTextFields,
} from "./index.js";

function validTower(overrides = {}) {
  return {
    id_menara: "T-01",
    nama_pemilik: "Pemilik",
    tahun_pembangunan: 2020,
    penyelenggara: "Penyelenggara",
    alamat: "Jakarta",
    provinsi: "Sumatera Barat",
    kab_kota: "Kota Padang",
    kecamatan: "Padang Barat",
    kelurahan: "Belakang Tangsi",
    jenis_menara: "BTS",
    tinggi_menara: 30,
    kapasitas_maksimal: "4 site",
    kapasitas_disewakan: "2",
    kapasitas_digunakan_sendiri: "1",
    longitude: 106.8,
    latitude: -6.2,
    map: { type: "Point", coordinates: [150, 0] },
    verification_status: "Approved",
    user_created: "spoofed-user",
    ...overrides,
  };
}

function databaseWithRegion(region = {
  province: "Jawa Barat",
  regency_city: "Kota Bandung",
  district: "Coblong",
  village: "Dago",
}) {
  const database = () => {
    throw new Error("Manual registration must not read uploaded files.");
  };
  database.raw = async () => ({
    rows: [{ row_number: 1, ...region }],
  });
  return database;
}

test("forces Applicant submissions to the allowed fields and Submitted status", async () => {
  const result = await sanitizeApplicantTower(validTower({
    provinsi: "Sumatera Barat",
    kab_kota: "Kota Padang",
  }), {
    accountability: { user: "applicant-id" },
    database: databaseWithRegion(),
  });

  assert.equal(result.verification_status, "Submitted");
  assert.equal(result.metode_pendaftaran, "Input Manual");
  assert.equal("user_created" in result, false);
  assert.equal(result.id_menara, "T-01");
  assert.equal(result.nama_pemilik, "PEMILIK");
  assert.equal(result.penyelenggara, "PENYELENGGARA");
  assert.equal(result.alamat, "JAKARTA");
  assert.equal(result.provinsi, "JAWA BARAT");
  assert.equal(result.kab_kota, "KOTA BANDUNG");
  assert.equal(result.kecamatan, "COBLONG");
  assert.equal(result.kelurahan, "DAGO");
  assert.equal(result.jenis_menara, "BTS");
  assert.equal(result.longitude, 106.8);
  assert.equal(result.latitude, -6.2);
  assert.equal("map" in result, false);
  assert.equal(result.kapasitas_maksimal, "4 SITE");
});

test("uppercases manually entered tower and tenant text without changing system fields", () => {
  const tower = uppercaseTowerTextFields(
    {
      nama_pemilik: "Pemilik Menara",
      provinsi: "Sumatera Barat",
      kab_kota: "Kota Padang",
      verification_status: "Submitted",
      tenants: [{ penyelenggara: "Tenant A", kapasitas_disewakan: "2 site" }],
    },
    "tower_infrastruktur",
  );
  assert.deepEqual(tower, {
    nama_pemilik: "PEMILIK MENARA",
    provinsi: "SUMATERA BARAT",
    kab_kota: "KOTA PADANG",
    verification_status: "Submitted",
    tenants: [{ penyelenggara: "TENANT A", kapasitas_disewakan: "2 SITE" }],
  });

  assert.deepEqual(
    uppercaseTowerTextFields(
      [{ penyelenggara: "Tenant B", kapasitas_disewakan: "1 site" }],
      "tower_tenant",
    ),
    [{ penyelenggara: "TENANT B", kapasitas_disewakan: "1 SITE" }],
  );
});

test("rejects invalid coordinates, years, and heights", async () => {
  await assert.rejects(
    sanitizeApplicantTower(
      validTower({
        tahun_pembangunan: 1899,
        tinggi_menara: 0,
        longitude: 150,
      }),
      { accountability: { user: "applicant-id" }, database: () => undefined },
    ),
  );
});

test("manual submissions with no matching boundary save blank administrative fields", async () => {
  const result = await sanitizeApplicantTower(
    validTower({
      provinsi: undefined,
      kab_kota: undefined,
      kecamatan: undefined,
      kelurahan: undefined,
    }),
    {
      accountability: { user: "applicant-id" },
      database: databaseWithRegion({
        province: null,
        regency_city: null,
        district: null,
        village: null,
      }),
    },
  );

  assert.equal(result.provinsi, null);
  assert.equal(result.kab_kota, null);
  assert.equal(result.kecamatan, null);
  assert.equal(result.kelurahan, null);
});

test("revalidates Applicant edits without allowing ID or system-field changes", async () => {
  const result = await sanitizeTowerUpdate(
    validTower({
      id_menara: "T-01",
      verification_status: "Approved",
      user_created: "another-user",
      deleted_at: "2026-01-01",
    }),
    {
      accountability: { user: "applicant-id" },
      database: databaseWithRegion(),
    },
  );

  assert.equal("id_menara" in result, false);
  assert.equal("user_created" in result, false);
  assert.equal("deleted_at" in result, false);
  assert.equal(result.verification_status, "Submitted");
  assert.equal(result.metode_pendaftaran, "Input Manual");
});

test("accepts only the current Applicant's XLSX attachment", async () => {
  const context = {
    accountability: { user: "applicant-id" },
    database: Object.assign(
      () => ({
        select: () => ({
          where: () => ({
            first: async () => ({
              uploaded_by: "applicant-id",
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              filesize: 1024,
              filename_download: "towers.xlsx",
            }),
          }),
        }),
      }),
      {
        raw: async () => ({
          rows: [{
            row_number: 1,
            province: "Jawa Barat",
            regency_city: "Kota Bandung",
            district: "Coblong",
            village: "Dago",
          }],
        }),
      },
    ),
  };

  const result = await sanitizeApplicantTower(
    validTower({ document: "file-id" }),
    context,
  );
  assert.equal(result.metode_pendaftaran, "Upload Document (.xlsx)");

  await assert.rejects(
    sanitizeApplicantTower(validTower({ document: "file-id" }), {
      ...context,
      accountability: { user: "other-applicant" },
    }),
  );
});

test("sanitizes multiple unique tenant entries while keeping legacy first-tenant fields", async () => {
  const result = await sanitizeApplicantTower(
    validTower({
      tenants: [
        { penyelenggara: "Tenant A", kapasitas_disewakan: "2 site" },
        { penyelenggara: "Tenant B", kapasitas_disewakan: "2 site" },
      ],
    }),
    {
      accountability: { user: "applicant-id" },
      database: databaseWithRegion(),
    },
  );

  assert.equal(result.penyelenggara, "TENANT A");
  assert.equal(result.kapasitas_disewakan, "2 SITE");

  await assert.rejects(
    sanitizeApplicantTower(
      validTower({
        tenants: [
          { penyelenggara: "Tenant A", kapasitas_disewakan: "2" },
          { penyelenggara: " tenant a ", kapasitas_disewakan: "1" },
        ],
      }),
      { accountability: { user: "applicant-id" }, database: databaseWithRegion() },
    ),
    /duplikat/,
  );

  await assert.rejects(
    sanitizeApplicantTower(
      validTower({
        tenants: [
          { penyelenggara: "Tenant A", kapasitas_disewakan: "9" },
          { penyelenggara: "Tenant B", kapasitas_disewakan: "8" },
        ],
      }),
      { accountability: { user: "applicant-id" }, database: databaseWithRegion() },
    ),
    /kapasitas total menara/,
  );
});

test("Directus create and update filters uppercase tower and tenant text", async () => {
  const filters = new Map();
  registerHook(
    { filter: (event, handler) => filters.set(event, handler) },
    { env: {} },
  );

  const createTower = await filters.get("items.create")(
    validTower({ nama_pemilik: "Pemilik Baru" }),
    { collection: "tower_infrastruktur" },
    {
      accountability: { user: "admin-id" },
      database: databaseWithRegion(),
    },
  );
  assert.equal(createTower.nama_pemilik, "PEMILIK BARU");
  assert.equal(createTower.verification_status, "Submitted");

  const updateTower = await filters.get("items.update")(
    { alamat: "Jalan Merdeka" },
    { collection: "tower_infrastruktur" },
    { accountability: { admin: true } },
  );
  assert.equal(updateTower.alamat, "JALAN MERDEKA");

  const createTenant = await filters.get("items.create")(
    { penyelenggara: "Tenant Baru", kapasitas_disewakan: "2 site" },
    { collection: "tower_tenant" },
    { accountability: { user: "admin-id" } },
  );
  assert.deepEqual(createTenant, {
    penyelenggara: "TENANT BARU",
    kapasitas_disewakan: "2 SITE",
  });

  const updateTenant = await filters.get("items.update")(
    { penyelenggara: "Tenant Diperbarui" },
    { collection: "tower_tenant" },
    { accountability: { user: "admin-id" } },
  );
  assert.deepEqual(updateTenant, { penyelenggara: "TENANT DIPERBARUI" });
});

test("restricts Applicant file creation to bounded XLSX uploads", () => {
  assert.equal(
    validateApplicantFile({
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename_download: "towers.xlsx",
      filesize: 1024,
    }).filename_download,
    "towers.xlsx",
  );
  assert.throws(() =>
    validateApplicantFile({
      type: "application/pdf",
      filename_download: "document.pdf",
      filesize: 1024,
    }),
  );
});

test("keeps Directus archive flag and portal deletion timestamp synchronized", () => {
  const archive = synchronizeTowerArchiveFields({ is_archived: true });
  assert.equal(archive.is_archived, true);
  assert.ok(Number.isFinite(Date.parse(archive.deleted_at)));

  assert.deepEqual(
    synchronizeTowerArchiveFields({ is_archived: false }),
    { is_archived: false, deleted_at: null },
  );
  assert.deepEqual(
    synchronizeTowerArchiveFields({ deleted_at: "2026-10-21T00:00:00Z" }),
    { deleted_at: "2026-10-21T00:00:00Z", is_archived: true },
  );
  assert.deepEqual(
    synchronizeTowerArchiveFields({ deleted_at: null }),
    { deleted_at: null, is_archived: false },
  );
});

test("limits Web Manager Directus updates to the archive flag", async () => {
  const database = (table) => ({
    select() {
      return this;
    },
    where() {
      return this;
    },
    async first() {
      return table === "directus_roles" ? { name: "Web Manager" } : undefined;
    },
  });

  const archive = await guardTowerArchiveOnlyUpdate(
    { is_archived: true },
    { user: "manager-id", role: "manager-role" },
    database,
  );
  assert.equal(archive.is_archived, true);
  assert.ok(archive.deleted_at);

  await assert.rejects(
    guardTowerArchiveOnlyUpdate(
      { nama_pemilik: "Tampered" },
      { user: "manager-id", role: "manager-role" },
      database,
    ),
    /hanya dapat mengarsipkan/,
  );
});

test("blocks permanent deletion of tower records for every role", () => {
  assert.throws(guardTowerDelete.bind(null, "tower_infrastruktur"), /tidak dapat dihapus permanen/);
  assert.equal(guardTowerDelete("tower_tenant"), undefined);
});
