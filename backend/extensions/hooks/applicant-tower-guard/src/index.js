import administrativeRegions from "./indonesian-administrative-regions.json" with {
  type: "json",
};

const COLLECTION = "tower_infrastruktur";
const TENANT_COLLECTION = "tower_tenant";
const FILE_COLLECTION = "directus_files";
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TEXT_LENGTH = 50;
const TOWER_TEXT_FIELDS = new Set([
  "id_menara",
  "nama_pemilik",
  "penyelenggara",
  "alamat",
  "provinsi",
  "kab_kota",
  "kecamatan",
  "kelurahan",
  "jenis_menara",
  "kapasitas_maksimal",
  "kapasitas_disewakan",
  "kapasitas_digunakan_sendiri",
]);
const TENANT_TEXT_FIELDS = new Set(["penyelenggara", "kapasitas_disewakan"]);
const ALLOWED_FIELDS = new Set([
  "id_menara",
  "nama_pemilik",
  "tahun_pembangunan",
  "penyelenggara",
  "longitude",
  "latitude",
  "alamat",
  "provinsi",
  "kab_kota",
  "kecamatan",
  "kelurahan",
  "jenis_menara",
  "tinggi_menara",
  "kapasitas_maksimal",
  "kapasitas_disewakan",
  "kapasitas_digunakan_sendiri",
  "metode_pendaftaran",
  "document",
]);

function requireText(value, field, { numericAllowed = false } = {}) {
  if (
    typeof value !== "string" &&
    !(numericAllowed && typeof value === "number" && Number.isFinite(value))
  ) {
    throw new Error(`${field}: isi dengan teks yang valid.`);
  }

  const text = String(value).normalize("NFC").trim();
  if (!text) throw new Error(`${field}: kolom wajib diisi.`);
  if (Array.from(text).length > MAX_TEXT_LENGTH) {
    throw new Error(`${field}: maksimal ${MAX_TEXT_LENGTH} karakter.`);
  }
  return text.toUpperCase();
}

function optionalAdministrativeText(value, field) {
  if (value == null || (typeof value === "string" && !value.trim())) return null;
  if (typeof value !== "string") {
    throw new Error(`${field}: isi dengan teks yang valid.`);
  }
  const text = value.normalize("NFC").trim();
  if (Array.from(text).length > 100) {
    throw new Error(`${field}: maksimal 100 karakter.`);
  }
  return text.toUpperCase();
}

function requireAdministrativeText(value, field) {
  if (typeof value !== "string") {
    throw new Error(`${field}: pilih nilai yang tersedia.`);
  }
  const text = value.normalize("NFC").trim();
  if (!text) throw new Error(`${field}: kolom wajib dipilih.`);
  if (Array.from(text).length > 100) {
    throw new Error(`${field}: maksimal 100 karakter.`);
  }
  return text.toLocaleUpperCase("id-ID");
}

export function uppercaseTowerTextFields(payload, collection) {
  const fields =
    collection === COLLECTION
      ? TOWER_TEXT_FIELDS
      : collection === TENANT_COLLECTION
        ? TENANT_TEXT_FIELDS
        : null;
  if (!fields) return payload;

  const normalize = (item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return item;
    const result = { ...item };
    for (const field of fields) {
      if (typeof result[field] === "string") {
        result[field] = result[field].toUpperCase();
      }
    }
    if (
      collection === COLLECTION &&
      Array.isArray(result.tenants)
    ) {
      result.tenants = result.tenants.map((tenant) =>
        uppercaseTowerTextFields(tenant, TENANT_COLLECTION),
      );
    }
    return result;
  };

  return Array.isArray(payload) ? payload.map(normalize) : normalize(payload);
}

export function sanitizeTenantEntries(input) {
  const entries = Array.isArray(input?.tenants)
    ? input.tenants
    : [{
        penyelenggara: input?.penyelenggara,
        kapasitas_disewakan: input?.kapasitas_disewakan,
      }];

  if (entries.length === 0 || entries.length > 50) {
    throw new Error("Tambahkan minimal satu tenant dan maksimal 50 tenant.");
  }

  const names = new Set();
  const normalizedEntries = entries.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error(`Data tenant ke-${index + 1} tidak valid.`);
    }

    const penyelenggara = requireText(
      entry.penyelenggara,
      `Tenant ke-${index + 1}`,
    );
    const normalizedName = penyelenggara.toLocaleLowerCase("id-ID");
    if (names.has(normalizedName)) {
      throw new Error(`Nama tenant "${penyelenggara}" duplikat.`);
    }
    names.add(normalizedName);

    return {
      penyelenggara,
      kapasitas_disewakan: requireText(
        entry.kapasitas_disewakan,
        `Kapasitas disewakan tenant ke-${index + 1}`,
        { numericAllowed: true },
      ),
    };
  });
  const sharedCapacity = normalizedEntries[0].kapasitas_disewakan;
  if (
    normalizedEntries.some(
      (entry) => entry.kapasitas_disewakan !== sharedCapacity,
    )
  ) {
    throw new Error(
      "Kapasitas disewakan adalah kapasitas total menara dan harus sama untuk semua tenant.",
    );
  }
  return normalizedEntries;
}

export function synchronizeTowerArchiveFields(payload) {
  const synchronize = (item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return item;

    const hasArchiveFlag = Object.hasOwn(item, "is_archived");
    const hasDeletedAt = Object.hasOwn(item, "deleted_at");
    if (hasArchiveFlag && typeof item.is_archived === "boolean") {
      if (item.is_archived) {
        item.deleted_at ??= new Date().toISOString();
      } else {
        item.deleted_at = null;
      }
    } else if (hasDeletedAt) {
      item.is_archived = item.deleted_at !== null;
    }
    return item;
  };

  return Array.isArray(payload) ? payload.map(synchronize) : synchronize(payload);
}

export async function guardTowerArchiveOnlyUpdate(
  payload,
  accountability,
  database,
) {
  if (accountability?.user && !accountability.admin) {
    const role = await database("directus_roles")
      .select("name")
      .where({ id: accountability.role })
      .first();
    if (role?.name === "Web Manager") {
      const items = Array.isArray(payload) ? payload : [payload];
      const nonArchiveField = items.some(
        (item) =>
          !item ||
          typeof item !== "object" ||
          Object.keys(item).some((field) => field !== "is_archived"),
      );
      if (nonArchiveField) {
        throw new Error("Web Manager hanya dapat mengarsipkan data menara.");
      }
    }
  }
  return synchronizeTowerArchiveFields(payload);
}

export function guardTowerDelete(collection) {
  if (collection === COLLECTION) {
    throw new Error("Data menara hanya boleh diarsipkan, tidak dapat dihapus permanen.");
  }
}

function decimalPlaces(value) {
  const numericText = String(value).trim().toLowerCase();
  const [mantissa, exponentText] = numericText.split("e");
  const fractionalLength = mantissa.split(".")[1]?.length ?? 0;
  const exponent = exponentText ? Number(exponentText) : 0;
  return Math.max(0, fractionalLength - exponent);
}

function requireNumber(
  value,
  field,
  { integer = false, min, max, maxDecimalPlaces } = {},
) {
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value.trim())
        : Number.NaN;

  if (!Number.isFinite(number)) {
    throw new Error(`${field}: isi dengan angka yang valid.`);
  }
  if (integer && !Number.isInteger(number)) {
    throw new Error(`${field}: isi dengan angka bulat.`);
  }
  if (min !== undefined && number < min) {
    throw new Error(`${field}: nilai minimal ${min}.`);
  }
  if (max !== undefined && number > max) {
    throw new Error(`${field}: nilai maksimal ${max}.`);
  }
  if (
    maxDecimalPlaces !== undefined &&
    decimalPlaces(typeof value === "string" ? value : number) > maxDecimalPlaces
  ) {
    throw new Error(`${field}: maksimal ${maxDecimalPlaces} angka di belakang koma.`);
  }
  return number;
}

export function validateApplicantFile(input) {
  const filename = input?.filename_download;
  if (
    input?.type !== XLSX_MIME ||
    typeof filename !== "string" ||
    !filename.toLowerCase().endsWith(".xlsx") ||
    !Number.isFinite(Number(input.filesize)) ||
    Number(input.filesize) <= 0 ||
    Number(input.filesize) > MAX_FILE_SIZE
  ) {
    throw new Error("Applicant hanya dapat mengunggah file Excel .xlsx maksimal 10 MB.");
  }
  return input;
}

export async function sanitizeTowerSubmission(input, context) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Data menara tidak valid.");
  }

  const tenants = sanitizeTenantEntries(input);
  const output = Object.fromEntries(
    Object.entries(input).filter(([field]) => ALLOWED_FIELDS.has(field)),
  );
  output.penyelenggara = tenants[0].penyelenggara;
  output.kapasitas_disewakan = tenants[0].kapasitas_disewakan;
  output.id_menara = requireText(output.id_menara, "id_menara", {
    numericAllowed: true,
  });
  output.nama_pemilik = requireText(output.nama_pemilik, "nama_pemilik");
  output.tahun_pembangunan = requireNumber(
    output.tahun_pembangunan,
    "tahun_pembangunan",
    { integer: true, min: 1900, max: new Date().getFullYear() },
  );
  output.alamat = requireText(output.alamat, "alamat");
  if (!output.document) {
    output.provinsi = requireText(output.provinsi, "provinsi");
    output.kab_kota = requireText(output.kab_kota, "kab_kota");
    output.kecamatan = requireAdministrativeText(output.kecamatan, "kecamatan");
    output.kelurahan = requireAdministrativeText(output.kelurahan, "kelurahan");
    const province = administrativeRegions.regions.find(
      (region) => region.name.toLocaleUpperCase("id-ID") === output.provinsi,
    );
    if (!province) {
      throw new Error("provinsi: pilih provinsi yang tersedia.");
    }
    const regency = province.kabKota.find(
      (kabKota) => kabKota.name.toLocaleUpperCase("id-ID") === output.kab_kota,
    );
    if (!regency) {
      throw new Error("kab_kota: pilih kabupaten/kota sesuai provinsi.");
    }
    const district = regency.kecamatan.find(
      (item) => item.name.toLocaleUpperCase("id-ID") === output.kecamatan,
    );
    if (!district) {
      throw new Error("kecamatan: pilih kecamatan sesuai kabupaten/kota.");
    }
    if (
      !district.kelurahan.some(
        (item) => item.name.toLocaleUpperCase("id-ID") === output.kelurahan,
      )
    ) {
      throw new Error("kelurahan: pilih kelurahan/desa sesuai kecamatan.");
    }
  } else {
    output.kecamatan = optionalAdministrativeText(output.kecamatan, "kecamatan");
    output.kelurahan = optionalAdministrativeText(output.kelurahan, "kelurahan");
  }
  output.jenis_menara = requireText(output.jenis_menara, "jenis_menara");
  output.tinggi_menara = requireNumber(output.tinggi_menara, "tinggi_menara", {
    integer: true,
    min: 1,
    max: 999,
  });
  output.kapasitas_maksimal = requireText(
    output.kapasitas_maksimal,
    "kapasitas_maksimal",
    { numericAllowed: true },
  );
  output.kapasitas_digunakan_sendiri = requireText(
    output.kapasitas_digunakan_sendiri,
    "kapasitas_digunakan_sendiri",
    { numericAllowed: true },
  );

  output.longitude = requireNumber(output.longitude, "longitude", {
    min: 95,
    max: 141,
    maxDecimalPlaces: 6,
  });
  output.latitude = requireNumber(output.latitude, "latitude", {
    min: -11,
    max: 6,
    maxDecimalPlaces: 6,
  });

  if (output.document) {
    const uploadedFile = await context.database("directus_files")
      .select("uploaded_by", "type", "filesize", "filename_download")
      .where({ id: output.document })
      .first();
    if (
      !uploadedFile ||
      uploadedFile.uploaded_by !== context.accountability.user ||
      uploadedFile.type !== XLSX_MIME ||
      typeof uploadedFile.filename_download !== "string" ||
      !uploadedFile.filename_download.toLowerCase().endsWith(".xlsx") ||
      Number(uploadedFile.filesize) > MAX_FILE_SIZE
    ) {
      throw new Error("Dokumen Excel harus berupa file .xlsx milik akun sendiri, maksimal 10 MB.");
    }
    output.metode_pendaftaran = "Upload Document (.xlsx)";
  } else {
    output.metode_pendaftaran = "Input Manual";
  }

  output.verification_status = "Submitted";
  return output;
}

export async function sanitizeTowerUpdate(input, context) {
  const output = await sanitizeTowerSubmission(input, context);
  delete output.id_menara;
  return output;
}

export default ({ filter }, { env }) => {
  filter("items.delete", (payload, meta) => {
    guardTowerDelete(meta.collection);
    return payload;
  });

  filter("items.update", async (payload, meta, context) => {
    if (meta.collection !== COLLECTION && meta.collection !== TENANT_COLLECTION) {
      return payload;
    }
    const normalized = uppercaseTowerTextFields(payload, meta.collection);
    if (meta.collection === TENANT_COLLECTION) return normalized;
    return guardTowerArchiveOnlyUpdate(
      normalized,
      context.accountability,
      context.database,
    );
  });

  filter("items.create", async (payload, meta, context) => {
    if (
      meta.collection === FILE_COLLECTION &&
      context.accountability?.role === env.USER_REGISTER_ROLE
    ) {
      return Array.isArray(payload)
        ? payload.map(validateApplicantFile)
        : validateApplicantFile(payload);
    }

    if (meta.collection === TENANT_COLLECTION) {
      return uppercaseTowerTextFields(payload, meta.collection);
    }
    if (meta.collection !== COLLECTION) return payload;
    const normalized = uppercaseTowerTextFields(payload, meta.collection);
    if (!context.accountability?.user) return normalized;

    if (Array.isArray(normalized)) {
      return Promise.all(normalized.map((item) => sanitizeTowerSubmission(item, context)));
    }
    return sanitizeTowerSubmission(normalized, context);
  });
};

export const sanitizeApplicantTower = sanitizeTowerSubmission;
