// Type definitions as JSDoc comments for reference
// No actual TypeScript code, just documentation

/**
 * @typedef {Object} UserSession
 * @property {string} email
 * @property {string} childName
 * @property {string} childGender
 */

/**
 * @typedef {Object} Appointment
 * @property {string} doctor
 * @property {string} date
 * @property {string} time
 */

/**
 * @typedef {Object} Medication
 * @property {string} name
 * @property {string} dosage
 * @property {string} frequency
 */

/**
 * @typedef {Object} Allergy
 * @property {string} name
 * @property {string} severity
 * @property {string} reaction
 */

/**
 * @typedef {Object} GrowthRecord
 * @property {string} date
 * @property {number} height
 * @property {number} weight
 */

/**
 * @typedef {Object} Symptom
 * @property {number} id
 * @property {string} name
 * @property {string} severity
 * @property {string} date
 * @property {string} notes
 */

/**
 * @typedef {Object} Vaccination
 * @property {number} id
 * @property {string} name
 * @property {string} dueDate
 * @property {string|null} administeredDate
 * @property {string} notes
 */

/**
 * @typedef {Object} TeethingRecord
 * @property {number} id
 * @property {string} toothName
 * @property {string} eruptionDate
 * @property {string} symptoms
 */

/**
 * @typedef {Object} TemperatureRecord
 * @property {number} id
 * @property {string} datetime
 * @property {number} value
 * @property {string} method
 * @property {string} notes
 */

/**
 * @typedef {Object} JournalEntry
 * @property {number} id
 * @property {string} date
 * @property {string} content
 */

/**
 * @typedef {Object} CustomReminder
 * @property {number} id
 * @property {string} title
 * @property {string} datetime
 * @property {string} notes
 */

/**
 * @typedef {Object} HealthData
 * @property {Appointment[]} appointments
 * @property {Medication[]} medications
 * @property {Allergy[]} allergies
 * @property {GrowthRecord[]} growth
 * @property {Symptom[]} symptoms
 * @property {Vaccination[]} vaccinations
 * @property {TeethingRecord[]} teething
 * @property {TemperatureRecord[]} temperature
 */