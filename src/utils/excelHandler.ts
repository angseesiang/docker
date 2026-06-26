import * as XLSX from 'xlsx';

// Sheets to ignore when processing Excel data
const IGNORED_SHEETS = ["Get Started", "Glossary", "Track your Progress"];
const SELECTED_AI_TYPE = "Generative AI";

// Column indices for process check data
const PROCESS_CHECK_COLUMNS = {
  outcome_id: 0,
  type_of_ai: 1,
  outcomes: 2,
  process_id: 3,
  process_to_achieve_outcomes: 4,
  evidence_type: 5,
  evidence: 6,
  implementation: 7,
  elaboration: 8,
};

// Merged cell columns that we need to carry forward
const MERGED_CELL_COLUMNS = [
  "outcome_id",
  "type_of_ai",
  "outcomes",
  "process_to_achieve_outcomes",
  "evidence_type",
  "evidence",
];

// Helper to validate process ID (e.g. 1.1.1)
const isValProcessId = (val: any): boolean => {
  if (!val) return false;
  const str = String(val).trim();
  return /^\d+\.\d+\.\d+$/.test(str);
};

// Helper to get text content from SheetJS cell
const getCellValueText = (cell: XLSX.CellObject | undefined): string => {
  if (!cell || cell.v === undefined || cell.v === null) return "";
  return String(cell.v).trim();
};

export interface ProcessCheckAnswer {
  implementation: "Yes" | "No" | "N/A" | null;
  elaboration: string;
}

export interface WorkspaceAnswers {
  [outcomeId: string]: {
    [processId: string]: ProcessCheckAnswer;
  };
}

/**
 * Fetch the template Excel, modify cell values with current answers, and return as ArrayBuffer
 */
export async function exportToExcel(
  templateUrl: string,
  answers: WorkspaceAnswers
): Promise<ArrayBuffer> {
  // Fetch template Excel file from public assets
  const response = await fetch(templateUrl);
  if (!response.ok) {
    throw new Error(`Failed to load Excel template from ${templateUrl}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  
  // Read using SheetJS
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellStyles: true, cellNF: true });
  
  // Flatten answers for easier lookup
  const flatAnswers: { [processId: string]: ProcessCheckAnswer } = {};
  Object.keys(answers).forEach(outcomeId => {
    Object.keys(answers[outcomeId]).forEach(processId => {
      flatAnswers[processId] = answers[outcomeId][processId];
    });
  });

  // Loop through each sheet
  workbook.SheetNames.forEach(sheetName => {
    if (IGNORED_SHEETS.includes(sheetName)) return;
    
    const sheet = workbook.Sheets[sheetName];
    if (!sheet || !sheet['!ref']) return;
    
    const range = XLSX.utils.decode_range(sheet['!ref']);
    
    // Track carried forward values
    const lastValues: { [key: string]: string } = {};
    MERGED_CELL_COLUMNS.forEach(col => { lastValues[col] = ""; });
    
    // Scan rows (skip header row 0, start at row 1)
    for (let r = range.s.r + 1; r <= range.e.r; r++) {
      // Check if row is completely empty
      let isRowEmpty = true;
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = sheet[XLSX.utils.encode_cell({ r, c })];
        if (cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
          isRowEmpty = false;
          break;
        }
      }
      if (isRowEmpty) continue;
      
      // Update carried forward merged values
      Object.entries(PROCESS_CHECK_COLUMNS).forEach(([key, colIdx]) => {
        if (!MERGED_CELL_COLUMNS.includes(key)) return;
        const cell = sheet[XLSX.utils.encode_cell({ r, c: colIdx })];
        const val = getCellValueText(cell);
        if (val !== "") {
          lastValues[key] = val;
        }
      });
      
      // Check process ID
      const processIdCell = sheet[XLSX.utils.encode_cell({ r, c: PROCESS_CHECK_COLUMNS.process_id })];
      const processId = getCellValueText(processIdCell);
      
      if (!isValProcessId(processId)) continue;
      
      // Filter by AI type
      const typeOfAi = lastValues["type_of_ai"];
      if (!typeOfAi.includes(SELECTED_AI_TYPE)) continue;
      
      // Look up answer
      const answer = flatAnswers[processId];
      if (!answer) continue;
      
      // Write implementation status
      const implCellRef = XLSX.utils.encode_cell({ r, c: PROCESS_CHECK_COLUMNS.implementation });
      if (!sheet[implCellRef]) sheet[implCellRef] = {};
      sheet[implCellRef].t = 's';
      sheet[implCellRef].v = answer.implementation || "";
      
      // Write elaboration text
      const elabCellRef = XLSX.utils.encode_cell({ r, c: PROCESS_CHECK_COLUMNS.elaboration });
      if (!sheet[elabCellRef]) sheet[elabCellRef] = {};
      sheet[elabCellRef].t = 's';
      sheet[elabCellRef].v = answer.elaboration || "";
    }
  });
  
  // Write modified workbook to ArrayBuffer
  const output = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return output;
}

/**
 * Import a workbook, parse its sheets, and merge answers into the session data format
 */
export async function importFromExcel(
  file: File,
  templateChecklistJson: any
): Promise<WorkspaceAnswers> {
  const fileData = await file.arrayBuffer();
  const workbook = XLSX.read(fileData, { type: 'array' });
  
  const importedAnswers: WorkspaceAnswers = {};
  
  // Initialize importedAnswers structure from template checklist structure
  Object.keys(templateChecklistJson).forEach(principleKey => {
    const processChecks = templateChecklistJson[principleKey].process_checks;
    Object.keys(processChecks).forEach(processId => {
      const check = processChecks[processId];
      const outcomeId = String(check.outcome_id);
      
      if (!importedAnswers[outcomeId]) {
        importedAnswers[outcomeId] = {};
      }
      importedAnswers[outcomeId][processId] = {
        implementation: null,
        elaboration: "",
      };
    });
  });

  // Loop through sheets in imported workbook
  workbook.SheetNames.forEach(sheetName => {
    if (IGNORED_SHEETS.includes(sheetName)) return;
    
    const sheet = workbook.Sheets[sheetName];
    if (!sheet || !sheet['!ref']) return;
    
    const range = XLSX.utils.decode_range(sheet['!ref']);
    
    // Track carried forward values
    const lastValues: { [key: string]: string } = {};
    MERGED_CELL_COLUMNS.forEach(col => { lastValues[col] = ""; });
    
    for (let r = range.s.r + 1; r <= range.e.r; r++) {
      // Check if empty row
      let isRowEmpty = true;
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = sheet[XLSX.utils.encode_cell({ r, c })];
        if (cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
          isRowEmpty = false;
          break;
        }
      }
      if (isRowEmpty) continue;
      
      // Update carried forward merged values
      Object.entries(PROCESS_CHECK_COLUMNS).forEach(([key, colIdx]) => {
        if (!MERGED_CELL_COLUMNS.includes(key)) return;
        const cell = sheet[XLSX.utils.encode_cell({ r, c: colIdx })];
        const val = getCellValueText(cell);
        if (val !== "") {
          lastValues[key] = val;
        }
      });
      
      // Check process ID
      const processIdCell = sheet[XLSX.utils.encode_cell({ r, c: PROCESS_CHECK_COLUMNS.process_id })];
      const processId = getCellValueText(processIdCell);
      
      if (!isValProcessId(processId)) continue;
      
      // Filter by AI type
      const typeOfAi = lastValues["type_of_ai"];
      if (!typeOfAi.includes(SELECTED_AI_TYPE)) continue;
      
      // Read implementation and elaboration
      const implCell = sheet[XLSX.utils.encode_cell({ r, c: PROCESS_CHECK_COLUMNS.implementation })];
      const elabCell = sheet[XLSX.utils.encode_cell({ r, c: PROCESS_CHECK_COLUMNS.elaboration })];
      
      const rawImpl = getCellValueText(implCell);
      const elaboration = getCellValueText(elabCell);
      
      let implementation: "Yes" | "No" | "N/A" | null = null;
      if (rawImpl === "Yes" || rawImpl === "No" || rawImpl === "N/A") {
        implementation = rawImpl as "Yes" | "No" | "N/A";
      }
      
      // Find outcomeId mapping
      const outcomeId = lastValues["outcome_id"] ? String(lastValues["outcome_id"]).trim() : "";
      
      if (outcomeId && processId) {
        if (!importedAnswers[outcomeId]) {
          importedAnswers[outcomeId] = {};
        }
        importedAnswers[outcomeId][processId] = {
          implementation,
          elaboration,
        };
      }
    }
  });
  
  return importedAnswers;
}
