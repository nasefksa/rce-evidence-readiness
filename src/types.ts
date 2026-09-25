/**
 * Domain types shared across the RCE engines.
 *
 * These mirror the Site Event Causation Object (SECO) defined in the RCE
 * business plan (§3.3). Only the fields this engine needs are modelled here;
 * the full SECO in the platform carries more.
 */

/** The five initial event classes (business plan §3.4). */
export type EventClass =
  | 'late_information'
  | 'access_obstruction'
  | 'unforeseen_physical_conditions'
  | 'client_designer_instruction'
  | 'predecessor_caused_rework';

export const EVENT_CLASSES: EventClass[] = [
  'late_information',
  'access_obstruction',
  'unforeseen_physical_conditions',
  'client_designer_instruction',
  'predecessor_caused_rework',
];

/** Human-readable labels for the event classes. */
export const EVENT_CLASS_LABELS: Record<EventClass, string> = {
  late_information: 'Late information',
  access_obstruction: 'Access obstruction',
  unforeseen_physical_conditions: 'Unforeseen physical conditions',
  client_designer_instruction: 'Client / designer instruction',
  predecessor_caused_rework: 'Predecessor-caused rework',
};

/** A single evidence item attached to (or missing from) a SECO. */
export interface EvidenceItem {
  /** Requirement key, e.g. 'workfront_photo'. */
  type: string;
  /** Whether the item is on record. */
  present: boolean;
}

/**
 * The minimal Site Event Causation Object this engine operates on.
 * Dates are ISO 8601 strings (date or date-time).
 */
export interface Seco {
  id: string;
  eventClass: EventClass;
  /** When the organisation became aware of the occurrence (drives the clock). */
  awarenessDate?: string;
  /** When the occurrence physically happened (drives evidence decay). */
  occurredDate?: string;
  /** Evidence currently held / missing. */
  evidence?: EvidenceItem[];
  /** Optional override of the contract mechanism id for this event. */
  mechanismId?: string;
}
