function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

export async function sendRegistrationReceipts({
  database,
  QRCode,
  MailService,
  getSchema,
  logger,
  userId,
  registrations,
  created,
  registeredAt,
}) {
  let mail;
  let recipient;
  try {
    const user = await database("directus_users")
      .select("email", "first_name")
      .where({ id: userId })
      .first();
    if (!user?.email) throw new Error("Registration receipt recipient is unavailable.");
    recipient = user;
    mail = new MailService({
      schema: await getSchema(),
      accountability: null,
      knex: database,
    });
  } catch (error) {
    logger.error(error, "Failed to prepare tower registration receipt email");
    return false;
  }

  const registrationDate = new Date(registeredAt).toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
  });
  let allSent = true;

  for (const [index, tower] of created.entries()) {
    try {
      const registration = registrations[index];
      if (!registration) {
        throw new Error("Registration receipt data does not match the created tower.");
      }

      const details = {
        id: tower.id_menara,
        registrationDate,
        constructionYear: String(registration.tower.tahun_pembangunan),
        owner: String(registration.tower.nama_pemilik),
      };
      const qrContent = [
        `ID Menara: ${details.id}`,
        `Tanggal Pendaftaran: ${details.registrationDate}`,
        `Tahun Pembangunan: ${details.constructionYear}`,
        `Nama Pemilik: ${details.owner}`,
      ].join("\n");
      const qrImage = await QRCode.toBuffer(qrContent, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 320,
      });

      await mail.send({
        to: recipient.email,
        subject: `Bukti Pendaftaran Menara ${details.id}`,
        text: [
          `Yth. ${recipient.first_name || "Pengguna"},`,
          "",
          "Pendaftaran menara berhasil. Simpan email ini sebagai bukti pendaftaran.",
          "",
          `ID Menara: ${details.id}`,
          `Tanggal Pendaftaran: ${details.registrationDate}`,
          `Tahun Pembangunan: ${details.constructionYear}`,
          `Nama Pemilik: ${details.owner}`,
          "",
          "QR code terlampir memuat informasi pendaftaran tersebut.",
        ].join("\n"),
        html: [
          `<p>Yth. ${escapeHtml(recipient.first_name || "Pengguna")},</p>`,
          "<p>Pendaftaran menara berhasil. Simpan email ini sebagai bukti pendaftaran.</p>",
          "<dl>",
          `<dt>ID Menara</dt><dd>${escapeHtml(details.id)}</dd>`,
          `<dt>Tanggal Pendaftaran</dt><dd>${escapeHtml(details.registrationDate)}</dd>`,
          `<dt>Tahun Pembangunan</dt><dd>${escapeHtml(details.constructionYear)}</dd>`,
          `<dt>Nama Pemilik</dt><dd>${escapeHtml(details.owner)}</dd>`,
          "</dl>",
          '<p><img src="cid:tower-registration-qr" width="320" height="320" alt="QR code bukti pendaftaran menara" /></p>',
          "<p>QR code memuat ID menara, tanggal pendaftaran, tahun pembangunan, dan nama pemilik.</p>",
        ].join(""),
        attachments: [
          {
            filename: "qr-bukti-pendaftaran.png",
            content: qrImage,
            contentType: "image/png",
            cid: "tower-registration-qr",
          },
        ],
      });
    } catch (error) {
      allSent = false;
      logger.error(error, "Failed to send tower registration receipt email");
    }
  }

  return allSent;
}
