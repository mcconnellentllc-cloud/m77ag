// NRCS Conservation Stewardship Program contract 818B0518002 (CSP 2014),
// Phillips County, Colorado. From the farmers.gov Contract Details page Kyle
// sent Oct 18, 2026. Status Completed; decision maker Kyle McConnell.
//
// The page lists 115 practices, all PAID, contract items #11 to #25. It does
// not name the land unit (tract, field or CLU) of each practice, so they are
// not on field cards yet: the practice detail pages or the contract documents
// carry the land units. Items #1 to #10 are not on the page; the listed
// practices total $58,046.60 of the $146,230.56 obligation.

const CONTRACT = {
  number: '818B0518002', program: 'CSP 2014', county: 'Phillips', state: 'CO', status: 'Completed',
  obligation: 146230.56, expires: '2022-12-30', decisionMaker: 'Kyle McConnell',
  source: 'farmers.gov Contract Details, received Oct 18, 2026'
};

// Practices applied each year (all applied Aug 31 of that year, all paid):
// [year, practice code, practice, contract item, count, obligation each]
const PRACTICES = [
  [2018, '528', 'Grazing Management', 21, 13, 81.72], [2018, '328', 'Conservation Crop Rotation', 11, 5, 472.50], [2018, '590', 'Nutrient Management', 16, 5, 1717.50],
  [2019, '528', 'Grazing Management', 22, 13, 81.72], [2019, '328', 'Conservation Crop Rotation', 12, 5, 472.50], [2019, '590', 'Nutrient Management', 17, 5, 1314.46],
  [2020, '528', 'Grazing Management', 23, 13, 81.72], [2020, '328', 'Conservation Crop Rotation', 13, 5, 472.50], [2020, '590', 'Nutrient Management', 18, 5, 1717.50],
  [2021, '528', 'Grazing Management', 24, 13, 81.72], [2021, '328', 'Conservation Crop Rotation', 14, 5, 472.50], [2021, '590', 'Nutrient Management', 19, 5, 1717.50],
  [2022, '528', 'Grazing Management', 25, 13, 81.72], [2022, '328', 'Conservation Crop Rotation', 15, 5, 472.50], [2022, '590', 'Nutrient Management', 20, 5, 1717.50]
].map(([year, code, practice, item, count, each]) => ({ year, code, practice, item, count, each, total: Math.round(count * each * 100) / 100 }));

module.exports = { CONTRACT, PRACTICES };
