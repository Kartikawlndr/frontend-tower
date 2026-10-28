function normalizeRegionName(value) {
  return typeof value === "string" && value.trim()
    ? value.trim().toLocaleUpperCase("id-ID")
    : null;
}

export class AdministrativeRegionLookupError extends Error {
  constructor(cause) {
    super("Administrative region lookup failed.");
    this.name = "AdministrativeRegionLookupError";
    this.cause = cause;
  }
}

export async function resolveAdministrativeRegions(database, registrations) {
  const points = registrations.map(({ tower }, index) => ({
    row_number: index + 1,
    longitude: tower.longitude,
    latitude: tower.latitude,
  }));
  let result;
  try {
    result = await database.raw(
      `WITH input_points AS (
       SELECT *
       FROM jsonb_to_recordset(?::jsonb) AS point(
         row_number integer,
         longitude double precision,
         latitude double precision
       )
     )
     SELECT
       input_points.row_number,
       matched.province,
       matched.regency_city,
       matched.district,
       matched.village
     FROM input_points
     LEFT JOIN LATERAL (
       SELECT province, regency_city, district, village
       FROM indonesian_administrative_boundaries
       WHERE ST_Covers(
         geom,
         ST_SetSRID(ST_MakePoint(input_points.longitude, input_points.latitude), 4326)
       )
       ORDER BY fid
       LIMIT 1
     ) AS matched ON true
     ORDER BY input_points.row_number`,
      [JSON.stringify(points)],
    );
  } catch (error) {
    throw new AdministrativeRegionLookupError(error);
  }
  const rows = result?.rows;
  if (!Array.isArray(rows) || rows.length !== registrations.length) {
    throw new AdministrativeRegionLookupError(
      new Error("PostGIS did not return one administrative result per tower."),
    );
  }

  return registrations.map((registration, index) => {
    const region = rows[index];
    if (region.row_number !== index + 1) {
      throw new AdministrativeRegionLookupError(
        new Error("PostGIS returned administrative results in an invalid order."),
      );
    }

    return {
      ...registration,
      tower: {
        ...registration.tower,
        provinsi: normalizeRegionName(region.province),
        kab_kota: normalizeRegionName(region.regency_city),
        kecamatan: normalizeRegionName(region.district),
        kelurahan: normalizeRegionName(region.village),
      },
    };
  });
}
