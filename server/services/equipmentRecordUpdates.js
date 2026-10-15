const Equipment = require('../models/equipment');
const UPDATES = require('../data/equipmentRecordUpdates');

const empty = v => v === undefined || v === null || v === '';

// Apply each recorded correction once. Safe to run on every start.
async function applyEquipmentRecordUpdates() {
  const results = [];
  for (const u of UPDATES) {
    let doc = null;
    for (const m of u.match) {
      doc = await Equipment.findOne(m);
      if (doc) break;
    }
    if (!doc) { results.push(`${u.key}: no matching record`); continue; }
    if ((doc.appliedUpdates || []).includes(u.key)) continue;

    const changed = [];
    Object.entries(u.replace || {}).forEach(([field, r]) => {
      const cur = doc[field];
      if (empty(cur) || r.from.includes(cur)) {
        if (cur !== r.to) { doc[field] = r.to; changed.push(field); }
      }
    });
    Object.entries(u.atLeast || {}).forEach(([field, v]) => {
      if (!(doc[field] >= v)) { doc[field] = v; changed.push(field); }
    });
    if (u.addNote && !String(doc.notes || '').includes(u.addNote.slice(0, 40))) {
      doc.notes = [doc.notes, u.addNote].filter(Boolean).join(' ');
      changed.push('notes');
    }
    for (const s of u.service || []) {
      const when = new Date(s.date).getTime();
      const exists = (doc.maintenanceRecords || []).some(r => r.date && Math.abs(new Date(r.date).getTime() - when) < 60000);
      if (exists) continue;
      doc.maintenanceRecords.push({
        ...s,
        date: new Date(s.date),
        nextServiceDue: s.nextServiceDue ? { ...s.nextServiceDue, date: s.nextServiceDue.date ? new Date(s.nextServiceDue.date) : undefined } : undefined
      });
      changed.push('service');
    }
    doc.appliedUpdates = [...(doc.appliedUpdates || []), u.key];
    await doc.save();
    results.push(`${u.key}: ${doc.title} (${changed.join(', ') || 'no changes needed'})`);
  }
  return results;
}

module.exports = { applyEquipmentRecordUpdates };
