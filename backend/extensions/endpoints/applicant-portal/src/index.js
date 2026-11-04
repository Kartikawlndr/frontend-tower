import { createHash, timingSafeEqual } from "node:crypto";
import QRCode from "qrcode";
import { defineEndpoint } from "@directus/extensions-sdk";
import {
  sanitizeTenantEntries,
  sanitizeTowerUpdate,
  sanitizeTowerSubmission,
} from "../../../hooks/applicant-tower-guard/src/index.js";
import {
  createRegisteredTowers,
  createRejectedAttempt,
  setRecordCreator,
} from "../../../shared/normalized-registration.js";
import { sendRegistrationReceipts } from "../../../shared/registration-receipt.js";
import { AdministrativeRegionLookupError } from "../../../hooks/applicant-tower-guard/src/administrative-regions.js";

const COLLECTION = "tower_infrastruktur";
const TENANT_COLLECTION = "tower_tenant";
const ATTEMPT_COLLECTION = "tower_registration_attempts";
const MAX_BULK_DELETE = 200;
const LOGIN_STATUS_CHECK_WINDOW = 15 * 60 * 1000;
const LOGIN_STATUS_CHECK_LIMIT = 5;
const MAX_LOGIN_STATUS_CHECKS = 10000;
const loginStatusChecks = new Map();
const PASSWORD_RESET_REQUEST_WINDOW = 15 * 60 * 1000;
const PASSWORD_RESET_REQUEST_LIMIT = 5;
const MAX_PASSWORD_RESET_REQUESTS = 10000;
const passwordResetRequests = new Map();
const TOWER_FIELDS = [
  "id",
  "id_menara",
  "nama_pemilik",
  "tahun_pembangunan",
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
  "longitude",
  "latitude",
  "metode_pendaftaran",
  "verification_status",
  "date_created",
  "document",
  "user_created.first_name",
  "user_created.last_name",
  "user_created.email",
];
const PORTAL_ROLES = new Set(["Applicant", "Web Manager", "Administrator"]);
const MANAGER_ROLES = new Set(["Web Manager", "Administrator"]);
const USER_ROLE_NAMES = ["Applicant", "Web Manager", "Administrator"];
const VALIDATION_FIELDS = new Set([
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
  "penyelenggara_penyewa",
  "document",
  "data",
]);
const DRAFT_FIELDS = new Set([
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
]);

export function sanitizeDraftData(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Data draft tidak valid.");
  }
  const data = {};
  for (const [field, value] of Object.entries(input)) {
    if (field === "tenants") {
      if (!Array.isArray(value) || value.length > 50) {
        throw new Error("Data tenant draft tidak valid.");
      }
      data.tenants = value.map((tenant) => {
        if (!tenant || typeof tenant !== "object" || Array.isArray(tenant)) {
          throw new Error("Data tenant draft tidak valid.");
        }
        const entry = {};
        for (const key of ["penyelenggara"]) {
          const text = tenant[key] ?? "";
          if (typeof text !== "string" || text.length > 200) {
            throw new Error("Kolom tenant draft tidak valid.");
          }
          entry[key] = text;
        }
        return entry;
      });
      continue;
    }
    if (!DRAFT_FIELDS.has(field)) {
      throw new Error(`Field draft tidak didukung: ${field}.`);
    }
    if (typeof value !== "string" || value.length > 200) {
      throw new Error(`Nilai draft ${field} tidak valid.`);
    }
    data[field] = value;
  }
  return data;
}

function parseDraftId(value) {
  if (
    typeof value !== "string" ||
    !/^[1-9]\d{0,9}$/.test(value)
  ) {
    return null;
  }
  return Number(value);
}

export function isApplicant(accountability, applicantRole) {
  return Boolean(
    accountability?.user &&
      accountability.role &&
      accountability.role === applicantRole,
  );
}

export function csvCell(value) {
  let text = value == null ? "" : String(value);
  if (
    typeof value !== "number" &&
    /^[\s]*[=+\-@]/.test(text)
  ) {
    text = `'${text}`;
  }
  return `"${text.replaceAll('"', '""')}"`;
}

export function csvForTowers(towers) {
  const columns = [
    ["ID menara", "id_menara"],
    ["Nama pemilik", "nama_pemilik"],
    ["Tahun pembangunan", "tahun_pembangunan"],
    ["Penyelenggara/penyewa", "penyelenggara"],
    ["Longitude", "longitude"],
    ["Latitude", "latitude"],
    ["Alamat", "alamat"],
    ["Provinsi", "provinsi"],
    ["Kabupaten/Kota", "kab_kota"],
    ["Kecamatan", "kecamatan"],
    ["Kelurahan/Desa", "kelurahan"],
    ["Jenis menara", "jenis_menara"],
    ["Tinggi menara", "tinggi_menara"],
    ["Kapasitas maksimal", "kapasitas_maksimal"],
    ["Kapasitas disewakan", "kapasitas_disewakan"],
    ["Kapasitas digunakan sendiri", "kapasitas_digunakan_sendiri"],
    ["Metode pendaftaran", "metode_pendaftaran"],
    ["Status", "verification_status"],
    ["Tanggal pendaftaran", "date_created"],
  ];
  const rows = [
    columns.map(([label]) => csvCell(label)).join(","),
    ...towers.map((tower) =>
      columns
        .map(([, key]) =>
          csvCell(
            key === "penyelenggara"
              ? (tower.tenants ?? [])
                  .map((tenant) => tenant.penyelenggara)
                  .filter(Boolean)
                  .join(", ")
              : tower[key],
          ),
        )
        .join(","),
    ),
  ];
  return `\uFEFF${rows.join("\r\n")}`;
}

export function validateBulkDeleteIds(ids) {
  return (
    Array.isArray(ids) &&
    ids.length > 0 &&
    ids.length <= MAX_BULK_DELETE &&
    ids.every((id) => typeof id === "string" && id.length > 0 && id.length <= 64) &&
    new Set(ids).size === ids.length
  );
}

function getInviteEmail(token) {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!claims || typeof claims !== "object") return null;
    return claims.scope === "invite" && typeof claims.email === "string"
      ? claims.email
      : null;
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
}

function forbidden(res) {
  return res.status(403).json({ error: "Akun Anda tidak memiliki akses ke fitur ini." });
}

export async function getPortalRole(database, accountability, applicantRole) {
  if (!accountability?.user) return null;

  const user = await database("directus_users")
    .select("role", "status")
    .where({ id: accountability.user })
    .first();
  if (!user?.role || user.status !== "active") return null;
  if (user.role === applicantRole) return "Applicant";

  const role = await database("directus_roles")
    .select("name")
    .where({ id: user.role })
    .first();
  return PORTAL_ROLES.has(role?.name) ? role.name : null;
}

export function consumeLoginStatusCheck(email, now = Date.now()) {
  const key = createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex");
  for (const [candidate, entry] of loginStatusChecks) {
    if (entry.resetAt <= now) loginStatusChecks.delete(candidate);
  }
  const current = loginStatusChecks.get(key);
  if (current && current.count >= LOGIN_STATUS_CHECK_LIMIT) return false;
  if (!current) {
    if (loginStatusChecks.size >= MAX_LOGIN_STATUS_CHECKS) return false;
    loginStatusChecks.set(key, {
      count: 1,
      resetAt: now + LOGIN_STATUS_CHECK_WINDOW,
    });
  } else {
    current.count += 1;
  }
  return true;
}

export function consumePasswordResetRequest(email, now = Date.now()) {
  const key = createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex");
  for (const [candidate, entry] of passwordResetRequests) {
    if (entry.resetAt <= now) passwordResetRequests.delete(candidate);
  }
  const current = passwordResetRequests.get(key);
  if (current && current.count >= PASSWORD_RESET_REQUEST_LIMIT) return false;
  if (!current) {
    if (passwordResetRequests.size >= MAX_PASSWORD_RESET_REQUESTS) return false;
    passwordResetRequests.set(key, {
      count: 1,
      resetAt: now + PASSWORD_RESET_REQUEST_WINDOW,
    });
  } else {
    current.count += 1;
  }
  return true;
}

export async function hasSuspendedValidCredentials({
  database,
  AuthenticationService,
  schema,
  email,
  password,
}) {
  const account = await database("directus_users")
    .select("id", "status", "provider")
    .whereRaw("LOWER(??) = ?", ["email", email.toLowerCase()])
    .first();
  const verificationAccount =
    account?.provider === "default"
      ? account
      : await database("directus_users")
          .select("id")
          .where({ provider: "default" })
          .whereNotNull("password")
          .first();
  if (!verificationAccount) return false;

  const authentication = new AuthenticationService({
    schema,
    accountability: null,
    knex: database,
  });
  try {
    await authentication.verifyPassword(verificationAccount.id, password);
  } catch (error) {
    if (error?.code === "INVALID_CREDENTIALS") return false;
    throw error;
  }
  return account?.status === "suspended" && account.provider === "default";
}

function towerFilter(accountability, role, search, status) {
  const conditions = [{ deleted_at: { _null: true } }];
  if (role === "Applicant") {
    conditions.push({ user_created: { _eq: accountability.user } });
  }
  if (status) conditions.push({ verification_status: { _eq: status } });
  if (search) {
    conditions.push({
      _or: [
        { id_menara: { _icontains: search } },
        { nama_pemilik: { _icontains: search } },
        { alamat: { _icontains: search } },
      ],
    });
  }
  return { _and: conditions };
}

export function parsePage(value, fallback = 1) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function parsePageSize(value, fallback = 25) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0
    ? Math.min(parsed, 100)
    : fallback;
}

export async function countDrafts(database, accountability, role) {
  const query = database(ATTEMPT_COLLECTION).where({
    status: "Draft",
    attempt_type: "New Registration",
  });
  if (role === "Applicant") {
    query.where("user_created", accountability.user);
  }
  const [{ count }] = await query.count({ count: "id" });
  return Number(count);
}

async function readTowers(
  ItemsService,
  database,
  accountability,
  schema,
  role,
  { page = 1, limit = 25, search = "", status = "" } = {},
) {
  const filter = towerFilter(accountability, role, search, status);
  const countQuery = database(COLLECTION).whereNull("deleted_at");
  if (role === "Applicant") {
    countQuery.where("user_created", accountability.user);
  }
  if (status) countQuery.where("verification_status", status);
  if (search) {
    countQuery.where((query) => {
      query
        .where("id_menara", "ilike", `%${search}%`)
        .orWhere("nama_pemilik", "ilike", `%${search}%`)
        .orWhere("alamat", "ilike", `%${search}%`);
    });
  }
  const [{ count }] = await countQuery.count({ count: "id" });
  const draftCount = await countDrafts(database, accountability, role);
  const service = new ItemsService(COLLECTION, {
    schema,
    accountability: null,
  });
  const fields =
    role === "Applicant"
      ? TOWER_FIELDS.filter((field) => !field.startsWith("user_created."))
      : TOWER_FIELDS;
  const data = await service.readByQuery({
    filter,
    fields,
    sort: ["-date_created"],
    limit,
    offset: (page - 1) * limit,
  });
  const rejectedQuery = database(`${ATTEMPT_COLLECTION} as attempt`)
    .leftJoin("directus_users as creator", "attempt.user_created", "creator.id")
    .select(
      "attempt.id",
      "attempt.status",
      "attempt.attempt_type",
      "attempt.metode_pendaftaran",
      "attempt.date_created",
      "attempt.validation_errors",
      "attempt.submission_data",
      "creator.first_name as user_first_name",
      "creator.last_name as user_last_name",
    )
    .where("attempt.status", "Rejected")
    .whereNull("attempt.tower_id")
    .orderBy("attempt.date_created", "desc");
  if (role === "Applicant") {
    rejectedQuery.where("attempt.user_created", accountability.user).limit(100);
  }
  const rejectedAttempts = await rejectedQuery;
  return {
    data: await attachRegistrationData(database, data),
    rejected_attempts: rejectedAttempts,
    draft_count: draftCount,
    meta: { page, limit, total: Number(count) },
  };
}

async function attachRegistrationData(database, towers) {
  if (towers.length === 0) return towers;
  const ids = towers.map(({ id }) => id);
  const tenants = await database(TENANT_COLLECTION)
    .select("id", "tower_id", "penyelenggara", "sort")
    .whereIn("tower_id", ids)
    .orderBy("sort")
    .orderBy("id");
  const registeredAttempts = await database(ATTEMPT_COLLECTION)
    .select(
      "id",
      "tower_id",
      "status",
      "registration_code",
      "attempt_type",
      "metode_pendaftaran",
      "date_created",
      "validation_errors",
    )
    .whereIn("tower_id", ids)
    .orderBy("date_created", "desc");
  const tenantMap = new Map();
  const attemptMap = new Map();
  const statusMap = new Map();
  for (const attempt of registeredAttempts) {
    const entries = attemptMap.get(attempt.tower_id) ?? [];
    entries.push({
      id: attempt.id,
      status: attempt.status,
      registration_code: attempt.registration_code,
      attempt_type: attempt.attempt_type,
      metode_pendaftaran: attempt.metode_pendaftaran,
      date_created: attempt.date_created,
      validation_errors: attempt.validation_errors,
    });
    attemptMap.set(attempt.tower_id, entries);
    if (attempt.status === "Registered" && !statusMap.has(attempt.tower_id)) {
      statusMap.set(attempt.tower_id, attempt.status);
    }
  }
  for (const tenant of tenants) {
    const entries = tenantMap.get(tenant.tower_id) ?? [];
    entries.push({
      penyelenggara: tenant.penyelenggara,
    });
    tenantMap.set(tenant.tower_id, entries);
  }
  return towers.map((tower) => ({
    ...tower,
    registration_attempts: attemptMap.get(tower.id) ?? [],
    tenants: tenantMap.get(tower.id) ?? [],
    verification_status:
      statusMap.get(tower.id) ??
      (["Submitted", "Approved", "REGISTERED"].includes(tower.verification_status)
        ? "Registered"
        : tower.verification_status),
  }));
}

async function readAccessibleTower(
  ItemsService,
  database,
  accountability,
  schema,
  role,
  id,
) {
  const service = new ItemsService(COLLECTION, {
    schema,
    accountability: null,
  });
  const conditions = [
    { id: { _eq: id } },
    { deleted_at: { _null: true } },
  ];
  if (role === "Applicant") {
    conditions.push({ user_created: { _eq: accountability.user } });
  }
  const towers = await service.readByQuery({
    filter: { _and: conditions },
    fields:
      role === "Applicant"
        ? TOWER_FIELDS.filter((field) => !field.startsWith("user_created."))
        : TOWER_FIELDS,
    limit: 1,
  });
  if (!towers[0]) return null;
  return (await attachRegistrationData(database, towers))[0];
}

function roleIdByName(roles, name) {
  return roles.find((role) => role.name === name)?.id ?? null;
}

async function getPortalRoleIds(database) {
  return database("directus_roles")
    .select("id", "name")
    .whereIn("name", USER_ROLE_NAMES);
}

function isAdministrator(role) {
  return role === "Administrator";
}

export default defineEndpoint(
  (router, { env, logger, services, database, getSchema }) => {
    const {
      AuthenticationService,
      ItemsService,
      MailService,
      UsersService,
    } = services;

    router.post("/request-password-reset", async (req, res) => {
      const email =
        typeof req.body?.email === "string" ? req.body.email.trim() : "";
      if (
        email.length === 0 ||
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ) {
        return res.status(400).json({ error: "Alamat email tidak valid." });
      }
      if (!consumePasswordResetRequest(email)) {
        return res.status(429).json({
          error: "Terlalu banyak permintaan reset. Coba lagi dalam 15 menit.",
        });
      }

      try {
        const account = await database("directus_users as users")
          .leftJoin("directus_roles as roles", "users.role", "roles.id")
          .select("users.email", "users.status", "roles.name as role_name")
          .whereRaw("LOWER(??) = ?", ["users.email", email.toLowerCase()])
          .first();
        if (
          account?.email &&
          account.status === "active" &&
          PORTAL_ROLES.has(account.role_name)
        ) {
          const portalUrl = env.PORTAL_URL ?? "http://localhost:3000";
          const resetUrl = new URL("/set-password?mode=reset", portalUrl).toString();
          const users = new UsersService({
            schema: await getSchema(),
            accountability: null,
          });
          await users.requestPasswordReset(
            account.email,
            resetUrl,
            "Permintaan reset password Portal Infrastruktur Pasif",
          );
        }
        return res.status(202).json({
          data: { requested: true },
          message:
            "Jika email terdaftar dan akun aktif, tautan reset akan dikirim ke email tersebut.",
        });
      } catch (error) {
        logger.error(error, "Failed to request public portal password reset");
        return res.status(502).json({
          error: "Permintaan reset tidak dapat diproses saat ini. Coba lagi beberapa saat.",
        });
      }
    });

    router.post("/login-status", async (req, res) => {
      const expectedSecret = env.PORTAL_LOGIN_STATUS_SECRET;
      const providedSecret = req.get("x-portal-login-status-secret");
      if (typeof expectedSecret !== "string" || !expectedSecret) {
        logger.error("PORTAL_LOGIN_STATUS_SECRET is not configured");
        return res.status(503).json({ error: "Status login tidak dapat diperiksa." });
      }
      if (
        typeof providedSecret !== "string" ||
        Buffer.byteLength(providedSecret) !== Buffer.byteLength(expectedSecret) ||
        !timingSafeEqual(Buffer.from(providedSecret), Buffer.from(expectedSecret))
      ) {
        return res.status(403).json({ error: "Permintaan tidak valid." });
      }

      const email =
        typeof req.body?.email === "string" ? req.body.email.trim() : "";
      const password = req.body?.password;
      if (
        email.length === 0 ||
        email.length > 254 ||
        typeof password !== "string" ||
        password.length === 0 ||
        password.length > 1024
      ) {
        return res.status(400).json({ error: "Data login tidak valid." });
      }
      if (!consumeLoginStatusCheck(email)) {
        return res.status(429).json({
          error: "Terlalu banyak percobaan masuk. Coba lagi beberapa saat.",
        });
      }

      try {
        const suspended = await hasSuspendedValidCredentials({
          database,
          AuthenticationService,
          schema: await getSchema(),
          email,
          password,
        });
        return res.json({ suspended });
      } catch (error) {
        logger.error(error, "Failed to verify suspended account credentials");
        return res.status(500).json({
          error: "Status akun tidak dapat diverifikasi.",
        });
      }
    });

    async function sendValidationFailureEmail(
      userId,
      errors,
      attemptType = "New Registration",
    ) {
      const user = await database("directus_users")
        .select("email", "first_name")
        .where({ id: userId })
        .first();
      if (!user?.email) throw new Error("Applicant email address is unavailable.");

      const details = errors
        .map((error) => {
          const field =
            typeof error.field === "string" ? error.field : error.column;
          const label = typeof field === "string" ? `${field}: ` : "";
          return `- ${label}${String(error.message).slice(0, 300)}`;
        })
        .join("\n");
      const mail = new MailService({
        schema: await getSchema(),
        accountability: null,
        knex: database,
      });
      await mail.send({
        to: user.email,
        subject:
          attemptType === "Update"
            ? "Perubahan Data Menara Perlu Diperbaiki"
            : "Data Pendaftaran Menara Perlu Diperbaiki",
        text: [
          `Yth. ${user.first_name || "Applicant"},`,
          "",
          attemptType === "Update"
            ? "Sistem menolak perubahan data menara karena data perlu diperbaiki:"
            : "Sistem belum dapat menerima pendaftaran menara karena data perlu diperbaiki:",
          details,
          "",
          attemptType === "Update"
            ? "Data menara sebelumnya tidak berubah. Perbaiki data lalu kirim kembali."
            : "Perbaiki data di atas lalu kirim ulang pengajuan.",
        ].join("\n"),
      });
    }

    async function rejectRegistration(
      userId,
      method,
      submissionData,
      errors,
      {
        towerId = null,
        attemptType = "New Registration",
        draftId = null,
      } = {},
    ) {
      const attemptId = await createRejectedAttempt({
        database,
        ItemsService,
        schema: await getSchema(),
        userId,
        method,
        submissionData,
        validationErrors: errors,
        towerId,
        attemptType,
        draftId,
      });
      let emailSent = false;
      try {
        await sendValidationFailureEmail(userId, errors, attemptType);
        emailSent = true;
      } catch (error) {
        logger.error(error, "Failed to send rejected registration email");
      }
      return { attemptId, emailSent };
    }

    router.post("/accept-invite", async (req, res) => {
      const { token, password, first_name, last_name } = req.body ?? {};
      const firstName = typeof first_name === "string" ? first_name.trim() : "";
      const lastName = typeof last_name === "string" ? last_name.trim() : "";
      if (
        typeof token !== "string" ||
        token.length > 4096 ||
        typeof password !== "string" ||
        password.length < 12 ||
        password.length > 128 ||
        !firstName ||
        firstName.length > 50 ||
        !lastName ||
        lastName.length > 50
      ) {
        return res.status(400).json({ error: "Tautan atau password tidak valid." });
      }
      const inviteEmail = getInviteEmail(token);
      if (!inviteEmail) {
        return res.status(400).json({ error: "Tautan undangan tidak valid atau sudah kedaluwarsa." });
      }
      try {
        const schema = await getSchema();
        await database.transaction(async (transaction) => {
          const users = new UsersService({
            schema,
            accountability: null,
            knex: transaction,
          });
          await users.acceptInvite(token, password);
          // acceptInvite verifies this token before its email claim is used for the update.
          const updated = await transaction("directus_users")
            .whereRaw("LOWER(??) = ?", ["email", inviteEmail.toLowerCase()])
            .update({ first_name: firstName, last_name: lastName });
          if (updated !== 1) throw new Error("Accepted invitation user was not updated.");
        });
        return res.status(204).end();
      } catch (error) {
        logger.warn(error, "Applicant invitation acceptance failed");
        return res.status(400).json({
          error: "Tautan undangan tidak valid atau sudah kedaluwarsa.",
        });
      }
    });

    router.post("/complete-password-reset", async (req, res) => {
      const { token, password } = req.body ?? {};
      if (
        typeof token !== "string" ||
        token.length > 4096 ||
        typeof password !== "string" ||
        password.length < 12 ||
        password.length > 128
      ) {
        return res.status(400).json({ error: "Tautan atau password tidak valid." });
      }
      try {
        const users = new UsersService({
          schema: await getSchema(),
          accountability: null,
        });
        await users.resetPassword(token, password);
        return res.status(204).end();
      } catch (error) {
        logger.warn(error, "Portal password reset failed");
        return res.status(400).json({
          error: "Tautan reset password tidak valid atau sudah kedaluwarsa.",
        });
      }
    });

    router.use(async (req, res, next) => {
      if (!req.accountability?.user) {
        return res.status(401).json({ error: "Login diperlukan." });
      }
      try {
        const role = await getPortalRole(
          database,
          req.accountability,
          env.USER_REGISTER_ROLE,
        );
        if (!role) return forbidden(res);
        req.portalRole = role;
        return next();
      } catch (error) {
        logger.error(error, "Failed to resolve portal account role");
        return res.status(500).json({ error: "Peran akun tidak dapat diperiksa." });
      }
    });

    router.get("/profile", async (req, res) => {
      try {
        const user = await database("directus_users")
          .select("id", "email", "first_name", "last_name")
          .where({ id: req.accountability.user })
          .first();
        if (!user) return res.status(404).json({ error: "Akun tidak ditemukan." });
        return res.json({
          data: {
            ...user,
            role: req.portalRole,
            display_role:
              req.portalRole === "Administrator" ? "Super Admin" : req.portalRole,
          },
        });
      } catch (error) {
        logger.error(error, "Failed to read portal profile");
        return res.status(500).json({ error: "Profil akun tidak dapat dimuat." });
      }
    });

    router.get("/towers", async (req, res) => {
      try {
        const schema = await getSchema();
        const page = parsePage(req.query.page);
        const limit = parsePageSize(req.query.limit);
        const search =
          typeof req.query.search === "string"
            ? req.query.search.trim().slice(0, 100)
            : "";
        const status =
          typeof req.query.status === "string"
            ? req.query.status.trim().slice(0, 50)
            : "";
        const towers = await readTowers(
          ItemsService,
          database,
          req.accountability,
          schema,
          req.portalRole,
          { page, limit, search, status },
        );
        return res.json(towers);
      } catch (error) {
        logger.error(error, "Failed to read portal tower history");
        return res.status(500).json({ error: "Riwayat pendaftaran tidak dapat dimuat." });
      }
    });

    router.get("/towers/drafts", async (req, res) => {
      if (req.portalRole !== "Applicant") return forbidden(res);
      const requestedId =
        req.query.id === undefined ? null : parseDraftId(String(req.query.id));
      if (req.query.id !== undefined && requestedId === null) {
        return res.status(400).json({ error: "ID draft tidak valid." });
      }
      try {
        const draftQuery = database(ATTEMPT_COLLECTION)
          .select("id", "submission_data", "date_updated")
          .where({
            user_created: req.accountability.user,
            status: "Draft",
            attempt_type: "New Registration",
          });
        if (requestedId !== null) {
          draftQuery.where({ id: requestedId });
        } else {
          draftQuery
            .orderBy("date_updated", "desc")
            .orderBy("date_created", "desc");
        }
        const draft = await draftQuery.first();
        if (requestedId !== null && !draft) {
          return res.status(404).json({ error: "Draft tidak ditemukan atau sudah dikirim." });
        }
        return res.json({
          data: draft
            ? {
                id: String(draft.id),
                submission_data: draft.submission_data,
                date_updated: draft.date_updated,
              }
            : null,
        });
      } catch (error) {
        logger.error(error, "Failed to read Applicant registration draft");
        return res.status(500).json({ error: "Draft pendaftaran tidak dapat dimuat." });
      }
    });

    router.post("/towers/drafts", async (req, res) => {
      if (req.portalRole !== "Applicant") return forbidden(res);
      const input = req.body;
      if (
        !input ||
        typeof input !== "object" ||
        Array.isArray(input) ||
        Object.keys(input).some((field) => !["draft_id", "submission_data"].includes(field))
      ) {
        return res.status(400).json({ error: "Data draft tidak valid." });
      }

      const draftId =
        input.draft_id == null ? null : parseDraftId(input.draft_id);
      if (input.draft_id != null && draftId === null) {
        return res.status(400).json({ error: "ID draft tidak valid." });
      }

      let submissionData;
      try {
        submissionData = sanitizeDraftData(input.submission_data);
      } catch (error) {
        return res.status(400).json({
          error: error.message ?? "Data draft tidak valid.",
        });
      }

      try {
        const schema = await getSchema();
        const savedId = await database.transaction(async (transaction) => {
          const attempts = new ItemsService(ATTEMPT_COLLECTION, {
            schema,
            accountability: null,
            knex: transaction,
          });
          const attemptData = {
            status: "Draft",
            attempt_type: "New Registration",
            metode_pendaftaran: "Input Manual",
            submission_data: submissionData,
            validation_errors: null,
          };
          let id;
          let action = "create";
          if (draftId !== null) {
            const current = await transaction(ATTEMPT_COLLECTION)
              .select("id")
              .where({
                id: draftId,
                user_created: req.accountability.user,
                status: "Draft",
                attempt_type: "New Registration",
              })
              .forUpdate()
              .first();
            if (!current) return null;
            await attempts.updateOne(current.id, attemptData);
            id = current.id;
            action = "update";
          } else {
            id = await attempts.createOne({
              user_created: req.accountability.user,
              ...attemptData,
            });
            await setRecordCreator(
              transaction,
              ATTEMPT_COLLECTION,
              id,
              req.accountability.user,
            );
          }
          await transaction("directus_activity").insert({
            action,
            user: req.accountability.user,
            collection: ATTEMPT_COLLECTION,
            item: String(id),
            timestamp: new Date().toISOString(),
          });
          return id;
        });
        if (savedId === null) {
          return res.status(404).json({ error: "Draft tidak ditemukan atau sudah dikirim." });
        }
        return res.json({ data: { id: String(savedId), status: "Draft" } });
      } catch (error) {
        logger.error(error, "Failed to save Applicant registration draft");
        return res.status(500).json({ error: "Draft pendaftaran tidak dapat disimpan." });
      }
    });

    router.post("/towers", async (req, res) => {
      const input = req.body;
      if (!input || typeof input !== "object" || Array.isArray(input)) {
        return res.status(400).json({ error: "Data menara tidak valid." });
      }

      let schema;
      let tenants;
      let tower;
      const isApplicant = req.portalRole === "Applicant";
      const draftId =
        !isApplicant || input.draft_id === undefined
          ? null
          : parseDraftId(input.draft_id);
      if (!isApplicant && input.draft_id !== undefined) {
        return forbidden(res);
      }
      if (input.draft_id !== undefined && draftId === null) {
        return res.status(400).json({ error: "ID draft tidak valid." });
      }
      try {
        schema = await getSchema();
        if (isApplicant && draftId !== null) {
          const ownedDraft = await database(ATTEMPT_COLLECTION)
            .select("id")
            .where({
              id: draftId,
              user_created: req.accountability.user,
              status: "Draft",
              attempt_type: "New Registration",
            })
            .first();
          if (!ownedDraft) {
            return res.status(404).json({ error: "Draft tidak ditemukan atau sudah dikirim." });
          }
        }
        tenants = sanitizeTenantEntries(input);
        tower = await sanitizeTowerSubmission(
          {
            ...input,
            document: null,
          },
          { database, accountability: req.accountability },
        );
      } catch (error) {
        if (error instanceof AdministrativeRegionLookupError) {
          logger.error(error, "Failed to resolve administrative regions for manual registration");
          return res.status(500).json({
            error: "Wilayah administratif tidak dapat ditentukan saat ini. Coba lagi.",
          });
        }
        const errors = [{
          field: error.field ?? "data",
          message: error.message ?? "Data menara tidak memenuhi ketentuan.",
        }];
        try {
          const { attemptId, emailSent } = await rejectRegistration(
            req.accountability.user,
            "Input Manual",
            input,
            errors,
            { draftId },
          );
          return res.status(422).json({ errors, attempt_id: attemptId, email_sent: emailSent });
        } catch (persistError) {
          logger.error(persistError, "Failed to persist rejected manual registration");
          return res.status(500).json({
            error: "Data ditolak, tetapi riwayat penolakan tidak dapat disimpan.",
          });
        }
      }

      try {
        const registeredAt = new Date();
        const created = await createRegisteredTowers({
          database,
          ItemsService,
          schema,
          userId: req.accountability.user,
          method: "Input Manual",
          registrations: [{ tower, tenants }],
          draftId,
          registeredAt,
        });
        const emailSent = await sendRegistrationReceipts({
          database,
          QRCode,
          MailService,
          getSchema,
          logger,
          userId: req.accountability.user,
          registrations: [{ tower, tenants }],
          created,
          registeredAt,
        });
        return res.status(201).json({
          data: {
            id: created[0].id,
            status: "Registered",
            email_sent: emailSent,
          },
        });
      } catch (error) {
        if (error?.code === "23505") {
          const errors = [{
            field: "id_menara",
            message: "ID menara tersebut sudah terdaftar.",
          }];
          try {
            const { attemptId, emailSent } = await rejectRegistration(
              req.accountability.user,
              "Input Manual",
              input,
              errors,
              { draftId },
            );
            return res.status(409).json({ errors, attempt_id: attemptId, email_sent: emailSent });
          } catch (persistError) {
            logger.error(persistError, "Failed to persist duplicate registration attempt");
          }
        }
        logger.error(error, "Failed to create normalized manual registration");
        return res.status(500).json({ error: "Pendaftaran menara tidak dapat disimpan." });
      }
    });

    router.post("/towers/validation-failure-email", async (req, res) => {
      if (req.portalRole !== "Applicant") return forbidden(res);
      const errors = req.body?.errors;
      if (
        !Array.isArray(errors) ||
        errors.length === 0 ||
        errors.length > 50 ||
        errors.some(
          (error) =>
            !error ||
            typeof error.message !== "string" ||
            (error.field !== undefined &&
              (typeof error.field !== "string" ||
                !VALIDATION_FIELDS.has(error.field))) ||
            (error.column !== undefined &&
              (typeof error.column !== "string" ||
                !VALIDATION_FIELDS.has(error.column))),
        )
      ) {
        return res.status(400).json({ error: "Daftar kesalahan validasi tidak valid." });
      }

      try {
        await sendValidationFailureEmail(req.accountability.user, errors);
        return res.status(204).end();
      } catch (error) {
        logger.error(error, "Failed to send Applicant validation failure email");
        return res.status(502).json({
          error: "Email pemberitahuan kegagalan validasi tidak dapat dikirim.",
        });
      }
    });

    router.get("/towers/export.csv", async (req, res) => {
      try {
        const schema = await getSchema();
        const { data: towers } = await readTowers(
          ItemsService,
          database,
          req.accountability,
          schema,
          req.portalRole,
          { page: 1, limit: 10000 },
        );
        return res
          .type("text/csv; charset=utf-8")
          .attachment("data-registrasi-menara.csv")
          .send(csvForTowers(towers));
      } catch (error) {
        logger.error(error, "Failed to export portal tower history");
        return res.status(500).json({ error: "Data pendaftaran tidak dapat diunduh." });
      }
    });

    router.get("/towers/:id", async (req, res) => {
      try {
        const schema = await getSchema();
        const tower = await readAccessibleTower(
          ItemsService,
          database,
          req.accountability,
          schema,
          req.portalRole,
          req.params.id,
        );
        if (!tower) return res.status(404).json({ error: "Data menara tidak ditemukan." });
        return res.json({ data: tower });
      } catch (error) {
        logger.error(error, "Failed to read Applicant tower details");
        return res.status(500).json({ error: "Detail pendaftaran tidak dapat dimuat." });
      }
    });

    router.patch("/towers/:id", async (req, res) => {
      if (req.portalRole !== "Applicant") return forbidden(res);
      const input = req.body;
      if (!input || typeof input !== "object" || Array.isArray(input)) {
        return res.status(400).json({ error: "Data menara tidak valid." });
      }

      try {
        const schema = await getSchema();
        const tower = await readAccessibleTower(
          ItemsService,
          database,
          req.accountability,
          schema,
          req.portalRole,
          req.params.id,
        );
        if (!tower) return res.status(404).json({ error: "Data menara tidak ditemukan." });
        if (
          input.id_menara !== undefined &&
          input.id_menara !== tower.id_menara
        ) {
          const errors = [{
            field: "id_menara",
            message: "ID menara tidak dapat diubah. Untuk menara lain, buat pendaftaran baru.",
          }];
          try {
            const { attemptId, emailSent } = await rejectRegistration(
              req.accountability.user,
              tower.metode_pendaftaran,
              input,
              errors,
              { towerId: tower.id, attemptType: "Update" },
            );
            return res.status(422).json({
              errors,
              attempt_id: attemptId,
              email_sent: emailSent,
            });
          } catch (error) {
            logger.error(error, "Failed to persist rejected tower update");
            return res.status(500).json({
              error: "Perubahan ditolak, tetapi riwayat penolakan tidak dapat disimpan.",
            });
          }
        }

        const merged = { ...tower, ...input, id_menara: tower.id_menara };
        let tenantEntries;
        let updates;
        try {
          tenantEntries = sanitizeTenantEntries(merged);
          updates = await sanitizeTowerUpdate(merged, {
            database,
            accountability: req.accountability,
          });
        } catch (error) {
          const errors = [{
            field: error.field ?? "data",
            message: error.message ?? "Data menara tidak memenuhi ketentuan.",
          }];
          try {
            const { attemptId, emailSent } = await rejectRegistration(
              req.accountability.user,
              tower.metode_pendaftaran,
              input,
              errors,
              { towerId: tower.id, attemptType: "Update" },
            );
            return res.status(422).json({
              errors,
              attempt_id: attemptId,
              email_sent: emailSent,
            });
          } catch (persistError) {
            logger.error(persistError, "Failed to persist rejected tower update");
            return res.status(500).json({
              error: "Perubahan ditolak, tetapi riwayat penolakan tidak dapat disimpan.",
            });
          }
        }

        await database.transaction(async (transaction) => {
          const towerService = new ItemsService(COLLECTION, {
            schema,
            accountability: null,
            knex: transaction,
          });
          const tenantService = new ItemsService(TENANT_COLLECTION, {
            schema,
            accountability: null,
            knex: transaction,
          });
          const attempts = new ItemsService(ATTEMPT_COLLECTION, {
            schema,
            accountability: null,
            knex: transaction,
          });
          await towerService.updateOne(req.params.id, updates);

          const existingTenants = await transaction(TENANT_COLLECTION)
            .select("id")
            .where({ tower_id: req.params.id })
            .orderBy("sort")
            .orderBy("id");
          const retainedIds = [];
          for (const [index, tenant] of tenantEntries.entries()) {
            if (existingTenants[index]) {
              const tenantId = existingTenants[index].id;
              await tenantService.updateOne(tenantId, {
                penyelenggara: tenant.penyelenggara,
              });
              retainedIds.push(tenantId);
              await transaction("directus_activity").insert({
                action: "update",
                user: req.accountability.user,
                collection: TENANT_COLLECTION,
                item: String(tenantId),
                timestamp: new Date().toISOString(),
              });
            } else {
              const tenantId = await tenantService.createOne({
                tower_id: req.params.id,
                user_created: req.accountability.user,
                penyelenggara: tenant.penyelenggara,
              });
              await setRecordCreator(
                transaction,
                TENANT_COLLECTION,
                tenantId,
                req.accountability.user,
              );
              retainedIds.push(tenantId);
              await transaction("directus_activity").insert({
                action: "create",
                user: req.accountability.user,
                collection: TENANT_COLLECTION,
                item: String(tenantId),
                timestamp: new Date().toISOString(),
              });
            }
          }
          const removedIds = existingTenants
            .map(({ id }) => id)
            .filter((id) => !retainedIds.includes(id));
          if (removedIds.length) {
            await tenantService.deleteMany(removedIds);
            await transaction("directus_activity").insert(
              removedIds.map((id) => ({
                action: "delete",
                user: req.accountability.user,
                collection: TENANT_COLLECTION,
                item: String(id),
                timestamp: new Date().toISOString(),
              })),
            );
          }
          const attemptId = await attempts.createOne({
            user_created: req.accountability.user,
            tower_id: req.params.id,
            status: "Registered",
            attempt_type: "Update",
            metode_pendaftaran: tower.metode_pendaftaran,
            submission_data: { ...updates, tenants: tenantEntries },
            validation_errors: null,
          });
          await setRecordCreator(
            transaction,
            ATTEMPT_COLLECTION,
            attemptId,
            req.accountability.user,
          );
          await transaction("directus_activity").insert({
            action: "update",
            user: req.accountability.user,
            collection: COLLECTION,
            item: req.params.id,
            timestamp: new Date().toISOString(),
          });
          await transaction("directus_activity").insert({
            action: "create",
            user: req.accountability.user,
            collection: ATTEMPT_COLLECTION,
            item: String(attemptId),
            timestamp: new Date().toISOString(),
          });
        });
        return res.status(204).end();
      } catch (error) {
        logger.error(error, "Failed to update Applicant-owned tower");
        return res.status(500).json({ error: "Data menara tidak dapat diperbarui." });
      }
    });

    router.delete("/towers/:id", async (req, res) => {
      try {
        const schema = await getSchema();
        const tower = await readAccessibleTower(
          ItemsService,
          database,
          req.accountability,
          schema,
          req.portalRole,
          req.params.id,
        );
        if (!tower) return res.status(404).json({ error: "Data menara tidak ditemukan." });

        await database.transaction(async (transaction) => {
          const service = new ItemsService(COLLECTION, {
            schema,
            accountability: null,
            knex: transaction,
          });
          await service.updateOne(req.params.id, {
            deleted_at: new Date().toISOString(),
            is_archived: true,
          });
          await transaction("directus_activity").insert({
            action: "delete",
            user: req.accountability.user,
            collection: COLLECTION,
            item: req.params.id,
            timestamp: new Date().toISOString(),
          });
        });
        return res.status(204).end();
      } catch (error) {
        logger.error(error, "Failed to soft-delete portal tower");
        return res.status(500).json({ error: "Data menara tidak dapat dihapus." });
      }
    });

    router.post("/towers/delete", async (req, res) => {
      const ids = req.body?.ids;
      if (!validateBulkDeleteIds(ids)) {
        return res.status(400).json({
          error: `Pilih 1 sampai ${MAX_BULK_DELETE} data menara yang berbeda.`,
        });
      }

      try {
        const schema = await getSchema();
        const eligibleQuery = database(COLLECTION)
          .select("id")
          .whereIn("id", ids)
          .whereNull("deleted_at");
        if (req.portalRole === "Applicant") {
          eligibleQuery.where("user_created", req.accountability.user);
        }
        const eligibleIds = await eligibleQuery;
        if (eligibleIds.length !== ids.length) {
          return res.status(404).json({
            error: "Sebagian data tidak ditemukan, bukan milik akun Anda, atau sudah diarsipkan. Tidak ada data yang diubah.",
          });
        }

        await database.transaction(async (transaction) => {
          const transactionalService = new ItemsService(COLLECTION, {
            schema,
            accountability: null,
            knex: transaction,
          });
          await transactionalService.updateMany(ids, {
            deleted_at: new Date().toISOString(),
            is_archived: true,
          });
          const timestamp = new Date().toISOString();
          await transaction("directus_activity").insert(
            ids.map((id) => ({
              action: "delete",
              user: req.accountability.user,
              collection: COLLECTION,
              item: id,
              timestamp,
            })),
          );
        });
        return res.json({ data: { deleted: eligibleIds.length } });
      } catch (error) {
        logger.error(error, "Failed to bulk soft-delete portal towers");
        return res.status(500).json({ error: "Data menara tidak dapat dihapus." });
      }
    });

    router.get("/audit", async (req, res) => {
      if (!MANAGER_ROLES.has(req.portalRole)) return forbidden(res);
      try {
        const page = parsePage(req.query.page);
        const limit = parsePageSize(req.query.limit);
        const filter = {
          _or: [
            { collection: { _eq: COLLECTION } },
            { collection: { _eq: TENANT_COLLECTION } },
            { collection: { _eq: ATTEMPT_COLLECTION } },
            { collection: { _eq: "directus_users" } },
          ],
        };
        const [{ count }] = await database("directus_activity")
          .whereIn("collection", [
            COLLECTION,
            TENANT_COLLECTION,
            ATTEMPT_COLLECTION,
            "directus_users",
          ])
          .count({ count: "id" });
        const auditService = new ItemsService("directus_activity", {
          schema: await getSchema(),
          accountability: null,
        });
        const data = await auditService.readByQuery({
          filter,
          fields: [
            "id",
            "action",
            "collection",
            "timestamp",
            "user.first_name",
            "user.last_name",
          ],
          sort: ["-timestamp"],
          limit,
          offset: (page - 1) * limit,
        });
        return res.json({
          data,
          meta: { page, limit, total: Number(count) },
        });
      } catch (error) {
        logger.error(error, "Failed to read portal audit log");
        return res.status(500).json({ error: "Audit log tidak dapat dimuat." });
      }
    });

    router.get("/users", async (req, res) => {
      if (!isAdministrator(req.portalRole)) return forbidden(res);
      try {
        const roles = await getPortalRoleIds(database);
        const roleById = new Map(roles.map(({ id, name }) => [id, name]));
        const page = parsePage(req.query.page);
        const limit = parsePageSize(req.query.limit);
        const users = new ItemsService("directus_users", {
          schema: await getSchema(),
          accountability: null,
        });
        const data = await users.readByQuery({
          filter: {
            role: { _in: roles.map(({ id }) => id) },
          },
          fields: [
            "id",
            "email",
            "first_name",
            "last_name",
            "status",
            "role",
            "last_access",
          ],
          sort: ["email"],
          limit,
          offset: (page - 1) * limit,
        });
        const [{ count }] = await database("directus_users")
          .whereIn("role", roles.map(({ id }) => id))
          .count({ count: "id" });
        return res.json({
          data: data.map((user) => ({
            ...user,
            role_name: roleById.get(user.role) ?? "Unknown",
          })),
          roles: roles.map(({ id, name }) => ({ id, name })),
          meta: { page, limit, total: Number(count) },
        });
      } catch (error) {
        logger.error(error, "Failed to read portal user list");
        return res.status(500).json({ error: "Daftar akun tidak dapat dimuat." });
      }
    });

    router.post("/users/invite", async (req, res) => {
      if (!isAdministrator(req.portalRole)) return forbidden(res);
      const email =
        typeof req.body?.email === "string"
          ? req.body.email.trim().toLowerCase()
          : "";
      const roleName = req.body?.role;
      if (
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !USER_ROLE_NAMES.includes(roleName)
      ) {
        return res.status(400).json({ error: "Email atau role akun tidak valid." });
      }

      try {
        const existing = await database("directus_users")
          .select("id", "status")
          .whereRaw("LOWER(??) = ?", ["email", email])
          .first();
        if (existing) {
          return res.status(409).json({
            error: "Email sudah terdaftar. Gunakan pengelolaan akun yang ada.",
          });
        }
        const roleId = roleIdByName(await getPortalRoleIds(database), roleName);
        if (!roleId) {
          return res.status(409).json({ error: "Role tujuan tidak tersedia." });
        }
        const portalUrl = env.PORTAL_URL ?? "http://localhost:3000";
        const inviteUrl = new URL("/set-password?mode=invite", portalUrl).toString();
        const users = new UsersService({
          schema: await getSchema(),
          accountability: req.accountability,
        });
        await users.inviteUser(
          email,
          roleId,
          inviteUrl,
          "Undangan akun Portal Infrastruktur Pasif",
        );
        return res.status(202).json({
          data: { invited: true },
          message: "Undangan dikirim ke alamat email yang diberikan.",
        });
      } catch (error) {
        logger.error(error, "Failed to invite portal user");
        return res.status(500).json({ error: "Undangan akun tidak dapat dikirim." });
      }
    });

    router.patch("/users/:id", async (req, res) => {
      if (!isAdministrator(req.portalRole)) return forbidden(res);
      const {
        role: requestedRole,
        status: requestedStatus,
        email: requestedEmail,
      } = req.body ?? {};
      const normalizedEmail =
        typeof requestedEmail === "string" ? requestedEmail.trim().toLowerCase() : "";
      if (
        (requestedRole !== undefined &&
          !USER_ROLE_NAMES.includes(requestedRole)) ||
        (requestedStatus !== undefined &&
          !["active", "suspended"].includes(requestedStatus)) ||
        (requestedEmail !== undefined &&
          (normalizedEmail.length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail))) ||
        (requestedRole === undefined &&
          requestedStatus === undefined &&
          requestedEmail === undefined)
      ) {
        return res.status(400).json({
          error: "Perubahan email, role, atau status tidak valid.",
        });
      }
      if (req.params.id === req.accountability.user) {
        return res.status(400).json({
          error: "Akun Super Admin yang sedang digunakan tidak dapat diubah dari menu ini.",
        });
      }

      try {
        const roles = await getPortalRoleIds(database);
        const target = await database("directus_users")
          .select("id", "email", "role", "status")
          .where({ id: req.params.id })
          .first();
        if (!target) return res.status(404).json({ error: "Akun tidak ditemukan." });
        const targetEmail =
          typeof target.email === "string" ? target.email.toLowerCase() : "";
        if (requestedEmail !== undefined && normalizedEmail !== targetEmail) {
          const duplicate = await database("directus_users")
            .select("id")
            .whereRaw("LOWER(??) = ?", ["email", normalizedEmail])
            .whereNot({ id: req.params.id })
            .first();
          if (duplicate) {
            return res.status(409).json({
              error: "Email sudah digunakan oleh akun lain.",
            });
          }
        }

        const currentRole = roles.find(({ id }) => id === target.role)?.name;
        const nextRole = requestedRole ?? currentRole;
        const nextStatus = requestedStatus ?? target.status;
        if (
          currentRole === "Administrator" &&
          (nextRole !== "Administrator" || nextStatus !== "active")
        ) {
          const adminRoleId = roleIdByName(roles, "Administrator");
          const [{ count }] = await database("directus_users")
            .where({ role: adminRoleId, status: "active" })
            .count({ count: "id" });
          if (Number(count) <= 1) {
            return res.status(409).json({
              error: "Super Admin aktif terakhir tidak dapat dinonaktifkan atau diturunkan role-nya.",
            });
          }
        }

        const updates = {};
        if (requestedEmail !== undefined) updates.email = normalizedEmail;
        if (requestedRole !== undefined) {
          const roleId = roleIdByName(roles, requestedRole);
          if (!roleId) return res.status(409).json({ error: "Role tujuan tidak tersedia." });
          updates.role = roleId;
        }
        if (requestedStatus !== undefined) updates.status = requestedStatus;
        const users = new UsersService({
          schema: await getSchema(),
          accountability: req.accountability,
        });
        await users.updateOne(req.params.id, updates);
        return res.json({ data: { updated: true } });
      } catch (error) {
        logger.error(error, "Failed to update portal user");
        return res.status(500).json({ error: "Perubahan akun tidak dapat disimpan." });
      }
    });

    router.post("/users/:id/password-reset", async (req, res) => {
      if (!isAdministrator(req.portalRole)) return forbidden(res);
      try {
        const target = await database("directus_users")
          .select("email", "status")
          .where({ id: req.params.id })
          .first();
        if (!target) return res.status(404).json({ error: "Akun tidak ditemukan." });
        if (target.status !== "active") {
          return res.status(409).json({
            error: "Reset password hanya tersedia untuk akun aktif.",
          });
        }
        const portalUrl = env.PORTAL_URL ?? "http://localhost:3000";
        const resetUrl = new URL("/set-password?mode=reset", portalUrl).toString();
        const users = new UsersService({
          schema: await getSchema(),
          accountability: req.accountability,
        });
        await users.requestPasswordReset(
          target.email,
          resetUrl,
          "Permintaan reset password Portal Infrastruktur Pasif",
        );
        return res.status(202).json({
          data: { requested: true },
          message: "Tautan reset dikirim ke email pemilik akun.",
        });
      } catch (error) {
        logger.error(error, "Failed to request portal user password reset");
        return res.status(500).json({ error: "Tautan reset tidak dapat dikirim." });
      }
    });

    router.post("/password", async (req, res) => {
      try {
        const account = await database("directus_users")
          .select("email", "status")
          .where({ id: req.accountability.user })
          .first();
        if (!account?.email || account.status !== "active") {
          return res.status(401).json({ error: "Akun tidak aktif." });
        }
        const portalUrl = env.PORTAL_URL ?? "http://localhost:3000";
        const resetUrl = new URL("/set-password?mode=reset", portalUrl).toString();
        const users = new UsersService({
          schema: await getSchema(),
          accountability: req.accountability,
        });
        await users.requestPasswordReset(
          account.email,
          resetUrl,
          "Permintaan perubahan password Portal Infrastruktur Pasif",
        );
        return res.status(202).json({
          data: { requested: true },
          message: "Tautan verifikasi perubahan password dikirim ke email akun Anda.",
        });
      } catch (error) {
        logger.error(error, "Failed to request own portal password reset");
        return res.status(500).json({ error: "Tautan verifikasi tidak dapat dikirim." });
      }
    });
  },
);
