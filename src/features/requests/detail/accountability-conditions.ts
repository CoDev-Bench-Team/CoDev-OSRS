/** The Accountability Form's ACKNOWLEDGEMENT, word for word (spec 012 FR-004).
 *
 *  The lead-in and closing line are `04.1`'s. The eleven conditions are the
 *  project owner's text of 2026-09-26, which replaces the ten the file draws
 *  (spec 012, Clarifications). `check-accountability-form` compares the
 *  rendered box with FR-004, so change the spec first, then this. */
export const ACKNOWLEDGEMENT = {
  leadIn: 'By affixing your signature below you hereby agree to the following conditions:',
  conditions: [
    'It is expected that you will have to take care of the unit. You are responsible for maintaining the equipment/item(s) in working condition while it is in your possession.',
    'That you agree and understand that if the equipment/item(s) are stolen, vandalized, misplaced, destroyed, damaged, or lost, you will reimburse CoDev the amount required to replace or repair them through salary deduction. The amount is based on the current market value minus the wear and tear of the equipment.',
    'The issued equipment/item(s) will be returned in the same working condition upon request or at the termination of employment.',
    'That failure to return the above item(s) will be considered as theft by the company and may lead to criminal and/or civil prosecution. All fees in relation to recovery will be charged to you.',
    'That you will not attempt to modify, alter, or upgrade the equipment/item(s) unless approved by CoDev and facilitated by authorized IT personnel.',
    'You agree to immediately report to CoDev within twenty-four (24) hours any technical malfunction, loss, or damage involving the equipment/item(s), and to return the equipment/item(s) to the office upon the instruction of the IT Department for further inspection or checking.',
    'That you will cover the shipping cost of returned equipment/item(s) to CoDev.',
    'That you will submit yourself to regular IT audit, permit remote access to the machine anytime if needed, and have no expectation of privacy.',
    'Any installation of software from the day the machine was issued shall be administered or performed by authorized IT personnel.',
    'On-site employees shall not bring assigned peripherals, laptops, or machines outside the office premises. When necessary, prior written approval from the corresponding client, supervisor, and IT Department must first be obtained.',
    'Failure to return company-issued machines, peripherals, and other items mentioned above upon clearance or separation from the company may result in the withholding of the employee’s final pay and Certificate of Employment (COE) until such items are returned in good working condition.',
  ],
  closing: 'For your information and guidance.',
} as const;
