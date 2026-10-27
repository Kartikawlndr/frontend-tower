export const TOWER_COLLECTION = "tower_infrastruktur";
export const TENANT_COLLECTION = "tower_tenant";
export const ATTEMPT_COLLECTION = "tower_registration_attempts";

function service(ItemsService, collection, schema, knex) {
  return new ItemsService(collection, {
    schema,
    accountability: null,
    knex,
  });
}

function activity(userId, collection, item) {
  return {
    action: "create",
    user: userId,
    collection,
    item: String(item),
    timestamp: new Date().toISOString(),
  };
}

async function nextRegistrationCode(transaction) {
  const result = await transaction.raw(
    "UPDATE tower_registration_code_counter SET last_value = last_value + 1 WHERE singleton = true RETURNING last_value",
  );
  const lastValue = result.rows?.[0]?.last_value;
  if (!Number.isInteger(lastValue) || lastValue < 1 || lastValue > 999999) {
    throw new Error("Could not allocate a registration code.");
  }
  return `REG-${String(lastValue).padStart(6, "0")}`;
}

export async function setRecordCreator(transaction, collection, id, userId) {
  const updated = await transaction(collection)
    .where({ id })
    .update({ user_created: userId });
  if (updated !== 1) {
    throw new Error(`Could not assign the owner for ${collection} record ${id}.`);
  }
}

export async function createRejectedAttempt({
  database,
  ItemsService,
  schema,
  userId,
  method,
  submissionData,
  validationErrors,
  towerId = null,
  attemptType = "New Registration",
  draftId = null,
}) {
  return database.transaction(async (transaction) => {
    const attempts = service(
      ItemsService,
      ATTEMPT_COLLECTION,
      schema,
      transaction,
    );
    const attemptData = {
      tower_id: towerId,
      status: "Rejected",
      attempt_type: attemptType,
      metode_pendaftaran: method,
      submission_data: submissionData,
      validation_errors: validationErrors,
    };
    let id;
    let action = "create";
    if (draftId !== null) {
      const existing = await transaction(ATTEMPT_COLLECTION)
        .select("id")
        .where({ id: draftId, user_created: userId, status: "Draft" })
        .forUpdate()
        .first();
      if (!existing) throw new Error("Applicant draft is no longer available.");
      await attempts.updateOne(draftId, {
        ...attemptData,
        user_created: userId,
      });
      id = draftId;
      action = "update";
    } else {
      id = await attempts.createOne({
        user_created: userId,
        ...attemptData,
      });
      await setRecordCreator(
        transaction,
        ATTEMPT_COLLECTION,
        id,
        userId,
      );
    }
    await transaction("directus_activity").insert(
      { ...activity(userId, ATTEMPT_COLLECTION, id), action },
    );
    return id;
  });
}

export async function createRegisteredTowers({
  database,
  ItemsService,
  schema,
  userId,
  method,
  registrations,
  documentId = null,
  draftId = null,
}) {
  return database.transaction(async (transaction) => {
    if (draftId !== null && registrations.length !== 1) {
      throw new Error("A draft can only be submitted as one tower.");
    }
    const towers = service(ItemsService, TOWER_COLLECTION, schema, transaction);
    const tenants = service(ItemsService, TENANT_COLLECTION, schema, transaction);
    const attempts = service(
      ItemsService,
      ATTEMPT_COLLECTION,
      schema,
      transaction,
    );
    const created = [];

    for (const registration of registrations) {
      const firstTenant = registration.tenants[0];
      if (
        !firstTenant ||
        registration.tenants.some(
          (tenant) =>
            tenant.kapasitas_disewakan !== firstTenant.kapasitas_disewakan,
        )
      ) {
        throw new Error(
          "Kapasitas disewakan harus sama untuk semua tenant pada menara yang sama.",
        );
      }
      const towerId = await towers.createOne({
        ...registration.tower,
        penyelenggara: firstTenant.penyelenggara,
        kapasitas_disewakan: firstTenant.kapasitas_disewakan,
        metode_pendaftaran: method,
        verification_status: "Submitted",
        document: documentId,
        user_created: userId,
      });
      await setRecordCreator(transaction, TOWER_COLLECTION, towerId, userId);

      for (const tenant of registration.tenants) {
        const tenantId = await tenants.createOne({
          tower_id: towerId,
          penyelenggara: tenant.penyelenggara,
          kapasitas_disewakan: tenant.kapasitas_disewakan,
          user_created: userId,
        });
        await setRecordCreator(
          transaction,
          TENANT_COLLECTION,
          tenantId,
          userId,
        );
        await transaction("directus_activity").insert(
          activity(userId, TENANT_COLLECTION, tenantId),
        );
      }

      const registrationCode = await nextRegistrationCode(transaction);
      const attemptData = {
        tower_id: towerId,
        status: "Registered",
        registration_code: registrationCode,
        attempt_type: "New Registration",
        metode_pendaftaran: method,
        submission_data: {
          ...registration.tower,
          tenants: registration.tenants,
          document: documentId,
        },
        validation_errors: null,
      };
      let attemptId;
      let attemptAction = "create";
      if (draftId !== null) {
        const existing = await transaction(ATTEMPT_COLLECTION)
          .select("id")
          .where({ id: draftId, user_created: userId, status: "Draft" })
          .forUpdate()
          .first();
        if (!existing) throw new Error("Applicant draft is no longer available.");
        await attempts.updateOne(draftId, {
          ...attemptData,
          user_created: userId,
        });
        attemptId = draftId;
        attemptAction = "update";
      } else {
        attemptId = await attempts.createOne({
          user_created: userId,
          ...attemptData,
        });
        await setRecordCreator(
          transaction,
          ATTEMPT_COLLECTION,
          attemptId,
          userId,
        );
      }

      await transaction("directus_activity").insert([
        activity(userId, TOWER_COLLECTION, towerId),
        { ...activity(userId, ATTEMPT_COLLECTION, attemptId), action: attemptAction },
      ]);
      created.push({ id: towerId, id_menara: registration.tower.id_menara });
    }

    return created;
  });
}
