import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { checkDirectusHealth } from "@/lib/directus";

export async function GET() {
  const serverEnv = getServerEnv();
  const directusStatus = await checkDirectusHealth();

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: {
      directus: {
        configuredUrl: serverEnv.directusUrl,
        healthy: directusStatus.ok,
        status: directusStatus.status,
      },
      database: {
        client: serverEnv.db.client,
        host: serverEnv.db.host,
        port: serverEnv.db.port,
        database: serverEnv.db.database,
        user: serverEnv.db.user,
        connected: false, // direct DB driver pending
      },
      email: {
        transport: serverEnv.email.transport,
        host: serverEnv.email.host,
        port: serverEnv.email.port,
        from: serverEnv.email.from,
      },
      registration: {
        enabled: serverEnv.userRegister,
        role: serverEnv.userRegisterRole,
        allowList: serverEnv.userRegisterAllowList,
      },
      limits: {
        maxPayloadSize: serverEnv.maxPayloadSize,
      },
      admin: {
        email: serverEnv.adminEmail,
      },
    },
  });
}
