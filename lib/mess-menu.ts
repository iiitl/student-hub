export type Particular = {
  type: string
  food: string
  time: string
}

export type DayMenu = {
  particulars: Particular[]
}

export const MESS_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

export const MESS_MEAL_TYPES = [
  'Breakfast',
  'Lunch',
  'Snacks',
  'Dinner',
] as const

export const MESS_MEAL_TIMINGS = [
  '8:30 AM to 10:00 AM',
  '12:30 PM to 2:30 PM',
  '5:00 PM to 6:00 PM',
  '7:30 PM to 9:30 PM',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value)
  return ''
}

function decodeFirestoreValue(value: unknown): unknown {
  if (!isRecord(value)) return value

  if ('stringValue' in value) return asString(value.stringValue)
  if ('integerValue' in value) return asString(value.integerValue)
  if ('doubleValue' in value) return asString(value.doubleValue)
  if ('booleanValue' in value) return Boolean(value.booleanValue)
  if ('nullValue' in value) return null

  if ('mapValue' in value && isRecord(value.mapValue)) {
    const fields = isRecord(value.mapValue.fields) ? value.mapValue.fields : {}
    const decoded: Record<string, unknown> = {}
    for (const [key, nested] of Object.entries(fields)) {
      decoded[key] = decodeFirestoreValue(nested)
    }
    return decoded
  }

  if ('arrayValue' in value && isRecord(value.arrayValue)) {
    const values = Array.isArray(value.arrayValue.values)
      ? value.arrayValue.values
      : []
    return values.map((entry) => decodeFirestoreValue(entry))
  }

  return value
}

function decodeFirestoreDocumentLike(value: unknown): unknown {
  if (!isRecord(value)) return value

  if (isRecord(value.fields)) {
    const decoded: Record<string, unknown> = {}
    for (const [key, fieldValue] of Object.entries(value.fields)) {
      decoded[key] = decodeFirestoreValue(fieldValue)
    }
    return decoded
  }

  return value
}

function normalizeParticular(value: unknown, mealIndex: number): Particular {
  const parsed = decodeFirestoreDocumentLike(value)
  const record = isRecord(parsed) ? parsed : {}

  const fallbackType = MESS_MEAL_TYPES[mealIndex] ?? ''
  const fallbackTime = MESS_MEAL_TIMINGS[mealIndex] ?? ''

  return {
    type: asString(record.type) || fallbackType,
    food: asString(record.food),
    time: asString(record.time) || fallbackTime,
  }
}

function normalizeDay(value: unknown): DayMenu {
  const parsed = decodeFirestoreDocumentLike(value)
  const record = isRecord(parsed) ? parsed : {}

  const rawParticulars = Array.isArray(record.particulars)
    ? record.particulars
    : []
  const particulars = MESS_MEAL_TYPES.map((_, mealIndex) =>
    normalizeParticular(rawParticulars[mealIndex], mealIndex)
  )

  return { particulars }
}

export function normalizeMessMenuPayload(payload: unknown): DayMenu[] {
  const decoded = decodeFirestoreDocumentLike(payload)
  const root = isRecord(decoded) ? decoded : {}
  const rawMenu = Array.isArray(root.menu) ? root.menu : []

  // Android app stores a placeholder at index 0 and uses days 1..7.
  const dayEntries =
    rawMenu.length >= 8 ? rawMenu.slice(1, 8) : rawMenu.slice(0, 7)

  return MESS_DAYS.map((_, dayIndex) => normalizeDay(dayEntries[dayIndex]))
}
