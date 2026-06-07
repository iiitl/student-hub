import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const MESS_APP_NAME = 'mess-ease'

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

export function getFirebaseAdminFirestore(credentialJson: string) {
  const existing = getApps().find((app) => app.name === MESS_APP_NAME)
  if (existing) {
    return getFirestore(existing)
  }

  const serviceAccount = parseServiceAccount(credentialJson)
  const app = initializeApp(
    {
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      }),
    },
    MESS_APP_NAME
  )

  return getFirestore(app)
}
