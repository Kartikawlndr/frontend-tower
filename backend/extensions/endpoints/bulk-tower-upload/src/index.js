import { defineEndpoint } from "@directus/extensions-sdk";
import ExcelJS from "exceljs";
import { fileURLToPath } from "node:url";
import {
  createRegisteredTowers,
  createRejectedAttempt,
} from "../../../shared/normalized-registration.js";
import { resolveAdministrativeRegions } from "../../../hooks/applicant-tower-guard/src/administrative-regions.js";

export { resolveAdministrativeRegions } from "../../../hooks/applicant-tower-guard/src/administrative-regions.js";

const COLLECTION = "tower_infrastruktur";
const FILE_COLLECTION = "directus_files";
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const TEMPLATE_PATH = fileURLToPath(new URL("../templates/Template_Registrasi_Menara.xlsx", import.meta.url));
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ARCHIVE_SIZE = 50 * 1024 * 1024;
const MAX_ARCHIVE_ENTRIES = 128;
const MAX_COMPRESSION_RATIO = 100;
const MAX_ROWS = 1000;
const MAX_ERRORS = 200;
const MAX_TEXT_LENGTH = 50;
const MAX_CONSTRUCTION_YEAR = 2026;
const HEADERS = [
  "id_menara",
  "nama_pemilik",
  "tahun_pembangunan",
  "penyelenggara",
  "longitude",
  "latitude",
  "alamat",
  "jenis_menara",
  "tinggi_menara",
  "kapasitas_maksimal",
  "kapasitas_disewakan",
  "kapasitas_digunakan_sendiri",
];
const ADMINISTRATIVE_HEADERS = [
  "provinsi",
  "kab_kota",
  "kecamatan",
  "kelurahan",
];
const DISPLAY_HEADERS = [
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
];
const DISPLAY_HEADER_FIELDS = new Map(
  [
    ...DISPLAY_HEADERS.map((header, index) => [
      normalizeHeader(header),
      HEADERS[index],
    ]),
    ["provinsi", "provinsi"],
    ["kabupaten/kota", "kab_kota"],
    ["kecamatan", "kecamatan"],
    ["kelurahan", "kelurahan"],
  ],
);
const LEGACY_HEADER_FIELDS = new Map([
  ...HEADERS.map((header) => [header, header]),
  ...ADMINISTRATIVE_HEADERS.map((header) => [header, header]),
  ["penyelenggara_penyewa", "penyelenggara"],
]);

class WorkbookValidationError extends Error {
  constructor(errors) {
    super("Workbook validation failed");
    this.errors = errors;
  }
}

export function validateXlsxArchive(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 22 || buffer.length > MAX_FILE_SIZE) {
    throw new WorkbookValidationError([
      { row: null, column: null, message: "Ukuran file tidak valid atau melebihi 10 MB." },
    ]);
  }

  const eocdSignature = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
  const eocdOffset = buffer.lastIndexOf(
    eocdSignature,
    buffer.length - 22,
  );
  if (eocdOffset < 0 || eocdOffset + 22 > buffer.length) {
    throw new WorkbookValidationError([
      { row: null, column: null, message: "File bukan workbook .xlsx yang valid." },
    ]);
  }

  const diskNumber = buffer.readUInt16LE(eocdOffset + 4);
  const centralDirectoryDisk = buffer.readUInt16LE(eocdOffset + 6);
  const entriesOnDisk = buffer.readUInt16LE(eocdOffset + 8);
  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirectorySize = buffer.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  const commentLength = buffer.readUInt16LE(eocdOffset + 20);
  if (
    diskNumber !== 0 ||
    centralDirectoryDisk !== 0 ||
    entriesOnDisk !== entryCount ||
    entryCount === 0 ||
    entryCount > MAX_ARCHIVE_ENTRIES ||
    centralDirectorySize === 0xffffffff ||
    centralDirectoryOffset === 0xffffffff ||
    eocdOffset + 22 + commentLength !== buffer.length ||
    centralDirectoryOffset + centralDirectorySize > eocdOffset
  ) {
    throw new WorkbookValidationError([
      { row: null, column: null, message: "Struktur arsip .xlsx tidak didukung atau tidak aman." },
    ]);
  }

  let offset = centralDirectoryOffset;
  let totalUncompressed = 0;
  for (let index = 0; index < entryCount; index += 1) {
    if (
      offset + 46 > eocdOffset ||
      buffer.readUInt32LE(offset) !== 0x02014b50
    ) {
      throw new WorkbookValidationError([
        { row: null, column: null, message: "Struktur arsip .xlsx tidak valid." },
      ]);
    }

    const flags = buffer.readUInt16LE(offset + 8);
    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const filenameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const entryCommentLength = buffer.readUInt16LE(offset + 32);
    const diskStart = buffer.readUInt16LE(offset + 34);
    const entryEnd =
      offset + 46 + filenameLength + extraLength + entryCommentLength;
    const filename = buffer
      .subarray(offset + 46, offset + 46 + filenameLength)
      .toString("utf8")
      .replaceAll("\\", "/");

    if (
      entryEnd > centralDirectoryOffset + centralDirectorySize ||
      compressedSize === 0xffffffff ||
      uncompressedSize === 0xffffffff ||
      diskStart !== 0 ||
      (flags & 0x41) !== 0 ||
      ![0, 8].includes(compressionMethod) ||
      !filename ||
      filename.includes("\0") ||
      filename.startsWith("/") ||
      /^[a-z]:/i.test(filename) ||
      filename.split("/").includes("..") ||
      /(^|\/)(vbaProject\.bin|externalLinks|embeddings|connections)(\/|$)/i.test(filename)
    ) {
      throw new WorkbookValidationError([
        { row: null, column: null, message: "Arsip .xlsx berisi komponen yang tidak didukung." },
      ]);
    }

    totalUncompressed += uncompressedSize;
    if (
      totalUncompressed > MAX_ARCHIVE_SIZE ||
      (uncompressedSize > 1024 * 1024 &&
        (compressedSize === 0 ||
          uncompressedSize / compressedSize > MAX_COMPRESSION_RATIO))
    ) {
      throw new WorkbookValidationError([
        { row: null, column: null, message: "Ukuran isi workbook setelah dibuka melebihi batas aman." },
      ]);
    }
    offset = entryEnd;
  }

  if (offset !== centralDirectoryOffset + centralDirectorySize) {
    throw new WorkbookValidationError([
      { row: null, column: null, message: "Daftar komponen arsip .xlsx tidak konsisten." },
    ]);
  }
}

export function duplicateTowerIdError(error) {
  if (
    error?.code === "RECORD_NOT_UNIQUE" &&
    error?.extensions?.field === "id_menara"
  ) {
    const towerId = error.extensions.value;
    return {
      row: null,
      column: "id_menara",
      message: `ID menara "${String(towerId)}" sudah terdaftar di database (kemungkinan sudah pernah diunggah). Tidak ada data dari file ini yang disimpan.`,
    };
  }
  if (error?.code === "23505") {
    return {
      row: null,
      column: "id_menara",
      message:
        "ID menara sudah terdaftar di database (kemungkinan sudah pernah diunggah). Tidak ada data dari file ini yang disimpan.",
    };
  }
  return null;
}

async function readStream(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function cellValue(cell) {
  const value = cell.value;
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "object" && ("formula" in value || "sharedFormula" in value)) {
    throw new Error("Rumus Excel tidak didukung; masukkan nilai hasilnya.");
  }
  if (typeof value === "object" && Array.isArray(value.richText)) {
    return value.richText.map((part) => part.text).join("");
  }
  throw new Error("Format sel tidak didukung.");
}

function normalizeHeader(value) {
  return String(value).trim().toLowerCase();
}

function findHeader(workbook) {
  const expectedHeaderSets = [
    new Set(HEADERS),
    new Set([...HEADERS, ...ADMINISTRATIVE_HEADERS]),
  ];
  const matches = [];

  for (const worksheet of workbook.worksheets) {
    const lastRow = Math.min(worksheet.rowCount, 20);
    for (let rowNumber = 1; rowNumber <= lastRow; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber);
      const values = [];
      try {
        row.eachCell({ includeEmpty: false }, (cell, column) => {
          const value = normalizeHeader(cellValue(cell));
          if (value) values.push({ value, column });
        });
      } catch {
        continue;
      }

      const mapped = values.map(({ value, column }) => ({
        field: DISPLAY_HEADER_FIELDS.get(value) ?? LEGACY_HEADER_FIELDS.get(value),
        column,
      }));
      const fields = mapped.map(({ field }) => field);
      const expected = expectedHeaderSets.find(
        (set) =>
          fields.length === set.size &&
          new Set(fields).size === fields.length &&
          fields.every((field) => set.has(field)),
      );
      if (expected) {
        matches.push({
          worksheet,
          rowNumber,
          hasAdministrativeColumns: expected.size > HEADERS.length,
          officialTemplate: values.some(
            ({ value }) => value === normalizeHeader(DISPLAY_HEADERS[0]),
          ),
          columns: new Map(mapped.map(({ field, column }) => [field, column])),
        });
      }
    }
  }

  if (matches.length !== 1) {
    throw new WorkbookValidationError([
      {
        row: null,
        column: null,
        message:
          matches.length === 0
            ? `Header template tidak ditemukan. Gunakan ${DISPLAY_HEADERS.length} kolom pada template resmi.`
            : "Header template ditemukan lebih dari satu kali; pastikan hanya ada satu sheet data.",
      },
    ]);
  }

  const match = matches[0];
  const requiredHeaders = match.hasAdministrativeColumns
    ? [...HEADERS, ...ADMINISTRATIVE_HEADERS]
    : HEADERS;
  const missing = requiredHeaders.filter((header) => !match.columns.has(header));
  if (missing.length) {
    throw new WorkbookValidationError(
      missing.map((column) => ({ row: match.rowNumber, column, message: "Kolom wajib tidak ditemukan." })),
    );
  }
  return match;
}

function firstDataRow(worksheet, headerRow, columns) {
  const instructionRow = worksheet.getRow(headerRow + 1);
  const isInstructionSubheader = [...columns.values()].every((column) => {
    try {
      const value = cellValue(instructionRow.getCell(column));
      return (
        typeof value === "string" &&
        value.trim().toLocaleLowerCase("id-ID").startsWith("wajib;")
      );
    } catch {
      return false;
    }
  });
  return headerRow + (isInstructionSubheader ? 2 : 1);
}

function readText(
  row,
  column,
  rowNumber,
  errors,
  { numericAllowed = false, field = HEADERS[column - 1] } = {},
) {
  let value;
  try {
    value = cellValue(row.getCell(column));
  } catch (error) {
    errors.push({ row: rowNumber, column: field, message: error.message });
    return "";
  }

  if (typeof value === "number" && (!numericAllowed || !Number.isFinite(value))) {
    errors.push({ row: rowNumber, column: field, message: "Isi dengan teks yang valid." });
    return "";
  }
  const normalized = String(value).normalize("NFC").trim();
  if (!normalized) {
    errors.push({ row: rowNumber, column: field, message: "Kolom wajib diisi." });
  } else if (Array.from(normalized).length > MAX_TEXT_LENGTH) {
    errors.push({
      row: rowNumber,
      column: field,
      message: `Maksimal ${MAX_TEXT_LENGTH} karakter.`,
    });
  }
  return normalized.toUpperCase();
}

function decimalPlaces(value) {
  const numericText = String(value).trim().toLowerCase();
  const [mantissa, exponentText] = numericText.split("e");
  const fractionalLength = mantissa.split(".")[1]?.length ?? 0;
  const exponent = exponentText ? Number(exponentText) : 0;
  return Math.max(0, fractionalLength - exponent);
}

function readNumber(
  row,
  column,
  rowNumber,
  errors,
  { integer = false, min, max, maxDecimalPlaces, field = HEADERS[column - 1] } = {},
) {
  let value;
  try {
    value = cellValue(row.getCell(column));
  } catch (error) {
    errors.push({ row: rowNumber, column: field, message: error.message });
    return null;
  }

  const number =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value.trim())
        : NaN;
  if (!Number.isFinite(number)) {
    errors.push({ row: rowNumber, column: field, message: "Isi dengan angka yang valid." });
    return null;
  }
  if (integer && !Number.isInteger(number)) {
    errors.push({ row: rowNumber, column: field, message: "Isi dengan angka bulat." });
    return null;
  }
  if (min !== undefined && number < min) {
    errors.push({ row: rowNumber, column: field, message: `Nilai minimal ${min}.` });
    return null;
  }
  if (max !== undefined && number > max) {
    errors.push({ row: rowNumber, column: field, message: `Nilai maksimal ${max}.` });
    return null;
  }
  if (
    maxDecimalPlaces !== undefined &&
    decimalPlaces(typeof value === "string" ? value : number) > maxDecimalPlaces
  ) {
    errors.push({
      row: rowNumber,
      column: field,
      message: `Maksimal ${maxDecimalPlaces} angka di belakang koma.`,
    });
    return null;
  }
  return number;
}

export async function parseTowerWorkbook(buffer) {
  validateXlsxArchive(buffer);
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw new WorkbookValidationError([
      { row: null, column: null, message: "File tidak dapat dibaca sebagai workbook .xlsx yang valid." },
    ]);
  }

  const {
    worksheet,
    rowNumber: headerRow,
    columns,
    officialTemplate,
  } = findHeader(workbook);
  const groups = new Map();
  const errors = [];
  const dataStartRow = firstDataRow(worksheet, headerRow, columns);
  let dataRowCount = 0;

  worksheet.eachRow({ includeEmpty: false }, (row, index) => {
    if (index < dataStartRow || errors.length >= MAX_ERRORS) return;
    const rowHasData = [...columns.values()].some((column) => {
      try {
        const value = cellValue(row.getCell(column));
        return value !== "" && value !== null && value !== undefined;
      } catch {
        return true;
      }
    });
    if (!rowHasData) return;

    if (dataRowCount >= MAX_ROWS) {
      errors.push({ row: index, column: null, message: `Jumlah baris data melebihi batas ${MAX_ROWS}.` });
      return;
    }
    dataRowCount += 1;

    const readFieldText = (field, options = {}) =>
      readText(row, columns.get(field), index, errors, { ...options, field });
    const readFieldNumber = (field, options = {}) =>
      readNumber(row, columns.get(field), index, errors, { ...options, field });

    const id_menara = readFieldText("id_menara", {
      numericAllowed: !officialTemplate,
    });
    const nama_pemilik = readFieldText("nama_pemilik");
    const tahun_pembangunan = readFieldNumber("tahun_pembangunan", {
      integer: true,
      min: 1900,
      max: MAX_CONSTRUCTION_YEAR,
    });
    const penyelenggara = readFieldText("penyelenggara");
    const kapasitas_disewakan = readFieldText("kapasitas_disewakan", {
      numericAllowed: true,
    });
    const longitude = readFieldNumber("longitude", {
      min: 95,
      max: 141,
      maxDecimalPlaces: 6,
    });
    const latitude = readFieldNumber("latitude", {
      min: -11,
      max: 6,
      maxDecimalPlaces: 6,
    });
    const alamat = readFieldText("alamat");
    const jenis_menara = readFieldText("jenis_menara");
    const tinggi_menara = readFieldNumber("tinggi_menara", {
      integer: true,
      min: 1,
      max: 999,
    });
    const kapasitas_maksimal = readFieldText("kapasitas_maksimal", {
      numericAllowed: true,
    });
    const kapasitas_digunakan_sendiri = readFieldText(
      "kapasitas_digunakan_sendiri",
      { numericAllowed: true },
    );

    const tower = {
      id_menara,
      nama_pemilik,
      tahun_pembangunan,
      provinsi: null,
      kab_kota: null,
      kecamatan: null,
      kelurahan: null,
      alamat,
      jenis_menara,
      tinggi_menara,
      kapasitas_maksimal,
      kapasitas_disewakan,
      kapasitas_digunakan_sendiri,
      longitude,
      latitude,
    };
    let group = groups.get(id_menara);
    if (!group) {
      group = { tower, tenants: [], firstRow: index };
      groups.set(id_menara, group);
    } else if (JSON.stringify(group.tower) !== JSON.stringify(tower)) {
      errors.push({
        row: index,
        column: "id_menara",
        message: `Atribut menara harus sama dengan baris pertama (${group.firstRow}) untuk ID yang sama.`,
      });
    }

    const tenantNames =
      typeof penyelenggara === "string"
        ? penyelenggara.split(",").map((name) => name.trim())
        : [];
    if (tenantNames.some((name) => !name)) {
      errors.push({
        row: index,
        column: "penyelenggara",
        message: "Pisahkan nama penyelenggara dengan koma tanpa nama kosong.",
      });
    }
    for (const tenant of tenantNames.filter(Boolean)) {
      const duplicate = group.tenants.some(
        (existing) =>
          existing.penyelenggara.toLocaleLowerCase("id-ID") ===
          tenant.toLocaleLowerCase("id-ID"),
      );
      if (duplicate) {
        errors.push({
          row: index,
          column: "penyelenggara",
          message: `Tenant "${tenant}" duplikat untuk ID menara ini.`,
        });
      } else if (typeof kapasitas_disewakan === "string") {
        group.tenants.push({
          penyelenggara: tenant,
          kapasitas_disewakan,
        });
      }
    }
  });

  if (groups.size === 0 && errors.length === 0) {
    errors.push({ row: null, column: null, message: "Workbook tidak berisi baris data." });
  }
  if (errors.length) {
    throw new WorkbookValidationError(errors.slice(0, MAX_ERRORS));
  }
  return [...groups.values()].map(({ tower, tenants }) => ({
    tower,
    tenants,
  }));
}

async function removeUploadedFile(ItemsService, req, schema, fileId, logger) {
  try {
    const files = new ItemsService(FILE_COLLECTION, {
      schema,
      accountability: null,
    });
    await files.deleteOne(fileId);
  } catch (error) {
    logger.error(error, `Failed to remove rejected workbook ${fileId}`);
  }
}

export default defineEndpoint((router, { logger, services, database, getSchema }) => {
  const { AssetsService, ItemsService } = services;

  router.get("/template", (_req, res) => {
    return res
      .type(XLSX_MIME)
      .attachment("Template_Registrasi_Menara.xlsx")
      .sendFile(TEMPLATE_PATH, (error) => {
        if (error) logger.error(error, "Failed to serve tower registration template");
      });
  });

  router.post("/", async (req, res) => {
    if (!req.accountability?.user) {
      return res.status(401).json({ error: "Login Directus diperlukan untuk memproses file." });
    }

    const fileId = req.body?.file_id;
    if (typeof fileId !== "string" || !/^[0-9a-f-]{36}$/i.test(fileId)) {
      return res.status(400).json({ error: "ID file Excel tidak valid." });
    }

    const schema = await getSchema();
    const account = await database("directus_users")
      .select("role")
      .where({ id: req.accountability.user })
      .first();
    const applicantRole = account?.role
      ? await database("directus_roles")
          .select("name")
          .where({ id: account.role })
          .first()
      : null;
    if (!["Applicant", "Web Manager", "Administrator"].includes(applicantRole?.name)) {
      return res.status(403).json({ error: "Peran akun tidak dapat mengunggah pendaftaran menara." });
    }

    let uploadedFile;
    let shouldRemoveFile = false;

    try {
      const files = new ItemsService(FILE_COLLECTION, {
        schema,
        accountability: null,
      });
      uploadedFile = await files.readOne(fileId, {
        fields: ["id", "type", "filesize", "filename_download", "uploaded_by"],
      });

      if (uploadedFile.uploaded_by !== req.accountability.user) {
        return res.status(403).json({ error: "File harus diunggah oleh akun yang sedang login." });
      }
      if (
        uploadedFile.type !== XLSX_MIME ||
        typeof uploadedFile.filename_download !== "string" ||
        !uploadedFile.filename_download.toLowerCase().endsWith(".xlsx")
      ) {
        shouldRemoveFile = true;
        throw new WorkbookValidationError([
          { row: null, column: null, message: "Unggah file .xlsx sesuai template resmi." },
        ]);
      }
      if (Number(uploadedFile.filesize) > MAX_FILE_SIZE) {
        shouldRemoveFile = true;
        throw new WorkbookValidationError([
          { row: null, column: null, message: "Ukuran file maksimal 10 MB." },
        ]);
      }

      shouldRemoveFile = true;
      const assets = new AssetsService({ schema, accountability: null });
      const { stream } = await assets.getAsset(fileId);
      const fileBuffer = await readStream(stream);
      if (fileBuffer.length > MAX_FILE_SIZE) {
        throw new WorkbookValidationError([
          { row: null, column: null, message: "Ukuran file maksimal 10 MB." },
        ]);
      }

      const parsedRegistrations = await parseTowerWorkbook(fileBuffer);
      const registrations = await resolveAdministrativeRegions(
        database,
        parsedRegistrations,
      );
      const existing = await database(COLLECTION)
        .select("id_menara")
        .whereIn(
          "id_menara",
          registrations.map(({ tower }) => tower.id_menara),
        )
      if (existing.length) {
        throw new WorkbookValidationError(
          existing.map(({ id_menara }) => ({
            row: null,
            column: "id_menara",
            message: `ID menara "${id_menara}" sudah terdaftar di database (kemungkinan sudah pernah diunggah). Tidak ada data dari file ini yang disimpan.`,
          })),
        );
      }

      const created = await createRegisteredTowers({
        database,
        ItemsService,
        schema,
        userId: req.accountability.user,
        method: "Upload Document (.xlsx)",
        documentId: fileId,
        registrations,
      });

      shouldRemoveFile = false;
      return res.status(201).json({ data: { created: created.length } });
    } catch (error) {
      if (error instanceof WorkbookValidationError) {
        try {
          await createRejectedAttempt({
            database,
            ItemsService,
            schema,
            userId: req.accountability.user,
            method: "Upload Document (.xlsx)",
            submissionData: {
              filename: uploadedFile?.filename_download ?? null,
              filesize: uploadedFile?.filesize ?? null,
            },
            validationErrors: error.errors,
          });
        } catch (persistError) {
          logger.error(persistError, "Failed to persist rejected workbook registration");
          return res.status(500).json({
            error: "File ditolak, tetapi riwayat penolakan tidak dapat disimpan.",
          });
        }
      }
      if (shouldRemoveFile) {
        await removeUploadedFile(ItemsService, req, schema, fileId, logger);
      }
      if (error instanceof WorkbookValidationError) {
        return res.status(422).json({ errors: error.errors });
      }

      const duplicateError = duplicateTowerIdError(error);
      if (duplicateError) {
        const errors = [duplicateError];
        try {
          await createRejectedAttempt({
            database,
            ItemsService,
            schema,
            userId: req.accountability.user,
            method: "Upload Document (.xlsx)",
            submissionData: {
              filename: uploadedFile?.filename_download ?? null,
              filesize: uploadedFile?.filesize ?? null,
            },
            validationErrors: errors,
          });
        } catch (persistError) {
          logger.error(persistError, "Failed to persist rejected duplicate workbook registration");
          return res.status(500).json({
            error: "File ditolak, tetapi riwayat penolakan tidak dapat disimpan.",
          });
        }
        return res.status(422).json({ errors });
      }

      logger.error(error, "Bulk tower upload failed");
      return res.status(500).json({ error: "Pemrosesan gagal. Tidak ada data menara yang disimpan." });
    }
  });
});
