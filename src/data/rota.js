// Synthetic team rota and planning rules for the visit planner. Made up for the hackathon.
// Staff can change all of this in the Visits tab; these are the starting values.
// days: 1 = Monday ... 5 = Friday. Times are when the person is free for home visits.
window.ROTA = {
  "staff": [
    { "name": "Alison Grey", "role": "Housing officer", "does": ["assess"], "days": [2, 4], "start": "10:00", "end": "14:00" },
    { "name": "Kirsty Bell", "role": "Energy advice", "does": ["assess"], "days": [1, 3], "start": "13:00", "end": "16:30" },
    { "name": "Marco Rossi", "role": "Community support", "does": ["assess"], "days": [1, 3, 5], "start": "09:30", "end": "12:30" },
    { "name": "Dev Patel", "role": "Repairs team", "does": ["fix"], "days": [1, 2, 3, 4, 5], "start": "08:00", "end": "16:00" }
  ],
  "settings": {
    // Working days from today to an assessment visit, by risk band. Our own assumptions, not the law.
    "targets": { "High": 5, "Medium": 20, "Low": 60 },
    // Working days from an assessment to the repair visit, when work is needed.
    "fixTargets": { "High": 5, "Medium": 15, "Low": 30 },
    // Minutes at each home.
    "minutes": { "assess": 60, "fix": 120 },
    // How much risk counts against travel time. 1 = the same, 2 = twice as much.
    "riskWeight": 2
  }
};
