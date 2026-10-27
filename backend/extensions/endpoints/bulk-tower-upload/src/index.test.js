import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ExcelJS from "exceljs";
import { parseTowerWorkbook, validateXlsxArchive } from "./index.js";

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

test("groups tower rows and repeats the shared tower capacity for each tenant", async () => {
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
  assert.equal(items[0].tenants[0].kapasitas_disewakan, "6");
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

test("parses the expanded template, validates the region hierarchy, and splits tenants", async () => {
  const items = await parseTowerWorkbook(
    await workbookBuffer(
      [expandedValidRow("000101")],
      "Template",
      expandedHeaders,
    ),
  );
  assert.equal(items[0].tower.id_menara, "000101");
  assert.equal(items[0].tower.provinsi, "ACEH");
  assert.equal(items[0].tower.kab_kota, "KABUPATEN ACEH SELATAN");
  assert.equal(items[0].tenants.length, 2);
  assert.deepEqual(
    items[0].tenants.map(({ penyelenggara }) => penyelenggara),
    ["PENYELENGGARA A", "PENYELENGGARA B"],
  );
});

test("rejects expanded-template rows with mismatched administrative regions", async () => {
  const row = expandedValidRow("000102");
  row[6] = "Sumatera Utara";
  await assert.rejects(
    parseTowerWorkbook(await workbookBuffer([row], "Template", expandedHeaders)),
    (error) =>
      error.errors.some(
        (issue) => issue.column === "kab_kota" && issue.row === 2,
      ),
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
  await assert.rejects(
    parseTowerWorkbook(buffer),
    (error) =>
      error.errors[0]?.message === "Workbook tidak berisi baris data.",
  );
});

test("does not accept construction years after the template's 2026 limit", async () => {
  const row = validRow("tower-2027");
  row[2] = 2027;
  await assert.rejects(
    parseTowerWorkbook(await workbookBuffer([row])),
    (error) =>
      error.errors.some(
        (issue) => issue.column === "tahun_pembangunan" && issue.row === 2,
      ),
  );
});
