import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ExcelJS from "exceljs";
import {
  duplicateTowerIdError,
  parseTowerWorkbook,
  resolveAdministrativeRegions,
  validateXlsxArchive,
} from "./index.js";

const headers = [
  "id_menara",
  "nama_pemilik",
  "tahun_pembangunan",
  "penyelenggara_penyewa",
  "longitude",
  "latitude",
  "alamat",
  "jenis_menara",
  "tinggi_menara",
  "kapasitas_maksimal",
  "kapasitas_disewakan",
  "kapasitas_digunakan_sendiri",
];
const expandedHeaders = [
  "Kode/ID Menara",
  "Nama Pemilik Menara Telekomunikasi",
  "Tahun Pembangunan Menara Telekomunikasi",
  "Penyelenggara Jaringan Telekomunikasi",
  "Longitude",
  "Latitude",
  "Provinsi",
  "Kabupaten/Kota",
  "Kecamatan",
  "Kelurahan",
  "Alamat",
  "Jenis Menara Telekomunikasi",
  "Tinggi Menara Telekomunikasi (AGL)",
  "Kapasitas maksimal menara telekomunikasi",
  "Kapasitas menara telekomunikasi yang disewakan",
  "Kapasitas menara telekomunikasi yang digunakan sendiri",
];

test("turns Directus ID uniqueness errors into a clear duplicate-upload reason", () => {
  assert.deepEqual(
    duplicateTowerIdError({
      code: "RECORD_NOT_UNIQUE",
      extensions: { field: "id_menara", value: "000123" },
    }),
    {
      row: null,
      column: "id_menara",
      message:
        'ID menara "000123" sudah terdaftar di database (kemungkinan sudah pernah diunggah). Tidak ada data dari file ini yang disimpan.',
    },
  );
  assert.equal(duplicateTowerIdError({ code: "RECORD_NOT_UNIQUE" }), null);
});

async function workbookBuffer(rows, sheetName = "Template", columns = headers) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  worksheet.addRow(columns);
  for (const row of rows) worksheet.addRow(row);
  return workbook.xlsx.writeBuffer();
}

const validRow = (id) => [
  id,
  "Pemilik Menara",
  2020,
  "Penyelenggara",
  106.8,
  -6.2,
  "Jakarta",
  "Telekomunikasi",
  42,
  10,
  6,
  4,
];
const expandedValidRow = (id) => [
  id,
  "Pemilik Menara",
  2020,
  "Penyelenggara A, Penyelenggara B",
  106.8,
  -6.2,
  "Aceh",
  "Kabupaten Aceh Selatan",
  "Bakongan",
  "Keude Bakongan",
  "Jalan Utama",
  "Telekomunikasi",
  42,
  10,
  6,
  4,
];

test("groups tower rows and stores rented capacity once on the tower", async () => {
  const items = await parseTowerWorkbook(
    await workbookBuffer([validRow("tower-1"), validRow("tower-2")]),
  );
  assert.equal(items.length, 2);
  assert.equal(items[0].tower.longitude, 106.8);
  assert.equal(items[0].tower.latitude, -6.2);
  assert.equal("map" in items[0].tower, false);
  assert.equal(items[0].tower.id_menara, "TOWER-1");
  assert.equal(items[0].tower.nama_pemilik, "PEMILIK MENARA");
  assert.equal(items[0].tower.alamat, "JAKARTA");
  assert.equal(items[0].tower.jenis_menara, "TELEKOMUNIKASI");
  assert.equal(items[0].tenants[0].penyelenggara, "PENYELENGGARA");
  assert.equal("kapasitas_disewakan" in items[0].tenants[0], false);
  assert.equal(items[0].tower.kapasitas_disewakan, "6");
  assert.equal(items[0].tower.kapasitas_maksimal, "10");
});

test("rejects the workbook if any row has invalid coordinates", async () => {
  const invalid = validRow("tower-2");
  invalid[4] = 150;
  await assert.rejects(
    parseTowerWorkbook(await workbookBuffer([validRow("tower-1"), invalid])),
    (error) => {
      assert.equal(error.errors[0].row, 3);
      assert.equal(error.errors[0].column, "longitude");
      return true;
    },
  );
});

test("groups repeated tower IDs when tower attributes match and tenant names differ", async () => {
  const secondTenant = validRow("tower-1");
  secondTenant[3] = "Penyelenggara B";
  secondTenant[10] = 6;
  const groups = await parseTowerWorkbook(
    await workbookBuffer([validRow("tower-1"), secondTenant]),
  );
  assert.equal(groups.length, 1);
  assert.equal(groups[0].tenants.length, 2);
  assert.equal(groups[0].tenants[1].penyelenggara, "PENYELENGGARA B");
  assert.equal("kapasitas_disewakan" in groups[0].tenants[1], false);
});

test("rejects repeated tower IDs with differing tower fields or duplicate tenants", async () => {
  const changedTower = validRow("tower-1");
  changedTower[6] = "Bandung";
  await assert.rejects(
    parseTowerWorkbook(await workbookBuffer([validRow("tower-1"), changedTower])),
    (error) => error.errors.some((issue) => issue.column === "id_menara" && issue.row === 3),
  );
  await assert.rejects(
    parseTowerWorkbook(await workbookBuffer([validRow("tower-1"), validRow("tower-1")])),
    (error) => error.errors.some((issue) => issue.column === "penyelenggara" && issue.row === 3),
  );
  const changedCapacity = validRow("tower-1");
  changedCapacity[3] = "Penyelenggara B";
  changedCapacity[10] = 5;
  await assert.rejects(
    parseTowerWorkbook(
      await workbookBuffer([validRow("tower-1"), changedCapacity]),
    ),
    (error) => error.errors.some((issue) => issue.column === "id_menara" && issue.row === 3),
  );
});

test("rejects values that exceed the diagram's field limits", async () => {
  const longOwner = validRow("tower-1");
  longOwner[1] = "x".repeat(51);
  await assert.rejects(
    parseTowerWorkbook(await workbookBuffer([longOwner])),
    (error) => error.errors.some((issue) => issue.column === "nama_pemilik"),
  );

  const tallTower = validRow("tower-2");
  tallTower[8] = 1000;
  await assert.rejects(
    parseTowerWorkbook(await workbookBuffer([tallTower])),
    (error) => error.errors.some((issue) => issue.column === "tinggi_menara"),
  );

  const tooPrecise = validRow("tower-3");
  tooPrecise[4] = 106.1234567;
  await assert.rejects(
    parseTowerWorkbook(await workbookBuffer([tooPrecise])),
    (error) => error.errors.some((issue) => issue.column === "longitude"),
  );
});

test("accepts six coordinate decimals and rejects non-ZIP files before parsing", async () => {
  const row = validRow("tower-1");
  row[4] = 106.123456;
  row[5] = -6.123456;
  const buffer = await workbookBuffer([row]);
  validateXlsxArchive(Buffer.from(buffer));
  const items = await parseTowerWorkbook(buffer);
  assert.equal(items[0].tower.longitude, 106.123456);
  assert.equal(items[0].tower.latitude, -6.123456);

  assert.throws(
    () => validateXlsxArchive(Buffer.from("not a zip archive")),
    (error) => error.errors[0].message.includes("valid"),
  );
});

test("finds the template headers on the data sheet", async () => {
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet("Petunjuk").addRow(["Baca petunjuk upload"]);
  const data = workbook.addWorksheet("Template");
  data.addRow(headers);
  data.addRow(validRow("tower-1"));
  const items = await parseTowerWorkbook(await workbook.xlsx.writeBuffer());
  assert.equal(items[0].tower.id_menara, "TOWER-1");
});

test("accepts the previous template but does not trust manually entered regions", async () => {
  const row = expandedValidRow("000101");
  row[6] = "Provinsi yang tidak sesuai";
  const items = await parseTowerWorkbook(
    await workbookBuffer(
      [row],
      "Template",
      expandedHeaders,
    ),
  );
  assert.equal(items[0].tower.id_menara, "000101");
  assert.equal(items[0].tower.provinsi, null);
  assert.equal(items[0].tower.kab_kota, null);
  assert.equal(items[0].tower.kecamatan, null);
  assert.equal(items[0].tower.kelurahan, null);
  assert.equal(items[0].tenants.length, 2);
  assert.deepEqual(
    items[0].tenants.map(({ penyelenggara }) => penyelenggara),
    ["PENYELENGGARA A", "PENYELENGGARA B"],
  );
});

test("rejects expanded-template IDs entered as numeric cells", async () => {
  const row = expandedValidRow(101);
  await assert.rejects(
    parseTowerWorkbook(await workbookBuffer([row], "Template", expandedHeaders)),
    (error) =>
      error.errors.some((issue) => issue.column === "id_menara" && issue.row === 2),
  );
});

test("accepts the shipped template archive and recognizes its headers", async () => {
  const buffer = await readFile(
    new URL("../templates/Template_Registrasi_Menara.xlsx", import.meta.url),
  );
  validateXlsxArchive(buffer);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.getWorksheet("Form_Registrasi");
  assert.deepEqual(
    worksheet.getRow(3).values.slice(1),
    [
      "Kode/ID Menara",
      "Nama Pemilik Menara Telekomunikasi",
      "Tahun Pembangunan Menara Telekomunikasi",
      "Penyelenggara Jaringan Telekomunikasi",
      "Longitude",
      "Latitude",
      "Alamat",
      "Jenis Menara Telekomunikasi",
      "Tinggi Menara Telekomunikasi (AGL)",
      "Kapasitas maksimal menara telekomunikasi",
      "Kapasitas menara telekomunikasi yang disewakan",
      "Kapasitas menara telekomunikasi yang digunakan sendiri",
    ],
  );
  assert.equal(workbook.getWorksheet("Data_Master").state, "hidden");
  await assert.rejects(
    parseTowerWorkbook(buffer),
    (error) =>
      error.errors[0]?.message === "Workbook tidak berisi baris data.",
  );
});

test("resolves all tower regions in one PostGIS query and leaves unmatched points blank", async () => {
  const registrations = [
    { tower: { longitude: 106.8, latitude: -6.2 } },
    { tower: { longitude: 120, latitude: -8 } },
  ];
  const queries = [];
  const database = {
    async raw(sql, bindings) {
      queries.push({ sql, bindings });
      return {
        rows: [
          {
            row_number: 1,
            province: "Jawa Tengah",
            regency_city: "Kota Semarang",
            district: "Semarang Tengah",
            village: "Miroto",
          },
          {
            row_number: 2,
            province: null,
            regency_city: null,
            district: null,
            village: null,
          },
        ],
      };
    },
  };

  const resolved = await resolveAdministrativeRegions(database, registrations);
  assert.equal(queries.length, 1);
  assert.match(queries[0].sql, /ST_Covers/);
  assert.match(queries[0].sql, /ST_MakePoint\(input_points\.longitude, input_points\.latitude\)/);
  assert.deepEqual(JSON.parse(queries[0].bindings[0]), [
    { row_number: 1, longitude: 106.8, latitude: -6.2 },
    { row_number: 2, longitude: 120, latitude: -8 },
  ]);
  assert.deepEqual(
    [
      resolved[0].tower.provinsi,
      resolved[0].tower.kab_kota,
      resolved[0].tower.kecamatan,
      resolved[0].tower.kelurahan,
    ],
    ["JAWA TENGAH", "KOTA SEMARANG", "SEMARANG TENGAH", "MIROTO"],
  );
  assert.deepEqual(
    [
      resolved[1].tower.provinsi,
      resolved[1].tower.kab_kota,
      resolved[1].tower.kecamatan,
      resolved[1].tower.kelurahan,
    ],
    [null, null, null, null],
  );
});

test("accepts the current construction year and rejects future years", async () => {
  const currentYear = new Date().getFullYear();
  const currentYearRow = validRow("tower-current-year");
  currentYearRow[2] = currentYear;
  const [parsedCurrentYear] = await parseTowerWorkbook(
    await workbookBuffer([currentYearRow]),
  );
  assert.equal(parsedCurrentYear.tower.tahun_pembangunan, currentYear);

  const futureYearRow = validRow("tower-future-year");
  futureYearRow[2] = currentYear + 1;
  await assert.rejects(
    parseTowerWorkbook(await workbookBuffer([futureYearRow])),
    (error) =>
      error.errors.some(
        (issue) => issue.column === "tahun_pembangunan" && issue.row === 2,
      ),
  );
});
