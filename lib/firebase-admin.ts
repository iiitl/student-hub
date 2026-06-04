import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { getFirestore } from 'firebase-admin/firestore'

type ServiceAccount = {
  project_id: string
  client_email: string
  private_key: string
}

function parseServiceAccount(raw: string): ServiceAccount {
  const parsed = JSON.parse(raw) as Partial<ServiceAccount>

  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    throw new Error(
      'MESS_DB_CREDENTIAL must include project_id, client_email, and private_key'
    )
  }

  return {
    project_id: parsed.project_id,
    client_email: parsed.client_email,
    private_key: parsed.private_key.replace(/\\n/g, '\n'),
  }
}

export function getFirebaseAdminDb(
  databaseURL: string,
  credentialJson: string
) {
  if (!getApps().length) {
    const serviceAccount = parseServiceAccount(credentialJson)

    initializeApp({
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      }),
      databaseURL,
    })
  }

  return getDatabase()
}

export function getFirebaseAdminFirestore(credentialJson: string) {
  if (!getApps().length) {
    const serviceAccount = parseServiceAccount(credentialJson)

    initializeApp({
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      }),
    })
  }

  return getFirestore()
}
